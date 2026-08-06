import type { Prisma } from "@prisma/client";
import { prisma } from "../db";
import type {
  MarketDataProvider,
  ProviderStockData,
  ProviderUniverseRow,
} from "../providers/types";

export type ProviderImportSummary = {
  source: string;
  attempted: number;
  imported: number;
  partial: number;
  failed: number;
};

type ImportProviderUniverseInput = {
  provider: MarketDataProvider;
  rows: ProviderUniverseRow[];
  now?: Date;
};

type MarketDefaults = {
  name: string;
  country: string;
  timezone: string;
};

type ProviderImportDb = Prisma.TransactionClient;

function marketDefaults(marketCode: string): MarketDefaults {
  if (marketCode === "SGX") {
    return {
      name: "Singapore Exchange",
      country: "Singapore",
      timezone: "Asia/Singapore",
    };
  }

  return {
    name: "United States",
    country: "United States",
    timezone: "America/New_York",
  };
}

async function upsertMarket(db: ProviderImportDb, row: ProviderUniverseRow) {
  const defaults = marketDefaults(row.marketCode);

  return db.market.upsert({
    where: { code: row.marketCode },
    update: {
      name: defaults.name,
      country: defaults.country,
      currency: row.currency,
      timezone: defaults.timezone,
      status: "active",
    },
    create: {
      code: row.marketCode,
      name: defaults.name,
      country: defaults.country,
      currency: row.currency,
      timezone: defaults.timezone,
      status: "active",
    },
  });
}

async function upsertStock(db: ProviderImportDb, row: ProviderUniverseRow) {
  const market = await upsertMarket(db, row);

  return db.stock.upsert({
    where: {
      marketId_stockCode: {
        marketId: market.id,
        stockCode: row.stockCode,
      },
    },
    update: {
      exchange: row.exchange,
      stockName: row.stockName,
      currency: row.currency,
      providerSymbol: row.providerSymbol,
      isActive: true,
    },
    create: {
      marketId: market.id,
      exchange: row.exchange,
      stockCode: row.stockCode,
      stockName: row.stockName,
      currency: row.currency,
      sector: null,
      industry: null,
      providerSymbol: row.providerSymbol,
      isActive: true,
    },
  });
}

/**
 * Splits incoming rows into those we may write and those already owned by a
 * different source (which we must not overwrite).
 *
 * `keyOf` maps a row to the value of its unique column (a date's epoch millis
 * or a fiscal year) so incoming and existing rows can be compared.
 */
function partitionBySource<TIncoming, TExisting>(
  incoming: TIncoming[],
  existing: TExisting[],
  keyOf: (row: TIncoming) => number,
  existingKeyOf: (row: TExisting) => number,
  existingSourceOf: (row: TExisting) => string,
  source: string,
): { writable: TIncoming[]; skipped: number } {
  const ownedByOther = new Set(
    existing
      .filter((row) => existingSourceOf(row) !== source)
      .map((row) => existingKeyOf(row)),
  );

  const writable = incoming.filter((row) => !ownedByOther.has(keyOf(row)));

  return { writable, skipped: incoming.length - writable.length };
}

/**
 * Writes one stock's provider data.
 *
 * Deliberately batched: an earlier version issued a findUnique + upsert per row
 * (~520 sequential round trips for a year of daily bars), which comfortably
 * exceeded the interactive-transaction timeout whenever the runner was far from
 * the database — the scheduled refresh failed this way from GitHub's US runners
 * against a Singapore database. Each collection now costs three queries
 * (read existing, delete same-source rows, bulk insert), so a stock is ~13
 * round trips regardless of how many bars it has.
 *
 * Delete-then-insert is equivalent to upserting here because nothing
 * references these rows by id.
 */
async function writeProviderData(
  data: ProviderStockData,
  source: string,
  now: Date,
): Promise<string[]> {
  return prisma.$transaction(
    async (tx) => {
      const warnings: string[] = [];
      const stock = await upsertStock(tx, data.row);

      if (data.dailyPrices.length > 0) {
        const existing = await tx.dailyPrice.findMany({
          where: {
            stockId: stock.id,
            date: { in: data.dailyPrices.map((price) => price.date) },
          },
          select: { date: true, source: true },
        });

        const { writable, skipped } = partitionBySource(
          data.dailyPrices,
          existing,
          (price) => price.date.getTime(),
          (row) => row.date.getTime(),
          (row) => row.source,
          source,
        );

        if (skipped > 0) warnings.push("skipped_existing_daily_price");

        if (writable.length > 0) {
          await tx.dailyPrice.deleteMany({
            where: {
              stockId: stock.id,
              date: { in: writable.map((price) => price.date) },
              source,
            },
          });

          await tx.dailyPrice.createMany({
            data: writable.map((price) => ({
              stockId: stock.id,
              date: price.date,
              open: price.open,
              high: price.high,
              low: price.low,
              close: price.close,
              adjustedClose: price.adjustedClose,
              volume: price.volume,
              source,
              fetchedAt: now,
            })),
          });
        }
      }

      if (data.annualFinancials.length > 0) {
        const existing = await tx.annualFinancial.findMany({
          where: {
            stockId: stock.id,
            fiscalYear: {
              in: data.annualFinancials.map((item) => item.fiscalYear),
            },
          },
          select: { fiscalYear: true, source: true },
        });

        const { writable, skipped } = partitionBySource(
          data.annualFinancials,
          existing,
          (item) => item.fiscalYear,
          (row) => row.fiscalYear,
          (row) => row.source,
          source,
        );

        if (skipped > 0) warnings.push("skipped_existing_annual_financial");

        if (writable.length > 0) {
          await tx.annualFinancial.deleteMany({
            where: {
              stockId: stock.id,
              fiscalYear: { in: writable.map((item) => item.fiscalYear) },
              source,
            },
          });

          await tx.annualFinancial.createMany({
            data: writable.map((item) => ({
              stockId: stock.id,
              fiscalYear: item.fiscalYear,
              revenue: item.revenue,
              profitBeforeTax: item.profitBeforeTax,
              profitAfterTax: item.profitAfterTax,
              ebita: item.ebita,
              totalDebt: item.totalDebt,
              totalEquity: item.totalEquity,
              sharesOutstanding: item.sharesOutstanding,
              earningsPerShare: item.earningsPerShare,
              bookValuePerShare: item.bookValuePerShare,
              source,
              fetchedAt: now,
            })),
          });
        }
      }

      if (data.annualDividends.length > 0) {
        const existing = await tx.annualDividend.findMany({
          where: {
            stockId: stock.id,
            fiscalYear: {
              in: data.annualDividends.map((item) => item.fiscalYear),
            },
          },
          select: { fiscalYear: true, source: true },
        });

        const { writable, skipped } = partitionBySource(
          data.annualDividends,
          existing,
          (item) => item.fiscalYear,
          (row) => row.fiscalYear,
          (row) => row.source,
          source,
        );

        if (skipped > 0) warnings.push("skipped_existing_annual_dividend");

        if (writable.length > 0) {
          await tx.annualDividend.deleteMany({
            where: {
              stockId: stock.id,
              fiscalYear: { in: writable.map((item) => item.fiscalYear) },
              source,
            },
          });

          await tx.annualDividend.createMany({
            data: writable.map((item) => ({
              stockId: stock.id,
              fiscalYear: item.fiscalYear,
              dividendPerShare: item.dividendPerShare,
              currency: item.currency,
              source,
              fetchedAt: now,
            })),
          });
        }
      }

      if (data.marketCaps.length > 0) {
        // The unique key already includes source, so there is nothing another
        // source could own; replace this source's rows outright.
        await tx.marketCap.deleteMany({
          where: {
            stockId: stock.id,
            date: { in: data.marketCaps.map((item) => item.date) },
            source,
          },
        });

        await tx.marketCap.createMany({
          data: data.marketCaps.map((item) => ({
            stockId: stock.id,
            date: item.date,
            marketCap: item.marketCap,
            currency: item.currency,
            source,
            calculationMethod: item.calculationMethod,
            fetchedAt: now,
          })),
        });
      }

      return warnings;
    },
    { maxWait: 15000, timeout: 60000 },
  );
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function importRunStatus(input: {
  imported: number;
  partial: number;
  failed: number;
}): string {
  if (input.failed > 0 && input.imported === 0 && input.partial === 0) {
    return "failed";
  }

  if (input.failed > 0 || input.partial > 0) {
    return "partial";
  }

  return "completed";
}

export async function importProviderUniverse({
  provider,
  rows,
  now = new Date(),
}: ImportProviderUniverseInput): Promise<ProviderImportSummary> {
  const messages: string[] = [];
  let imported = 0;
  let partial = 0;
  let failed = 0;

  for (const row of rows) {
    try {
      const data = await provider.fetchStock(row);
      const warnings = [
        ...data.warnings,
        ...(await writeProviderData(data, provider.source, now)),
      ];

      if (warnings.length > 0) {
        partial += 1;
        messages.push(`${row.stockCode}: ${warnings.join(", ")}`);
      } else {
        imported += 1;
      }
    } catch (error) {
      failed += 1;
      messages.push(`${row.stockCode}: ${errorMessage(error)}`);
    }
  }

  await prisma.importRun.create({
    data: {
      source: provider.source,
      importType: "provider_universe",
      status: importRunStatus({ imported, partial, failed }),
      startedAt: now,
      completedAt: now,
      message: messages.length > 0 ? messages.join("\n") : null,
    },
  });

  return {
    source: provider.source,
    attempted: rows.length,
    imported,
    partial,
    failed,
  };
}
