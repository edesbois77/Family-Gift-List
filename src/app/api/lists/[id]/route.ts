import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const list = await prisma.giftList.findUnique({
      where: { id },
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

    // Check if user has access to this list
    const isOwner = list.userId === user.id;
    const hasAccess = isOwner || list.isPublic;

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Hide purchase status from list owner to keep gifts a surprise
    if (isOwner) {
      list.gifts = list.gifts.map(gift => ({
        ...gift,
        reservations: gift.reservations.map(res => ({
          ...res,
          isPurchased: false // Hide purchase status from owner
        }))
      }));
    }

    return NextResponse.json({ list, isOwner });
  } catch (error) {
    console.error('Get list error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, description, eventDate, isPublic } = await req.json();

    const list = await prisma.giftList.findUnique({
      where: { id }
    });

    if (!list || list.userId !== user.id) {
      return NextResponse.json({ error: 'List not found or access denied' }, { status: 404 });
    }

    const updatedList = await prisma.giftList.update({
      where: { id },
      data: {
        title,
        description,
        eventDate: eventDate ? new Date(eventDate) : null,
        isPublic
      }
    });

    return NextResponse.json({ list: updatedList });
  } catch (error) {
    console.error('Update list error:', error);
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
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const list = await prisma.giftList.findUnique({
      where: { id }
    });

    if (!list || list.userId !== user.id) {
      return NextResponse.json({ error: 'List not found or access denied' }, { status: 404 });
    }

    await prisma.giftList.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete list error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}