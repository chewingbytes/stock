import { join } from "node:path";
import { isPooledConnection, prisma } from "../db";
import { createYahooFinanceProvider } from "../providers/yahooFinanceClient";
import { readProviderUniverseFiles } from "../providers/providerUniverse";
import { importProviderUniverse } from "./providerImport";

async function main() {
  // The importer uses interactive transactions, which Neon's pooled endpoint
  // cannot hold. Fail immediately with a fix rather than part-way through the
  // universe with an opaque "Transaction not found" error.
  if (isPooledConnection()) {
    throw new Error(
      "Refusing to import over a pooled (pgBouncer) connection.\n" +
        "Set DIRECT_DATABASE_URL to your Neon direct connection string — the " +
        "host WITHOUT '-pooler' in it — and re-run.",
    );
  }

  const rows = await readProviderUniverseFiles([
    join(process.cwd(), "data", "provider-universe", "us.csv"),
    join(process.cwd(), "data", "provider-universe", "sg.csv"),
  ]);
  const provider = createYahooFinanceProvider();
  const summary = await importProviderUniverse({ provider, rows });

  console.log(JSON.stringify(summary, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
