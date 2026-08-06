import { PrismaClient } from "@prisma/client";

/**
 * Connection selection.
 *
 * The web app should use Neon's **pooled** endpoint (`...-pooler...`), which is
 * what serverless functions need. The data-import scripts cannot: they wrap
 * each stock's writes in an interactive transaction, and pgBouncer in
 * transaction-pooling mode cannot hold a session across statements — it fails
 * with "Transaction not found ... or was obtained before disconnecting".
 *
 * So import/maintenance scripts set DIRECT_DATABASE_URL (the non-pooler host)
 * and it wins here. Leave DIRECT_DATABASE_URL unset in Vercel so the deployed
 * app keeps using the pooled connection.
 */
const connectionUrl =
  process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL;

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    ...(connectionUrl
      ? { datasources: { db: { url: connectionUrl } } }
      : {}),
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

/**
 * True when the resolved connection points at Neon's pooled endpoint.
 * Import scripts use this to fail fast with an actionable message instead of
 * dying midway through with an opaque transaction error.
 */
export function isPooledConnection(): boolean {
  return (connectionUrl ?? "").includes("-pooler.");
}
