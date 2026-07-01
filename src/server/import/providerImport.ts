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

async function writeProviderData(
  data: ProviderStockData,
  source: string,
  now: Date,
): Promise<string[]> {
  return prisma.$transaction(
    async (tx) => {
    const warnings: string[] = [];
    const stock = await upsertStock(tx, data.row);

    for (const dailyPrice of data.dailyPrices) {
      const existing = await tx.dailyPrice.findUnique({
        where: {
          stockId_date: {
            stockId: stock.id,
            date: dailyPrice.date,
          },
        },
      });

      if (existing && existing.source !== source) {
        warnings.push("skipped_existing_daily_price");
        continue;
      }

      await tx.dailyPrice.upsert({
        where: {
          stockId_date: {
            stockId: stock.id,
            date: dailyPrice.date,
          },
        },
        update: {
          open: dailyPrice.open,
          high: dailyPrice.high,
          low: dailyPrice.low,
          close: dailyPrice.close,
          adjustedClose: dailyPrice.adjustedClose,
          volume: dailyPrice.volume,
          source,
          fetchedAt: now,
        },
        create: {
          stockId: stock.id,
          date: dailyPrice.date,
          open: dailyPrice.open,
          high: dailyPrice.high,
          low: dailyPrice.low,
          close: dailyPrice.close,
          adjustedClose: dailyPrice.adjustedClose,
          volume: dailyPrice.volume,
          source,
          fetchedAt: now,
        },
      });
    }

    for (const financial of data.annualFinancials) {
      const existing = await tx.annualFinancial.findUnique({
        where: {
          stockId_fiscalYear: {
            stockId: stock.id,
            fiscalYear: financial.fiscalYear,
          },
        },
      });

      if (existing && existing.source !== source) {
        warnings.push("skipped_existing_annual_financial");
        continue;
      }

      await tx.annualFinancial.upsert({
        where: {
          stockId_fiscalYear: {
            stockId: stock.id,
            fiscalYear: financial.fiscalYear,
          },
        },
        update: {
          revenue: financial.revenue,
          profitBeforeTax: financial.profitBeforeTax,
          profitAfterTax: financial.profitAfterTax,
          ebita: financial.ebita,
          totalDebt: financial.totalDebt,
          totalEquity: financial.totalEquity,
          sharesOutstanding: financial.sharesOutstanding,
          earningsPerShare: financial.earningsPerShare,
          bookValuePerShare: financial.bookValuePerShare,
          source,
          fetchedAt: now,
        },
        create: {
          stockId: stock.id,
          fiscalYear: financial.fiscalYear,
          revenue: financial.revenue,
          profitBeforeTax: financial.profitBeforeTax,
          profitAfterTax: financial.profitAfterTax,
          ebita: financial.ebita,
          totalDebt: financial.totalDebt,
          totalEquity: financial.totalEquity,
          sharesOutstanding: financial.sharesOutstanding,
          earningsPerShare: financial.earningsPerShare,
          bookValuePerShare: financial.bookValuePerShare,
          source,
          fetchedAt: now,
        },
      });
    }

    for (const dividend of data.annualDividends) {
      const existing = await tx.annualDividend.findUnique({
        where: {
          stockId_fiscalYear: {
            stockId: stock.id,
            fiscalYear: dividend.fiscalYear,
          },
        },
      });

      if (existing && existing.source !== source) {
        warnings.push("skipped_existing_annual_dividend");
        continue;
      }

      await tx.annualDividend.upsert({
        where: {
          stockId_fiscalYear: {
            stockId: stock.id,
            fiscalYear: dividend.fiscalYear,
          },
        },
        update: {
          dividendPerShare: dividend.dividendPerShare,
          currency: dividend.currency,
          source,
          fetchedAt: now,
        },
        create: {
          stockId: stock.id,
          fiscalYear: dividend.fiscalYear,
          dividendPerShare: dividend.dividendPerShare,
          currency: dividend.currency,
          source,
          fetchedAt: now,
        },
      });
    }

    for (const marketCap of data.marketCaps) {
      await tx.marketCap.upsert({
        where: {
          stockId_date_source: {
            stockId: stock.id,
            date: marketCap.date,
            source,
          },
        },
        update: {
          marketCap: marketCap.marketCap,
          currency: marketCap.currency,
          calculationMethod: marketCap.calculationMethod,
          fetchedAt: now,
        },
        create: {
          stockId: stock.id,
          date: marketCap.date,
          marketCap: marketCap.marketCap,
          currency: marketCap.currency,
          source,
          calculationMethod: marketCap.calculationMethod,
          fetchedAt: now,
        },
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
