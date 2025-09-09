// ✅ Force this module to be server-only so it can't be imported by client components
import "server-only";

import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";

const SESSION_COOKIE = "fg_session";

/** Save a cookie like "<random>.<userId>" */
export async function createSession(userId: string) {
  const token = `${randomUUID()}.${userId}`;
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return token;
}

/** Read the cookie and look up the user in Prisma */
export async function getCurrentUser() {
  const raw = cookies().get(SESSION_COOKIE)?.value;
  if (!raw) return null;

  const dot = raw.indexOf(".");
  const userId = dot >= 0 ? raw.slice(dot + 1) : raw;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  return user ?? null;
}

export function signOut() {
  cookies().set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
}