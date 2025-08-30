// lib/crawler.ts
import Parser from "rss-parser";
import { load } from "cheerio";

export type RssItem = {
  title?: string | null;
  link?: string | null;
  isoDate?: string | null;
  author?: string | null;
  rssImage?: string | null;
};

const parser = new Parser<any>({ timeout: 20000 });

// -----------------------------
// Utilities
// -----------------------------
function toAbsoluteUrl(maybeUrl: string | undefined | null, baseUrl: string): string | null {
  if (!maybeUrl) return null;
  try {
    return new URL(maybeUrl, baseUrl).toString();
  } catch {
    return null;
  }
}

function pick<T>(...vals: Array<T | undefined | null>): T | undefined {
  return vals.find(v => v != null);
}

function stripBoilerplateLines(text: string): string {
  // Remove common image/caption/credit junk that BBC/Guardian/Sky inject
  const badPatterns = [
    /\b(Image|Images|Image source|View image in fullscreen)\b/i,
    /\bPhotograph:\s*[A-Z].*\b/i,
    /\b(Getty|PA Media|Reuters|EPA|AP|Action Images|USA Today Sports)\b/i,
    /\bSign up to .* newsletter\b/i,
    /\bSubscribe\b/i,
    /\bPublished\s*\d+\s*(mins?|hours?|days?)\s*ago\b/i,
  ];
  // Split into sentences-ish chunks and filter
  const chunks = text
    .split(/[\r\n]+/g)
    .map(s => s.trim())
    .filter(Boolean);

  const cleaned = chunks.filter(line => !badPatterns.some(rx => rx.test(line)));
  // De-dup consecutive repeats
  const deduped: string[] = [];
  for (const line of cleaned) {
    if (deduped[deduped.length - 1] !== line) deduped.push(line);
  }
  return deduped.join("\n\n");
}

// -----------------------------
// RSS
// -----------------------------
export async function getRssItems(rssUrl: string): Promise<RssItem[]> {
  const feed = await parser.parseURL(rssUrl);

  return (feed.items || []).map((it: any) => {
    const enclosureUrl: string | undefined = it?.enclosure?.url;
    const mediaContentUrl: string | undefined =
      it?.["media:content"]?.url || it?.["media:thumbnail"]?.url;
    const thumbUrl: string | undefined = it?.thumbnail;

    return {
      title: it.title ?? null,
      link: it.link ?? it.guid ?? null,
      isoDate: it.isoDate ?? it.pubDate ?? null,
      author: it.creator ?? it.author ?? null,
      rssImage:
        toAbsoluteUrl(pick(enclosureUrl, mediaContentUrl, thumbUrl) ?? undefined, rssUrl) ??
        null,
    };
  });
}

// -----------------------------
// Article fetching
// -----------------------------
export async function fetchArticleHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    redirect: "follow" as any,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`fetchArticleHtml: ${res.status} ${res.statusText}`);
  return await res.text();
}

// -----------------------------
// Extraction
// -----------------------------
export function extractMainText(html: string): string {
  const $ = load(html);

  // 1) Remove noisy DOM before extracting text
  $(
    [
      "figure",
      "figcaption",
      "picture",
      "img",
      "video",
      "iframe",
      "noscript",
      "script",
      "style",
      "aside",
      "header",
      "footer",
      ".caption",
      ".image",
      ".media",
      ".credit",
      ".byline",
      ".metadata",
      ".share",
      ".social",
      ".advert",
      ".ad",
      ".promo",
      "[role='img']",
      "[data-component='image-block']",
    ].join(",")
  ).remove();

  // 2) Prefer main article containers
  const candidates = [
    "article",
    "main",
    "[role='main']",
    ".article-body",
    ".post-content",
    ".entry-content",
    ".content__article-body", // Guardian
    "[itemprop='articleBody']",
  ];

  for (const sel of candidates) {
    const el = $(sel);
    if (!el.length) continue;
    const text = el.text().replace(/\s+/g, " ").trim();
    if (text && text.length > 400) {
      return stripBoilerplateLines(text);
    }
  }

  // 3) Fallback to paragraphs only
  const paraText = $("p")
    .map((_, el) => $(el).text().trim())
    .get()
    .filter(t => t.length > 40)
    .join("\n\n");

  if (paraText && paraText.length > 300) return stripBoilerplateLines(paraText);

  // 4) Last resort
  return stripBoilerplateLines($("body").text().trim());
}

export function extractMainImage(html: string, baseUrl: string): string | null {
  const $ = load(html);

  const og =
    $('meta[property="og:image"]').attr("content") ||
    $('meta[name="og:image"]').attr("content") ||
    $('meta[name="twitter:image"]').attr("content") ||
    $('meta[name="twitter:image:src"]').attr("content") ||
    $('link[rel="image_src"]').attr("href");

  if (og) return toAbsoluteUrl(og, baseUrl);

  // Fallback: first reasonably large image
  const candidate = $("img[src]")
    .filter((_, el) => {
      const $el = $(el);
      const w = Number($el.attr("width") || 0);
      const h = Number($el.attr("height") || 0);
      return w * h >= 300 * 200 || w >= 600 || h >= 400;
    })
    .first()
    .attr("src");

  return toAbsoluteUrl(candidate ?? null, baseUrl);
}