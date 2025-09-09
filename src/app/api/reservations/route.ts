import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { giftId, quantity, notes } = await req.json();

    if (!giftId) {
      return NextResponse.json(
        { error: 'Gift ID is required' },
        { status: 400 }
      );
    }

    // Get gift and verify it's not the user's own list
    const gift = await prisma.gift.findUnique({
      where: { id: giftId },
      include: { giftList: true }
    });

    if (!gift) {
      return NextResponse.json({ error: 'Gift not found' }, { status: 404 });
    }

    if (gift.giftList.userId === user.id) {
      return NextResponse.json(
        { error: 'Cannot reserve gifts from your own list' },
        { status: 400 }
      );
    }

    // Check if already reserved by this user
    const existingReservation = await prisma.reservation.findUnique({
      where: {
        userId_giftId: {
          userId: user.id,
          giftId
        }
      }
    });

    if (existingReservation) {
      return NextResponse.json(
        { error: 'Gift already reserved by you' },
        { status: 400 }
      );
    }

    const reservation = await prisma.reservation.create({
      data: {
        userId: user.id,
        giftId,
        giftListId: gift.giftListId,
        quantity: quantity || 1,
        notes
      }
    });

    return NextResponse.json({ reservation });
  } catch (error) {
    console.error('Create reservation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const reservations = await prisma.reservation.findMany({
      where: { userId: user.id },
      include: {
        gift: {
          include: {
            giftList: {
              include: {
                user: {
                  select: { name: true, email: true }
                }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ reservations });
  } catch (error) {
    console.error('Get reservations error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}