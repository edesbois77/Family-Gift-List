// src/lib/auth.ts
// Ensure this module is server-only (must not be imported by client components)
import "server-only";

import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";

const SESSION_COOKIE = "fg_session";

// --- helpers ---------------------------------------------------------------

function extractUserId(token: string | undefined | null): string | null {
  if (!token) return null;
  // token format: "<random>.<userId>" (or just "<userId>" for legacy)
  const dot = token.indexOf(".");
  return dot >= 0 ? token.slice(dot + 1) : token;
}

// --- API -------------------------------------------------------------------

/** Create a simple session cookie storing "<random>.<userId>". */
export async function createSession(userId: string) {
  const token = `${randomUUID()}.${userId}`;
  try {
    cookies().set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
  } catch {
    // No request context (e.g. during build/seeding) — ignore.
  }
  return token;
}

/** Get the currently signed-in user or null.
 *  Safe to call from route handlers / server components.
 *  If called without a request context, returns null (does not throw).
 */
export async function getCurrentUser() {
  try {
    const raw = cookies().get(SESSION_COOKIE)?.value;
    const userId = extractUserId(raw);
    if (!userId) return null;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    return user ?? null;
  } catch {
    // Called outside a request scope — return null instead of crashing.
    return null;
  }
}

/** Optional: get just the userId from the cookie (or null). */
export function getSessionUserId(): string | null {
  try {
    const raw = cookies().get(SESSION_COOKIE)?.value;
    return extractUserId(raw);
  } catch {
    return null;
  }
}

/** Clear the session cookie. */
export function signOut() {
  try {
    cookies().set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  } catch {
    // No request context — ignore.
  }
}