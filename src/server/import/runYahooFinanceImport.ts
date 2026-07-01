import { join } from "node:path";
import { prisma } from "../db";
import { createYahooFinanceProvider } from "../providers/yahooFinanceClient";
import { readProviderUniverseFiles } from "../providers/providerUniverse";
import { importProviderUniverse } from "./providerImport";

async function main() {
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
