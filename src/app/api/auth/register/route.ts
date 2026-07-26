import { NextResponse } from "next/server";
import { prisma } from "../../../../server/db";
import { hashPassword } from "../../../../server/auth/password";
import { createSession } from "../../../../server/auth/session";
import { registerSchema } from "../../../../server/auth/validation";

// bcrypt + Prisma need the Node.js runtime (not Edge).
export const runtime = "nodejs";

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Enter a valid email and a password of at least 8 characters." },
      { status: 400 },
    );
  }

  const { email, password, name } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists." },
      { status: 409 },
    );
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { email, passwordHash, name: name ?? null },
    select: { id: true, email: true, name: true },
  });

  await createSession(user);

  return NextResponse.json({ user });
}
