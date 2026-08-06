import {beforeEach, expect, it} from "vitest";
import { describeDb } from "../../test/dbTest";
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

describeDb("importProviderUniverse", () => {
  const providerOnlyDate = new Date("2035-01-01T00:00:00.000Z");
  const providerOnlyFiscalYear = 2035;

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
              date: providerOnlyDate,
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
              fiscalYear: providerOnlyFiscalYear,
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
              fiscalYear: providerOnlyFiscalYear,
              dividendPerShare: 0.08,
              currency: "SGD",
            },
          ],
          marketCaps: [
            {
              date: providerOnlyDate,
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
          date: providerOnlyDate,
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
          fiscalYear: providerOnlyFiscalYear,
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
          fiscalYear: providerOnlyFiscalYear,
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
          date: providerOnlyDate,
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

  it("preserves existing fixture annual financials and dividends from other sources", async () => {
    const now = new Date("2026-05-04T11:30:00.000Z");
    const stockCode = "D05";
    const row = rowFor(stockCode, "DBS Group Holdings Ltd", "D05.SI");
    const provider: MarketDataProvider = {
      source: `provider_import_skip_existing_${stockCode}_${uniqueStockCode("RUN")}`,
      async fetchStock(input) {
        return {
          row: input,
          dailyPrices: [],
          annualFinancials: [
            {
              fiscalYear: 2025,
              revenue: null,
              profitBeforeTax: null,
              profitAfterTax: null,
              ebita: null,
              totalDebt: null,
              totalEquity: null,
              sharesOutstanding: null,
              earningsPerShare: null,
              bookValuePerShare: null,
            },
          ],
          annualDividends: [
            {
              fiscalYear: 2025,
              dividendPerShare: null,
              currency: "SGD",
            },
          ],
          marketCaps: [],
          warnings: [],
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

    const stock = await prisma.stock.findFirstOrThrow({
      where: { stockCode, market: { code: "SGX" } },
    });
    const financial = await prisma.annualFinancial.findUniqueOrThrow({
      where: {
        stockId_fiscalYear: {
          stockId: stock.id,
          fiscalYear: 2025,
        },
      },
    });
    const dividend = await prisma.annualDividend.findUniqueOrThrow({
      where: {
        stockId_fiscalYear: {
          stockId: stock.id,
          fiscalYear: 2025,
        },
      },
    });
    const importRun = await prisma.importRun.findFirstOrThrow({
      where: { source: provider.source, importType: "provider_universe" },
      orderBy: { id: "desc" },
    });

    expect(Number(financial.revenue)).toBe(24_000_000_000);
    expect(Number(financial.profitAfterTax)).toBe(11_200_000_000);
    expect(financial.source).toBe("fixture");
    expect(Number(dividend.dividendPerShare)).toBe(2.4);
    expect(dividend.source).toBe("fixture");
    expect(importRun.status).toBe("partial");
    expect(importRun.message).toContain(
      "D05: skipped_existing_annual_financial, skipped_existing_annual_dividend",
    );
  });

  it("records all failed provider rows as a failed import run", async () => {
    const now = new Date("2026-05-04T12:00:00.000Z");
    const stockCode = "D05";
    const row = rowFor(stockCode, "DBS Group Holdings Ltd", "D05.SI");
    const provider: MarketDataProvider = {
      source: `provider_import_failed_${stockCode}_${uniqueStockCode("RUN")}`,
      async fetchStock() {
        throw new Error("provider unavailable");
      },
    };

    const summary = await importProviderUniverse({ provider, rows: [row], now });

    expect(summary).toEqual({
      source: provider.source,
      attempted: 1,
      imported: 0,
      partial: 0,
      failed: 1,
    });

    const importRun = await prisma.importRun.findFirstOrThrow({
      where: { source: provider.source, importType: "provider_universe" },
      orderBy: { id: "desc" },
    });
    expect(importRun.status).toBe("failed");
    expect(importRun.message).toContain("D05: provider unavailable");
  });

  it("rolls back raw facts when a row write fails after starting", async () => {
    const now = new Date("2026-05-04T13:00:00.000Z");
    const stockCode = "Z74";
    const row = rowFor(
      stockCode,
      "Singapore Telecommunications Ltd",
      "Z74.SI",
    );
    const provider: MarketDataProvider = {
      source: `provider_import_atomic_${stockCode}_${uniqueStockCode("RUN")}`,
      async fetchStock(input) {
        return {
          row: input,
          dailyPrices: [
            {
              date: providerOnlyDate,
              open: 2.4,
              high: 2.5,
              low: 2.3,
              close: 2.45,
              adjustedClose: 2.45,
              volume: 120_000,
            },
          ],
          annualFinancials: [],
          annualDividends: [],
          marketCaps: [
            {
              date: providerOnlyDate,
              marketCap: null as unknown as number,
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
      imported: 0,
      partial: 0,
      failed: 1,
    });

    const stock = await prisma.stock.findFirst({
      where: { stockCode, market: { code: "SGX" } },
    });
    const dailyPrice = await prisma.dailyPrice.findFirst({
      where: {
        date: providerOnlyDate,
        source: provider.source,
      },
    });
    const marketCap = await prisma.marketCap.findFirst({
      where: {
        date: providerOnlyDate,
        source: provider.source,
      },
    });
    const importRun = await prisma.importRun.findFirstOrThrow({
      where: { source: provider.source, importType: "provider_universe" },
      orderBy: { id: "desc" },
    });

    expect(stock).not.toBeNull();
    expect(dailyPrice).toBeNull();
    expect(marketCap).toBeNull();
    expect(importRun.status).toBe("failed");
  });
});
