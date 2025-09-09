export const runtime = 'nodejs';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db"; // <- your in-memory db
import { z } from "zod";

const Body = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  password: z.string().min(4),
});

export async function POST(req: NextRequest) {
  try {
    const data = Body.parse(await req.json());
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) return NextResponse.json(existing, { status: 200 });

    const user = await prisma.user.create({
      data: { email: data.email, name: data.name ?? null, password: data.password },
    });
    return NextResponse.json(user, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Invalid request" }, { status: 400 });
  }
}