import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ shareCode: string }> }
) {
  try {
    const { shareCode } = await params;
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const list = await prisma.giftList.findUnique({
      where: { shareCode },
      include: {
        user: {
          select: { name: true, email: true }
        },
        gifts: {
          include: {
            reservations: {
              select: {
                id: true,
                quantity: true,
                isPurchased: true,
                userId: true
              }
            }
          }
        }
      }
    });

    if (!list) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 });
    }

    const isOwner = list.userId === user.id;

    // Record access for non-owners
    if (!isOwner) {
      await prisma.listAccess.upsert({
        where: {
          userId_giftListId: {
            userId: user.id,
            giftListId: list.id
          }
        },
        update: {},
        create: {
          userId: user.id,
          giftListId: list.id
        }
      });
    }

    // Hide purchase status from list owner
    if (isOwner) {
      list.gifts = list.gifts.map(gift => ({
        ...gift,
        reservations: gift.reservations.map(res => ({
          ...res,
          isPurchased: false
        }))
      }));
    }

    return NextResponse.json({ list, isOwner });
  } catch (error) {
    console.error('Get shared list error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}