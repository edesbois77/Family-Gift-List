export const runtime = 'nodejs';

// src/app/api/fetch/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { SOURCES } from "@/lib/sources";
import {
  getRssItems,
  fetchArticleHtml,
  extractMainText,
  extractMainImage,
} from "@/lib/pipeline";

// ------------------------
// Team tagging, Tottenham for now
// ------------------------
const TEAM_KEYWORDS: Record<string, { include: string[]; exclude: string[] }> = {
  tottenham: {
    include: [
      "tottenham",
      "tottenham hotspur",
      "spurs",
      "thfc",
      "ange postecoglou",
      "son heung-min",
      "heung-min son",
      "james maddison",
      "maddison",
      "richarlison",
      "brennan johnson",
      "dejan kulusevski",
      "kulusevski",
      "cristian romero",
      "romero",
      "bissouma",
      "pape sarr",
      "udogie",
      "dragusin",
      "lo celso",
      "tottenhamhotspur.com",
    ],
    exclude: [
      "arsenal",
      "chelsea",
      "west ham",
      "manchester united",
      "man united",
      "man utd",
      "manchester city",
      "liverpool",
      "newcastle",
      "aston villa",
      "everton",
      "premier league roundup",
      "fa cup draw",
      "transfer roundup",
    ],
  },
};

function wordsRegex(words: string[]) {
  const escaped = words.map((w) =>
    w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+")
  );
  return new RegExp(`(?:^|\\W)(?:${escaped.join("|")})(?:\\W|$)`, "i");
}

function isAboutTeam(
  a: { title?: string | null; summary?: string | null; source?: string | null; url?: string | null },
  team: string
) {
  const dict = TEAM_KEYWORDS[team];
  if (!dict) return false;
  const text = [a.title || "", a.summary || "", a.source || "", a.url || ""]
    .join(" ")
    .toLowerCase();

  const inc = wordsRegex(dict.include);
  const exc = wordsRegex(dict.exclude);
  if (!inc.test(text)) return false;
  if (exc.test(text) && !inc.test(text)) return false;
  return true;
}

function safeScore(a: { title?: string | null; summary?: string | null; source?: string | null; publishedAt?: Date | string | null }) {
  let s = 0;
  if (a.title) s += Math.min(a.title.length, 120) / 12;
  if (a.summary) s += Math.min(a.summary.length, 400) / 40;
  if (a.source) s += 5;
  if (a.publishedAt) s += 10;
  return Math.round(s);
}

function normalizeUrl(raw: string) {
  try {
    const u = new URL(raw);
    // remove common trackers
    ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid", "fbclid", "mc_eid"].forEach((q) =>
      u.searchParams.delete(q)
    );
    if (u.pathname.length > 1 && u.pathname.endsWith("/")) u.pathname = u.pathname.slice(0, -1);
    return u.toString();
  } catch {
    return raw;
  }
}

// Ensure a Source row exists, return its id
async function getOrCreateSourceId(src: { name: string; feed: string; domain?: string }) {
  const found = await prisma.source.findFirst({ where: { name: src.name } });
  if (found) return found.id;
  const created = await prisma.source.create({
    data: { name: src.name, feed: src.feed, domain: src.domain ?? null } as any,
  });
  return created.id;
}

// ------------------------
// POST /api/fetch  Ingest new articles
// ------------------------
export async function POST() {
  let totalAdded = 0;

  try {
    const sourceIdCache = new Map<string, number>();

    for (const src of SOURCES) {
      const sourceId =
        sourceIdCache.get(src.name) ??
        (await getOrCreateSourceId(src).then((id) => {
          sourceIdCache.set(src.name, id);
          return id;
        }));

      const rssItems = await getRssItems(src);
      console.log(`[INGEST] ${src.name} rss count:`, rssItems.length);

      const rows: {
        sourceId: number;
        url: string;
        title: string;
        author: string | null;
        publishedAt: Date | null;
        content: string | null;
        summary: string;
        imageUrl: string | null;
        teamTags: any;
        teamTagIdx: string;
        score: number | null;
        ingestedAt: Date;
        summaryOrigin: string | null;
        summaryModel: string | null;
        summaryChars: number | null;
        summarizedAt: Date | null;
      }[] = [];

      for (const item of rssItems) {
        if (!item.link) continue;

        const url = normalizeUrl(item.link.trim());
        // fetch page and extract
        const html = await fetchArticleHtml(url).catch(() => "");
        const mainText = html ? await extractMainText(html, url) : "";
        const mainImage = html ? await extractMainImage(html, url) : null;

        const title = (item.title || "").trim();
        const summaryFallback = (mainText || "").slice(0, 600);
        const summary = (item.summary || summaryFallback || "Summary not available").trim();
        const author = null;
        const publishedAt = item.publishedAt ? new Date(item.publishedAt) : null;

        // team tags
        const tags: string[] = [];
        if (isAboutTeam({ title, summary, source: src.name, url }, "tottenham")) tags.push("tottenham");
        const teamTagIdx = tags.length ? `|${tags.join("|")}|` : "";

        const baseScore = safeScore({ title, summary, source: src.name, publishedAt });

        rows.push({
          sourceId,
          url,
          title,
          author,
          publishedAt,
          content: mainText || null,
          summary,
          imageUrl: mainImage ?? null,
          teamTags: tags as any, // JSON for SQLite
          teamTagIdx,
          score: baseScore,
          ingestedAt: new Date(),
          summaryOrigin: item.summary ? "rss" : "fallback",
          summaryModel: null,
          summaryChars: summary.length,
          summarizedAt: new Date(),
        });
      }

      console.log(`[INGEST] ${src.name} built rows:`, rows.length);

      if (rows.length) {
        // rely on url unique, skip existing
        const result = await prisma.article.createMany({
          data: rows,
          skipDuplicates: true,
        });
        console.log(`[INGEST] ${src.name} inserted:`, result.count);
        totalAdded += result.count;
      }
    }

    return NextResponse.json({ status: "ok", added: totalAdded });
  } catch (e: any) {
    console.error("FETCH ROUTE ERROR:", e);
    return NextResponse.json({ status: "error", message: e?.message || String(e) }, { status: 500 });
  }
}

// ------------------------
// GET /api/fetch  Read with optional team filter
// ------------------------
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const team = (searchParams.get("team") || "").toLowerCase();

    const where = team ? { teamTagIdx: { contains: `|${team}|` } } : {};

    const items = await prisma.article.findMany({
      where,
      orderBy: [{ publishedAt: "desc" }, { score: "desc" }, { id: "desc" }],
      take: 200,
    });

    return NextResponse.json({ status: "ok", count: items.length, items });
  } catch (e: any) {
    console.error("FETCH ROUTE ERROR:", e);
    return NextResponse.json({ status: "error", message: e?.message || String(e) }, { status: 500 });
  }
}