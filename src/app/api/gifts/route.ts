export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      giftListId,
      title,
      description,
      imageUrl,
      productUrl,
      price,
      deliveryCost,
      size,
      quantity,
      priority
    } = await req.json();

    if (!giftListId || !title) {
      return NextResponse.json(
        { error: 'Gift list ID and title are required' },
        { status: 400 }
      );
    }

    // Verify user owns the list
    const list = await prisma.giftList.findUnique({
      where: { id: giftListId }
    });

    if (!list || list.userId !== user.id) {
      return NextResponse.json(
        { error: 'List not found or access denied' },
        { status: 404 }
      );
    }

    const gift = await prisma.gift.create({
      data: {
        giftListId,
        title,
        description,
        imageUrl,
        productUrl,
        price: price ? parseFloat(price) : null,
        deliveryCost: deliveryCost ? parseFloat(deliveryCost) : null,
        size,
        quantity: quantity || 1,
        priority: priority || 3
      }
    });

    return NextResponse.json({ gift });
  } catch (error) {
    console.error('Create gift error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}