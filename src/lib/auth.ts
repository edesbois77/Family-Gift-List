// Simple session-based auth for demo purposes
// In production, consider using NextAuth.js or similar

import { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';
import { prisma } from './db';

export type User = {
  id: string;
  email: string;
  name: string | null;
};

export async function getCurrentUser(cookieStore: ReadonlyRequestCookies): Promise<User | null> {
  const sessionId = cookieStore.get('session')?.value;
  
  if (!sessionId) return null;

  try {
    // In a real app, you'd validate the session token properly
    const user = await prisma.user.findUnique({
      where: { id: sessionId },
      select: { id: true, email: true, name: true }
    });
    
  if (!cookieStore || typeof cookieStore.get !== 'function') {
    return null;
  }
  
    return user;
  } catch {
    return null;
  }
}

export async function createSession(userId: string, cookieStore: ReadonlyRequestCookies) {
  cookieStore.set('session', userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30 // 30 days
  });
}

export async function clearSession(cookieStore: ReadonlyRequestCookies) {
  cookieStore.delete('session');
}