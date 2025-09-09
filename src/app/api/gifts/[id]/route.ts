import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const user = await getCurrentUser(cookieStore);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
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

    // Verify user owns the gift's list
    const gift = await prisma.gift.findUnique({
      where: { id },
      include: { giftList: true }
    });

    if (!gift || gift.giftList.userId !== user.id) {
      return NextResponse.json(
        { error: 'Gift not found or access denied' },
        { status: 404 }
      );
    }

    const updatedGift = await prisma.gift.update({
      where: { id },
      data: {
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

    return NextResponse.json({ gift: updatedGift });
  } catch (error) {
    console.error('Update gift error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const user = await getCurrentUser(cookieStore);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user owns the gift's list
    const gift = await prisma.gift.findUnique({
      where: { id },
      include: { giftList: true }
    });

    if (!gift || gift.giftList.userId !== user.id) {
      return NextResponse.json(
        { error: 'Gift not found or access denied' },
        { status: 404 }
      );
    }

    await prisma.gift.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete gift error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}