import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "../../../../../server/db";
import { requireAdmin } from "../../../../../server/auth/session";

export const runtime = "nodejs";

const forbidden = () =>
  NextResponse.json({ error: "Admin access required." }, { status: 403 });

const updateSchema = z.object({ role: z.enum(["USER", "ADMIN"]) });

/** Guards against removing the final admin and orphaning the system. */
async function isLastAdmin(userId: string): Promise<boolean> {
  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (target?.role !== "ADMIN") return false;

  const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
  return adminCount <= 1;
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin();
  if (!admin) return forbidden();

  const { id } = await context.params;
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid role." }, { status: 400 });
  }

  // Demoting the only admin would leave nobody able to manage users.
  if (parsed.data.role === "USER" && (await isLastAdmin(id))) {
    return NextResponse.json(
      { error: "Cannot demote the last remaining admin." },
      { status: 409 },
    );
  }

  const user = await prisma.user.update({
    where: { id },
    data: { role: parsed.data.role },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });

  return NextResponse.json({ user });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin();
  if (!admin) return forbidden();

  const { id } = await context.params;

  if (id === admin.id) {
    return NextResponse.json(
      { error: "You cannot delete your own account." },
      { status: 409 },
    );
  }

  if (await isLastAdmin(id)) {
    return NextResponse.json(
      { error: "Cannot delete the last remaining admin." },
      { status: 409 },
    );
  }

  try {
    await prisma.user.delete({ where: { id } });
  } catch {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
