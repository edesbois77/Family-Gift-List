export type SourceDef = {
  id: string;
  name: string;
  feed: string;
  domain?: string;
};

// A few general football sources plus Spurs-focused
export const SOURCES: SourceDef[] = [
  { id: "fl_spurs", name: "Football.London Spurs", feed: "https://www.football.london/all-about/tottenham-hotspur.fc.rss", domain: "football.london" },
  { id: "spursweb", name: "The Spurs Web", feed: "https://www.spurs-web.com/feed/", domain: "spurs-web.com" },
  { id: "hotspurhq", name: "Hotspur HQ", feed: "https://hotspurhq.com/feed/", domain: "hotspurhq.com" },
  { id: "cfc", name: "Cartilage Free Captain", feed: "https://cartilagefreecaptain.sbnation.com/rss/index.xml", domain: "cartilagefreecaptain.com" },

  // broader football to test filtering
  { id: "guardian_football", name: "Guardian Football", feed: "https://www.theguardian.com/football/rss", domain: "theguardian.com" },
  { id: "bbc_football", name: "BBC Football", feed: "http://feeds.bbci.co.uk/sport/football/rss.xml?edition=uk", domain: "bbc.co.uk" },
];
src/lib/pipeline.ts
ts
Copy code
export type RssItem = {
  title?: string;
  link?: string;
  summary?: string;
  publishedAt?: string;
  source?: string;
};

export async function getRssItems(src: { name: string; feed: string }): Promise<RssItem[]> {
  const res = await fetch(src.feed, { cache: "no-store" });
  const xml = await res.text();

  const blocks = xml.match(/<item[\s\S]*?<\/item>/gi) ?? xml.match(/<entry[\s\S]*?<\/entry>/gi) ?? [];
  const items: RssItem[] = [];
  for (const b of blocks) {
    const pick = (tag: string) => b.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"))?.[1];
    const title = decode(strip(pick("title") ?? ""));
    const href = b.match(/<link[^>]*href="([^"]+)"/i)?.[1] ?? decode(strip(pick("link") ?? ""));
    const summary = decode(strip(pick("description") ?? pick("summary") ?? pick("content") ?? ""));
    const pub = decode(strip(pick("pubDate") ?? pick("updated") ?? pick("published") ?? ""));
    items.push({
      title: title || undefined,
      link: href || undefined,
      summary: summary || undefined,
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

export async function extractMainText(html: string, _url?: string): Promise<string> {
  const art = html.match(/<article[\s\S]*?<\/article>/i)?.[0] ?? html;
  return strip(art).replace(/\s+/g, " ").trim().slice(0, 2000);
}

export async function extractMainImage(html: string, pageUrl?: string): Promise<string | null> {
  const og =
    html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["'][^>]*>/i)?.[1] ||
    html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["'][^>]*>/i)?.[1];
  if (og) return absolutize(og, pageUrl);
  const img = html.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1];
  return img ? absolutize(img, pageUrl) : null;
}

// helpers
function strip(s?: string) {
  return (s ?? "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, "");
}
function decode(s: string) {
  return s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}
function absolutize(src: string, pageUrl?: string) {
  try {
    return new URL(src, pageUrl).toString();
  } catch {
    return src;
  }
}
