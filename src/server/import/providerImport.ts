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

async function upsertMarket(row: ProviderUniverseRow) {
  const defaults = marketDefaults(row.marketCode);

  return prisma.market.upsert({
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

async function upsertStock(row: ProviderUniverseRow) {
  const market = await upsertMarket(row);

  return prisma.stock.upsert({
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

async function writeProviderData(data: ProviderStockData, source: string, now: Date) {
  const stock = await upsertStock(data.row);

  for (const dailyPrice of data.dailyPrices) {
    await prisma.dailyPrice.upsert({
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
    await prisma.annualFinancial.upsert({
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
    await prisma.annualDividend.upsert({
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
    await prisma.marketCap.upsert({
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
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
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
      await writeProviderData(data, provider.source, now);

      if (data.warnings.length > 0) {
        partial += 1;
        messages.push(`${row.stockCode}: ${data.warnings.join(", ")}`);
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
      status: partial === 0 && failed === 0 ? "completed" : "partial",
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
