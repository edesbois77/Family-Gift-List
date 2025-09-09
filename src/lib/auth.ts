// Simple session-based auth for demo purposes
// In production, consider using NextAuth.js or similar

import { cookies } from 'next/headers';
import { prisma } from './db';

export type User = {
  id: string;
  email: string;
  name: string | null;
};

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session')?.value;
  
  if (!sessionId) return null;

  try {
    // In a real app, you'd validate the session token properly
    const user = await prisma.user.findUnique({
      where: { id: sessionId },
      select: { id: true, email: true, name: true }
    });
    
    return user;
  } catch {
    return null;
  }
}

export async function createSession(userId: string) {
  const cookieStore = await cookies();
  cookieStore.set('session', userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30 // 30 days
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete('session');
}