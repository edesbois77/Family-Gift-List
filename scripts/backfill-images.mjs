// scripts/backfill-images.mjs
import { PrismaClient } from "@prisma/client";
import * as cheerio from "cheerio";

const prisma = new PrismaClient();

async function fetchArticleHtml(url) {
  const res = await fetch(url, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (compatible; ScoutedBot/1.0; +https://localhost)",
      accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Fetch failed ${res.status}`);
  return await res.text();
}

function extractMainImage(html, pageUrl) {
  const $ = cheerio.load(html);
  const candidates = [];

  const metas = [
    $('meta[property="og:image:secure_url"]').attr("content"),
    $('meta[property="og:image"]').attr("content"),
    $('meta[name="og:image"]').attr("content"),
    $('meta[name="twitter:image"]').attr("content"),
    $('meta[name="twitter:image:src"]').attr("content"),
    $('link[rel="image_src"]').attr("href"),
  ];
  metas.forEach((v) => v && candidates.push(v));

  if (!candidates.length) {
    const lazy =
      $("article img[data-src]").first().attr("data-src") ||
      $("main img[data-src]").first().attr("data-src");
    if (lazy) candidates.push(lazy);
  }
  if (!candidates.length) {
    const img =
      $("article img[src]").first().attr("src") ||
      $("main img[src]").first().attr("src") ||
      $("img[src]").first().attr("src");
    if (img) candidates.push(img);
  }
  if (!candidates.length) return null;

  candidates.sort((a, b) => scoreImg(b) - scoreImg(a));
  const chosen = absolutizeUrl(candidates[0], pageUrl);
  return chosen || null;
}

function absolutizeUrl(url, base) {
  try {
    return new URL(url, base).toString();
  } catch {
    return url;
  }
}

function scoreImg(u) {
  let score = 0;
  if (/(\b|_)(\d{3,4})x(\d{3,4})(\b|_)/i.test(u)) score += 5;
  if (/og|opengraph|social|share|large|xl|1080|1200|1600/.test(u)) score += 3;
  if (/original|cdn|images\/.*\.(jpg|jpeg|png|webp)$/i.test(u)) score += 2;
  return score;
}

(async () => {
  try {
    const items = await prisma.article.findMany({
      where: { OR: [{ imageUrl: null }, { imageUrl: "" }] },
      take: 1000,
    });
    console.log(`Found ${items.length} articles needing images...`);

    let updated = 0;
    for (const a of items) {
      try {
        const html = await fetchArticleHtml(a.url);
        const img = extractMainImage(html, a.url);
        if (img) {
          await prisma.article.update({
            where: { id: a.id },
            data: { imageUrl: img },
          });
          updated++;
          console.log("✓", a.id, img);
        } else {
          console.log("– no image", a.id, a.url);
        }
      } catch (e) {
        console.log("x", a.id, (e && e.message) || String(e));
      }
    }
    console.log(`Done. Updated ${updated} articles.`);
  } finally {
    await prisma.$disconnect();
  }
})();