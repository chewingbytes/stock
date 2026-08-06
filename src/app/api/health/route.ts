import { NextResponse } from "next/server";
import { prisma } from "../../../server/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Liveness probe for uptime monitoring. Confirms the app can reach the
 * database; returns 503 so monitors alert when it cannot.
 */
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok", database: "up" });
  } catch {
    return NextResponse.json(
      { status: "error", database: "down" },
      { status: 503 },
    );
  }
}
