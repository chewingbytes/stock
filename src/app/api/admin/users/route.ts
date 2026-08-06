import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "../../../../server/db";
import { hashPassword } from "../../../../server/auth/password";
import { requireAdmin } from "../../../../server/auth/session";
import { registerSchema } from "../../../../server/auth/validation";

export const runtime = "nodejs";

const forbidden = () =>
  NextResponse.json({ error: "Admin access required." }, { status: 403 });

const createUserSchema = registerSchema.extend({
  role: z.enum(["USER", "ADMIN"]).default("USER"),
});

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return forbidden();

  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ users });
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return forbidden();

  const json = await request.json().catch(() => null);
  const parsed = createUserSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Enter a valid email and a password of at least 8 characters." },
      { status: 400 },
    );
  }

  const { email, password, name, role } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists." },
      { status: 409 },
    );
  }

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: await hashPassword(password),
      name: name ?? null,
      role,
    },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });

  return NextResponse.json({ user }, { status: 201 });
}
