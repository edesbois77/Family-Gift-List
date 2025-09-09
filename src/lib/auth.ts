// src/lib/auth.ts
import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";

const SESSION_COOKIE = "fg_session";

/**
 * Save a cookie like "<random>.<userId>".
 * Simpler than base64 encoding and works in Edge runtime.
 */
export async function createSession(userId: string) {
  const token = `${randomUUID()}.${userId}`;
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  return token;
}

/**
 * Read the cookie and look up the user in our "prisma" (db.ts).
 */
export async function getCurrentUser() {
  try {
    const raw = cookies().get(SESSION_COOKIE)?.value;
    if (!raw) return null;

    // token format: "<random>.<userId>" or just "<userId>"
    const dot = raw.indexOf(".");
    const userId = dot >= 0 ? raw.slice(dot + 1) : raw;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    return user ?? null;
  } catch (error) {
    // Handle cases where cookies() is called outside request scope
    console.warn('getCurrentUser called outside request scope:', error);
    return null;
  }
}

/**
 * Clear the cookie when signing out.
 */
export async function clearSession() {
  cookies().set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
}