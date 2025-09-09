export const runtime = 'nodejs';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { giftId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const gift = await prisma.gift.findUnique({
      where: { id: params.giftId },
      include: { giftList: true },
    });
    if (!gift || gift.giftList.userId !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

    // Allow both productUrl and legacy url
    const nextProductUrl =
      (body.productUrl as string | null | undefined) ??
      (body.url as string | null | undefined);

    const data: any = {};
    if (typeof body.title === "string") data.title = body.title;
    if (typeof body.description === "string" || body.description === null) data.description = body.description ?? null;
    if (typeof nextProductUrl === "string" || nextProductUrl === null) data.productUrl = nextProductUrl ?? null;
    if (typeof body.imageUrl === "string" || body.imageUrl === null) data.imageUrl = body.imageUrl ?? null;
    if (body.price !== undefined) data.price = body.price != null ? Number(body.price) : null;
    if (body.deliveryCost !== undefined) data.deliveryCost = body.deliveryCost != null ? Number(body.deliveryCost) : null;
    if (typeof body.size === "string" || body.size === null) data.size = body.size ?? null;
    if (body.priority !== undefined) {
      const p = Number(body.priority);
      data.priority = Number.isFinite(p) ? Math.max(1, Math.min(10, p)) : null;
    }

    // If your schema has `updatedAt @updatedAt` this will auto-update. If not, this line keeps it fresh:
    if ("updatedAt" in prisma.gift.fields ?? false) data.updatedAt = new Date();

    const updated = await prisma.gift.update({
      where: { id: params.giftId },
      data,
    });

    return NextResponse.json({ gift: updated });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}