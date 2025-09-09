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

    const { isPurchased, notes } = await req.json();

    const reservation = await prisma.reservation.findUnique({
      where: { id }
    });

    if (!reservation || reservation.userId !== user.id) {
      return NextResponse.json(
        { error: 'Reservation not found or access denied' },
        { status: 404 }
      );
    }

    const updatedReservation = await prisma.reservation.update({
      where: { id },
      data: {
        isPurchased: isPurchased !== undefined ? isPurchased : reservation.isPurchased,
        notes: notes !== undefined ? notes : reservation.notes
      }
    });

    return NextResponse.json({ reservation: updatedReservation });
  } catch (error) {
    console.error('Update reservation error:', error);
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

    const reservation = await prisma.reservation.findUnique({
      where: { id }
    });

    if (!reservation || reservation.userId !== user.id) {
      return NextResponse.json(
        { error: 'Reservation not found or access denied' },
        { status: 404 }
      );
    }

    await prisma.reservation.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete reservation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}