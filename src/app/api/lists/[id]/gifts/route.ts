import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  ctx: { params: { id?: string; listId?: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Support current [id] and any legacy [listId]
    const listId = ctx.params.id ?? ctx.params.listId;
    if (!listId) {
      return NextResponse.json({ error: "Missing list id in route" }, { status: 400 });
    }

    const list = await prisma.giftList.findUnique({ where: { id: listId } });
    if (!list || list.userId !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

    // accept productUrl, or legacy url -> productUrl
    const {
      title,
      description = null,
      productUrl: productUrlFromBody = null,
      url: legacyUrl = null,
      imageUrl = null,
      price = null,
      size = null,
      deliveryCost = null,
      // notes is intentionally ignored because the schema doesn't have it
    } = body;

    const productUrl =
      (productUrlFromBody as string | null) ??
      (legacyUrl as string | null) ??
      null;

    if (!title || typeof title !== "string") {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const gift = await prisma.gift.create({
      data: {
        giftListId: listId,
        title,
        description: (description as string | null) ?? null,
        productUrl,
        imageUrl: (imageUrl as string | null) ?? null,
        price: price != null ? Number(price) : null,
        size: (size as string | null) ?? null,
        deliveryCost: deliveryCost != null ? Number(deliveryCost) : null,
      },
    });

    return NextResponse.json({ gift }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}