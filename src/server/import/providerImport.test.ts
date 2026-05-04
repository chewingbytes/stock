import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../db";
import type { MarketDataProvider, ProviderUniverseRow } from "../providers/types";
import { importFixtures } from "./fixtureImport";
import { importProviderUniverse } from "./providerImport";

function uniqueStockCode(prefix: string): string {
  return `${prefix}${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
}

function rowFor(
  stockCode: string,
  stockName: string,
  providerSymbol: string,
): ProviderUniverseRow {
  return {
    marketCode: "SGX",
    exchange: "SGX",
    stockCode,
    stockName,
    currency: "SGD",
    providerSymbol,
  };
}

describe("importProviderUniverse", () => {
  beforeEach(async () => {
    await importFixtures();
  });

  it("normalizes complete provider data into raw fact tables", async () => {
    const now = new Date("2026-05-04T10:00:00.000Z");
    const stockCode = "Z74";
    const row = rowFor(
      stockCode,
      "Singapore Telecommunications Ltd",
      "Z74.SI",
    );
    const provider: MarketDataProvider = {
      source: `provider_import_complete_${stockCode}`,
      async fetchStock(input) {
        return {
          row: input,
          dailyPrices: [
            {
              date: new Date("2026-05-01T00:00:00.000Z"),
              open: 1.1,
              high: 1.3,
              low: 1,
              close: 1.2,
              adjustedClose: 1.18,
              volume: 123_456,
            },
          ],
          annualFinancials: [
            {
              fiscalYear: 2025,
              revenue: 100_000,
              profitBeforeTax: 20_000,
              profitAfterTax: 15_000,
              ebita: 18_000,
              totalDebt: 5_000,
              totalEquity: 50_000,
              sharesOutstanding: 1_000,
              earningsPerShare: 15,
              bookValuePerShare: 50,
            },
          ],
          annualDividends: [
            {
              fiscalYear: 2025,
              dividendPerShare: 0.08,
              currency: "SGD",
            },
          ],
          marketCaps: [
            {
              date: new Date("2026-05-01T00:00:00.000Z"),
              marketCap: 1_200_000,
              currency: "SGD",
              calculationMethod: "reported",
            },
          ],
          warnings: [],
        };
      },
    };

    const summary = await importProviderUniverse({ provider, rows: [row], now });

    expect(summary).toEqual({
      source: provider.source,
      attempted: 1,
      imported: 1,
      partial: 0,
      failed: 0,
    });

    const market = await prisma.market.findUniqueOrThrow({
      where: { code: "SGX" },
    });
    expect(market).toMatchObject({
      name: "Singapore Exchange",
      country: "Singapore",
      currency: "SGD",
      timezone: "Asia/Singapore",
    });

    const stock = await prisma.stock.findUniqueOrThrow({
      where: {
        marketId_stockCode: {
          marketId: market.id,
          stockCode,
        },
      },
    });
    expect(stock).toMatchObject({
      exchange: "SGX",
      stockName: row.stockName,
      currency: "SGD",
      sector: "Communication Services",
      industry: "Telecom",
      providerSymbol: row.providerSymbol,
      isActive: true,
    });

    const dailyPrice = await prisma.dailyPrice.findUniqueOrThrow({
      where: {
        stockId_date: {
          stockId: stock.id,
          date: new Date("2026-05-01T00:00:00.000Z"),
        },
      },
    });
    expect(Number(dailyPrice.open)).toBe(1.1);
    expect(Number(dailyPrice.close)).toBe(1.2);
    expect(Number(dailyPrice.adjustedClose)).toBe(1.18);
    expect(Number(dailyPrice.volume)).toBe(123_456);
    expect(dailyPrice.source).toBe(provider.source);
    expect(dailyPrice.fetchedAt).toEqual(now);

    const financial = await prisma.annualFinancial.findUniqueOrThrow({
      where: {
        stockId_fiscalYear: {
          stockId: stock.id,
          fiscalYear: 2025,
        },
      },
    });
    expect(Number(financial.revenue)).toBe(100_000);
    expect(Number(financial.profitBeforeTax)).toBe(20_000);
    expect(Number(financial.totalEquity)).toBe(50_000);
    expect(financial.source).toBe(provider.source);

    const dividend = await prisma.annualDividend.findUniqueOrThrow({
      where: {
        stockId_fiscalYear: {
          stockId: stock.id,
          fiscalYear: 2025,
        },
      },
    });
    expect(Number(dividend.dividendPerShare)).toBe(0.08);
    expect(dividend.currency).toBe("SGD");
    expect(dividend.source).toBe(provider.source);

    const marketCap = await prisma.marketCap.findUniqueOrThrow({
      where: {
        stockId_date_source: {
          stockId: stock.id,
          date: new Date("2026-05-01T00:00:00.000Z"),
          source: provider.source,
        },
      },
    });
    expect(Number(marketCap.marketCap)).toBe(1_200_000);
    expect(marketCap.calculationMethod).toBe("reported");
    expect(marketCap.fetchedAt).toEqual(now);

    const importRun = await prisma.importRun.findFirstOrThrow({
      where: { source: provider.source, importType: "provider_universe" },
      orderBy: { id: "desc" },
    });
    expect(importRun.status).toBe("completed");
    expect(importRun.startedAt).toEqual(now);
    expect(importRun.completedAt).toEqual(now);
  });

  it("marks provider warnings as partial and records warning messages", async () => {
    const now = new Date("2026-05-04T11:00:00.000Z");
    const stockCode = "D05";
    const row = rowFor(stockCode, "DBS Group Holdings Ltd", "D05.SI");
    const provider: MarketDataProvider = {
      source: `provider_import_partial_${stockCode}_${uniqueStockCode("RUN")}`,
      async fetchStock(input) {
        return {
          row: input,
          dailyPrices: [],
          annualFinancials: [],
          annualDividends: [],
          marketCaps: [],
          warnings: ["no_daily_prices", "no_annual_financials"],
        };
      },
    };

    const summary = await importProviderUniverse({ provider, rows: [row], now });

    expect(summary).toEqual({
      source: provider.source,
      attempted: 1,
      imported: 0,
      partial: 1,
      failed: 0,
    });

    const importRun = await prisma.importRun.findFirstOrThrow({
      where: { source: provider.source, importType: "provider_universe" },
      orderBy: { id: "desc" },
    });
    expect(importRun.status).toBe("partial");
    expect(importRun.message).toContain(
      "D05: no_daily_prices, no_annual_financials",
    );
  });
});
