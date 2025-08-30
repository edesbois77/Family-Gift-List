import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const take = Math.min(parseInt(searchParams.get("take") || "20", 10), 50);
  const cursor = searchParams.get("cursor");

  const articles = await prisma.article.findMany({
    take: take + 1,
    orderBy: { createdAt: "desc" },
    ...(cursor
      ? { skip: 1, cursor: { id: Number(cursor) } }
      : {}),
    include: { source: true },
  });

  let nextCursor: number | null = null;
  if (articles.length > take) {
    const nextItem = articles.pop();
    nextCursor = nextItem ? nextItem.id : null;
  }

  return NextResponse.json({ items: articles, nextCursor });
}
