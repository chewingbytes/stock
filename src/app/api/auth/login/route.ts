import { NextResponse } from "next/server";
import { prisma } from "../../../../server/db";
import { verifyPassword } from "../../../../server/auth/password";
import { createSession } from "../../../../server/auth/session";
import { credentialsSchema } from "../../../../server/auth/validation";

// bcrypt + Prisma need the Node.js runtime (not Edge).
export const runtime = "nodejs";

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = credentialsSchema.safeParse(json);

  // Generic message so we never reveal whether an email exists.
  const invalid = NextResponse.json(
    { error: "Invalid email or password." },
    { status: 401 },
  );

  if (!parsed.success) {
    return invalid;
  }

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return invalid;
  }

  const passwordOk = await verifyPassword(password, user.passwordHash);
  if (!passwordOk) {
    return invalid;
  }

  await createSession({ id: user.id, email: user.email, name: user.name });

  return NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name },
  });
}
