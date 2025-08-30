// src/app/api/articles/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { spursRelevanceScore } from "@/lib/spursRelevance";

/**
 * GET /api/articles
 * Query params:
 * - cursor?: number            // pagination cursor, returns items with id < cursor
 * - take?: number              // page size, default 20
 * - club?: "tottenham" | "all" // if "tottenham", filters by Spurs relevance score
 *
 * Returns:
 * {
 *   items: ArticleLite[],
 *   nextCursor: number | null
 * }
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const cursorParam = searchParams.get("cursor");
    const takeParam = searchParams.get("take");
    const clubParam = (searchParams.get("club") || "all").toLowerCase();

    const take = clampInt(parseIntSafe(takeParam, 20), 1, 100);
    const cursorId = parseIntSafe(cursorParam, null);

    // Base where clause for cursor-based pagination on numeric ID
    const where: any = {};
    if (cursorId) where.id = { lt: cursorId };

    // Pull extra when club=tottenham so filtering doesn't empty the page
    const rawTake = clubParam === "tottenham" ? Math.min(take * 3, 100) : take;

    // Fetch batch (id desc for stable pagination window)
    const articles = await prisma.article.findMany({
      where,
      orderBy: { id: "desc" },
      take: rawTake,
      select: {
        id: true,
        title: true,
        summary: true,
        url: true,
        imageUrl: true,
        publishedAt: true,
        sourceId: true,
        // body: true, // uncomment if you persist body/content
        source: {
          select: { name: true, siteUrl: true },
        },
      },
    });

    let scored = articles as (typeof articles[number] & { _score?: number })[];

    if (clubParam === "tottenham") {
      // Score, filter, then sort by time (tie-break on score)
      scored = articles
        .map((a) => {
          let sourceDomain: string | null = null;
          try {
            sourceDomain = new URL(a.url).hostname;
          } catch {
            sourceDomain = a.source?.siteUrl ? new URL(a.source.siteUrl).hostname : null;
          }
          const score = spursRelevanceScore({
            title: a.title || "",
            summary: a.summary || "",
            // body: a.body || "",
            sourceDomain,
            articleUrl: a.url || null,
          });
          return { ...a, _score: score };
        })
        .filter((a) => (a._score ?? 0) >= 25)
        .sort((a, b) => {
          const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
          const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
          if (dateA !== dateB) return dateB - dateA; // newest first
          return (b._score ?? 0) - (a._score ?? 0); // relevance tie-break
        });
    } else {
      // All football: sort strictly by publishedAt (newest first)
      scored = [...articles].sort((a, b) => {
        const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
        const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
        return dateB - dateA;
      });
    }

    // Trim to requested page size after sorting
    const pageItems = scored.slice(0, take);

    // Next cursor is the smallest ID in this page (consistent with id-desc window)
    const nextCursor =
      pageItems.length > 0 ? Math.min(...pageItems.map((a) => a.id as number)) : null;

    return NextResponse.json({
      items: pageItems.map((a) => ({
        id: a.id,
        title: a.title,
        summary: a.summary,
        url: a.url,
        imageUrl: a.imageUrl,
        publishedAt: a.publishedAt,
        source: { name: a.source?.name ?? "" },
      })),
      nextCursor,
    });
  } catch (e: any) {
    console.error("ARTICLES API ERROR:", e);
    return NextResponse.json(
      { status: "error", message: e?.message || String(e) },
      { status: 500 }
    );
  }
}

/* ----------------- helpers ----------------- */

function parseIntSafe(input: string | null, fallback: number | null): number | null {
  if (!input) return fallback;
  const n = Number(input);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

function clampInt(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}