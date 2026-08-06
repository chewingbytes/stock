/**
 * Removes demo/fixture and test-run data from the connected database.
 *
 *   npx tsx scripts/cleanTestData.ts          # dry run, reports only
 *   npx tsx scripts/cleanTestData.ts --apply  # performs the deletion
 *
 * Background: the database-backed test suites used to run against whatever
 * DATABASE_URL was set, which wrote fixture rows into production. Those suites
 * are now opt-in (see src/test/dbTest.ts); this script cleans up what they left.
 *
 * Only rows whose `source` is "fixture" or starts with "provider_import" are
 * removed, plus the two synthetic sample stocks. Real yahoo_finance data is
 * never touched.
 */
import { prisma } from "../src/server/db";

const SYNTHETIC_STOCK_CODES = ["MISS", "LOSS"];

const testSourceFilter = {
  OR: [{ source: "fixture" }, { source: { startsWith: "provider_import" } }],
};

async function main() {
  const apply = process.argv.includes("--apply");

  const synthetic = await prisma.stock.findMany({
    where: { stockCode: { in: SYNTHETIC_STOCK_CODES } },
    select: { id: true, stockCode: true },
  });

  const counts = {
    syntheticStocks: synthetic.length,
    dailyPrice: await prisma.dailyPrice.count({ where: testSourceFilter }),
    annualFinancial: await prisma.annualFinancial.count({
      where: testSourceFilter,
    }),
    annualDividend: await prisma.annualDividend.count({
      where: testSourceFilter,
    }),
    marketCap: await prisma.marketCap.count({ where: testSourceFilter }),
    importRun: await prisma.importRun.count({ where: testSourceFilter }),
  };

  console.log(apply ? "Applying cleanup:" : "Dry run (pass --apply to delete):");
  console.table(counts);

  if (!apply) {
    console.log("\nNothing was deleted.");
    return;
  }

  const ids = synthetic.map((stock) => stock.id);

  if (ids.length > 0) {
    // No cascade is configured on these relations, so children go first.
    await prisma.derivedMetric.deleteMany({ where: { stockId: { in: ids } } });
    await prisma.dailyPrice.deleteMany({ where: { stockId: { in: ids } } });
    await prisma.annualFinancial.deleteMany({ where: { stockId: { in: ids } } });
    await prisma.annualDividend.deleteMany({ where: { stockId: { in: ids } } });
    await prisma.marketCap.deleteMany({ where: { stockId: { in: ids } } });
    await prisma.stock.deleteMany({ where: { id: { in: ids } } });
  }

  await prisma.dailyPrice.deleteMany({ where: testSourceFilter });
  await prisma.annualFinancial.deleteMany({ where: testSourceFilter });
  await prisma.annualDividend.deleteMany({ where: testSourceFilter });
  await prisma.marketCap.deleteMany({ where: testSourceFilter });
  await prisma.importRun.deleteMany({ where: testSourceFilter });

  console.log(`\nDone. Remaining stocks: ${await prisma.stock.count()}`);
  console.log("Run `npm run metrics:recompute` next to refresh derived metrics.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
