import Parser from "rss-parser";
import * as cheerio from "cheerio";

export type FeedItem = {
  title: string;
  link: string;
  isoDate?: string;
  author?: string;
};

const parser = new Parser();

export async function getRssItems(rssUrl: string): Promise<FeedItem[]> {
  const feed = await parser.parseURL(rssUrl);
  return (feed.items || []).map((i) => ({
    title: i.title || "",
    link: i.link || "",
    isoDate: i.isoDate,
    author: i.creator || i.author,
  }));
}

export async function fetchArticleHtml(url: string): Promise<string> {
  const res = await fetch(url, { headers: { "user-agent": "Mozilla/5.0 ScoutedBot" } });
  if (!res.ok) throw new Error(`Fetch failed ${res.status}`);
  return await res.text();
}

/** Very light extraction, good enough for prototype */
export function extractMainText(html: string): string {
  const $ = cheerio.load(html);

  // Prefer og:description if present
  const ogDesc = $('meta[property="og:description"]').attr("content");
  if (ogDesc && ogDesc.length > 140) return ogDesc;

  // Try article tag, or main
  const buckets = [
    $("article").text(),
    $("main").text(),
    $('div[itemprop="articleBody"]').text(),
    $('div[class*="Article"], div[class*="article"]').text(),
    $("body").text(),
  ];

  const text = buckets.find((t) => (t || "").trim().length > 280) || "";
  return normalizeWhitespace(text).slice(0, 8000);
}

function normalizeWhitespace(s: string): string {
  return s.replace(/\s+/g, " ").replace(/\u00a0/g, " ").trim();
}
