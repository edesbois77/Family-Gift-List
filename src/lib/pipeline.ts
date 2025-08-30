// src/lib/pipeline.ts

// Minimal RSS item type
export type RssItem = {
  title?: string;
  link?: string;
  summary?: string;
  publishedAt?: string;
  source?: string;
};

// Very small, dependency-free RSS parser (good enough for most feeds)
export async function getRssItems(src: { name: string; feed: string }): Promise<RssItem[]> {
  const res = await fetch(src.feed, { cache: "no-store" });
  const xml = await res.text();

  // Split into <item>...</item> or <entry>...</entry> blocks
  const items: RssItem[] = [];
  const itemBlocks = xml.match(/<item[\s\S]*?<\/item>/gi) ?? xml.match(/<entry[\s\S]*?<\/entry>/gi) ?? [];
  for (const block of itemBlocks) {
    const pick = (tag: string) => {
      const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
      return m ? decodeHtml(stripTags(m[1]).trim()) : undefined;
    };
    const title = pick("title");
    // prefer <link>href or <link>text
    let link = undefined as string | undefined;
    const linkHref = block.match(/<link[^>]*href="([^"]+)"/i)?.[1];
    if (linkHref) link = linkHref;
    else link = pick("link");

    const summary = pick("description") || pick("summary") || pick("content");
    const pub = pick("pubDate") || pick("updated") || pick("published");

    items.push({
      title,
      link,
      summary,
      publishedAt: pub ? new Date(pub).toISOString() : undefined,
      source: src.name,
    });
  }
  return items;
}

export async function fetchArticleHtml(url: string): Promise<string> {
  const res = await fetch(url, { cache: "no-store" });
  return await res.text();
}

// Ultra-basic text extractor: grabs <article> text or falls back to body,
// strips tags and collapses whitespace.
export async function extractMainText(html: string, _url?: string): Promise<string> {
  const articleMatch = html.match(/<article[\s\S]*?<\/article>/i);
  const target = articleMatch ? articleMatch[0] : html;
  const text = stripTags(target)
    .replace(/\s+/g, " ")
    .trim();
  return text.slice(0, 2000); // keep it lightweight
}

// Try to find og:image or twitter:image; fallback to first <img>
export async function extractMainImage(html: string, pageUrl?: string): Promise<string | null> {
  const og = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["'][^>]*>/i)?.[1]
    || html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["'][^>]*>/i)?.[1];
  if (og) return absolutize(og, pageUrl);

  const img = html.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1];
  return img ? absolutize(img, pageUrl) : null;
}

// Simple scorer used if you don't provide your own
export function scoreArticle(a: { title?: string | null; summary?: string | null; source?: string | null; publishedAt?: Date | string | null }) {
  let s = 0;
  if (a.title) s += Math.min(a.title.length, 120) / 12;
  if (a.summary) s += Math.min(a.summary.length, 400) / 40;
  if (a.source) s += 5;
  if (a.publishedAt) s += 10;
  return Math.round(s);
}

// ---------- helpers ----------
function stripTags(s: string) {
  return s.replace(/<script[\s\S]*?<\/script>/gi, "")
          .replace(/<style[\s\S]*?<\/style>/gi, "")
          .replace(/<[^>]+>/g, "");
}

function decodeHtml(s: string) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function absolutize(src: string, pageUrl?: string) {
  try {
    if (!pageUrl) return src;
    return new URL(src, pageUrl).toString();
  } catch {
    return src;
  }
}