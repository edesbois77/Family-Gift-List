import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/db";
import { SOURCES } from "@/src/lib/sources";
import { getRssItems, fetchArticleHtml, extractMainText } from "@/src/lib/crawler";
import { summarize } from "@/src/lib/summarize";
import { addDays } from "date-fns";

export const dynamic = "force-dynamic";

export async function POST() {
  // Ensure sources exist
  for (const s of SOURCES) {
    await prisma.source.upsert({
      where: { rssUrl: s.rssUrl },
      update: { name: s.name, siteUrl: s.siteUrl },
      create: { name: s.name, rssUrl: s.rssUrl, siteUrl: s.siteUrl },
    });
  }

  const sources = await prisma.source.findMany();
  let added = 0;

  for (const src of sources) {
    const items = await getRssItems(src.rssUrl);

    // Only recent items in last 3 days, avoid huge imports
    const cutoff = addDays(new Date(), -3).getTime();

    for (const item of items.slice(0, 15)) {
      try {
        if (!item.link) continue;
        const exists = await prisma.article.findUnique({ where: { url: item.link } });
        if (exists) continue;

        const pubMs = item.isoDate ? new Date(item.isoDate).getTime() : Date.now();
        if (pubMs < cutoff) continue;

        const html = await fetchArticleHtml(item.link);
        const text = extractMainText(html);
        const summary = await summarize(text);

        await prisma.article.create({
          data: {
            sourceId: src.id,
            url: item.link,
            title: item.title || "Untitled",
            author: item.author || null,
            publishedAt: item.isoDate ? new Date(item.isoDate) : null,
            content: text.slice(0, 10000),
            summary,
          },
        });

        added++;
      } catch {
        // Ignore single item failures in prototype
      }
    }
  }

  return NextResponse.json({ status: "ok", added });
}
