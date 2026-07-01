import { join } from "node:path";
import { readCsv } from "../csv/readCsv";
import { prisma } from "../db";

type ImportSummary = {
  markets: number;
  stocks: number;
  dailyPrices: number;
  annualFinancials: number;
  annualDividends: number;
};

const fixtureDir = join(process.cwd(), "data", "fixtures");

function asNumber(value: string): number | null {
  if (value === "") return null;

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid numeric value: ${value}`);
  }

  return parsed;
}

function asBoolean(value: string): boolean {
  return value.toLowerCase() === "true";
}

function asDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

export async function importFixtures(): Promise<ImportSummary> {
  const now = new Date("2026-05-02T00:00:00.000Z");
  const markets = await readCsv<Record<string, string>>(
    join(fixtureDir, "markets.csv"),
  );
  const stocks = await readCsv<Record<string, string>>(
    join(fixtureDir, "stocks.csv"),
  );
  const prices = await readCsv<Record<string, string>>(
    join(fixtureDir, "daily_prices.csv"),
  );
  const financials = await readCsv<Record<string, string>>(
    join(fixtureDir, "annual_financials.csv"),
  );
  const dividends = await readCsv<Record<string, string>>(
    join(fixtureDir, "annual_dividends.csv"),
  );

  await prisma.importRun.create({
    data: {
      source: "fixture",
      importType: "full_fixture",
      status: "started",
      startedAt: now,
      completedAt: now,
      message: "Fixture import completed.",
    },
  });

  for (const row of markets) {
    await prisma.market.upsert({
      where: { code: row.code },
      update: {
        name: row.name,
        country: row.country,
        currency: row.currency,
        timezone: row.timezone,
        status: row.status,
      },
      create: {
        code: row.code,
        name: row.name,
        country: row.country,
        currency: row.currency,
        timezone: row.timezone,
        status: row.status,
      },
    });
  }

  for (const row of stocks) {
    const market = await prisma.market.findUniqueOrThrow({
      where: { code: row.marketCode },
    });

    await prisma.stock.upsert({
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
        sector: row.sector || null,
        industry: row.industry || null,
        providerSymbol: row.providerSymbol,
        isActive: asBoolean(row.isActive),
      },
      create: {
        marketId: market.id,
        exchange: row.exchange,
        stockCode: row.stockCode,
        stockName: row.stockName,
        currency: row.currency,
        sector: row.sector || null,
        industry: row.industry || null,
        providerSymbol: row.providerSymbol,
        isActive: asBoolean(row.isActive),
      },
    });
  }

  for (const row of prices) {
    const stock = await prisma.stock.findFirstOrThrow({
      where: { stockCode: row.stockCode },
    });
    const date = asDate(row.date);

    await prisma.dailyPrice.upsert({
      where: {
        stockId_date: {
          stockId: stock.id,
          date,
        },
      },
      update: {
        open: asNumber(row.open) ?? 0,
        high: asNumber(row.high) ?? 0,
        low: asNumber(row.low) ?? 0,
        close: asNumber(row.close) ?? 0,
        adjustedClose: asNumber(row.adjustedClose),
        volume: asNumber(row.volume),
        source: row.source,
        fetchedAt: now,
      },
      create: {
        stockId: stock.id,
        date,
        open: asNumber(row.open) ?? 0,
        high: asNumber(row.high) ?? 0,
        low: asNumber(row.low) ?? 0,
        close: asNumber(row.close) ?? 0,
        adjustedClose: asNumber(row.adjustedClose),
        volume: asNumber(row.volume),
        source: row.source,
        fetchedAt: now,
      },
    });
  }

  for (const row of financials) {
    const stock = await prisma.stock.findFirstOrThrow({
      where: { stockCode: row.stockCode },
    });
    const fiscalYear = Number(row.fiscalYear);

    await prisma.annualFinancial.upsert({
      where: {
        stockId_fiscalYear: {
          stockId: stock.id,
          fiscalYear,
        },
      },
      update: {
        revenue: asNumber(row.revenue),
        profitBeforeTax: asNumber(row.profitBeforeTax),
        profitAfterTax: asNumber(row.profitAfterTax),
        ebita: asNumber(row.ebita),
        totalDebt: asNumber(row.totalDebt),
        totalEquity: asNumber(row.totalEquity),
        sharesOutstanding: asNumber(row.sharesOutstanding),
        earningsPerShare: asNumber(row.earningsPerShare),
        bookValuePerShare: asNumber(row.bookValuePerShare),
        source: row.source,
        fetchedAt: now,
      },
      create: {
        stockId: stock.id,
        fiscalYear,
        revenue: asNumber(row.revenue),
        profitBeforeTax: asNumber(row.profitBeforeTax),
        profitAfterTax: asNumber(row.profitAfterTax),
        ebita: asNumber(row.ebita),
        totalDebt: asNumber(row.totalDebt),
        totalEquity: asNumber(row.totalEquity),
        sharesOutstanding: asNumber(row.sharesOutstanding),
        earningsPerShare: asNumber(row.earningsPerShare),
        bookValuePerShare: asNumber(row.bookValuePerShare),
        source: row.source,
        fetchedAt: now,
      },
    });
  }

  for (const row of dividends) {
    const stock = await prisma.stock.findFirstOrThrow({
      where: { stockCode: row.stockCode },
    });
    const fiscalYear = Number(row.fiscalYear);

    await prisma.annualDividend.upsert({
      where: {
        stockId_fiscalYear: {
          stockId: stock.id,
          fiscalYear,
        },
      },
      update: {
        dividendPerShare: asNumber(row.dividendPerShare),
        currency: row.currency,
        source: row.source,
        fetchedAt: now,
      },
      create: {
        stockId: stock.id,
        fiscalYear,
        dividendPerShare: asNumber(row.dividendPerShare),
        currency: row.currency,
        source: row.source,
        fetchedAt: now,
      },
    });
  }

  return {
    markets: markets.length,
    stocks: stocks.length,
    dailyPrices: prices.length,
    annualFinancials: financials.length,
    annualDividends: dividends.length,
  };
}
