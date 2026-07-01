import { describe, expect, it, vi } from "vitest";
import {
  createYahooFinanceProvider,
  type YahooFinanceClient,
} from "./yahooFinanceClient";
import type { ProviderUniverseRow } from "./types";

const row: ProviderUniverseRow = {
  marketCode: "US",
  exchange: "NASDAQ",
  stockCode: "AAPL",
  stockName: "Apple Inc",
  currency: "USD",
  providerSymbol: "AAPL",
};

function makeClient(overrides: Partial<YahooFinanceClient> = {}): YahooFinanceClient {
  return {
    historical: vi.fn().mockResolvedValue([]),
    quote: vi.fn().mockResolvedValue({}),
    fundamentalsTimeSeries: vi.fn().mockResolvedValue([]),
    chart: vi.fn().mockResolvedValue({}),
    ...overrides,
  };
}

describe("createYahooFinanceProvider", () => {
  it("creates a Yahoo client on the default path before fetching", async () => {
    const yahoo = makeClient();
    const createYahoo = vi.fn(() => yahoo);
    const provider = createYahooFinanceProvider({
      createYahoo,
      now: () => new Date("2026-05-04T12:00:00.000Z"),
    });

    await provider.fetchStock(row);

    expect(createYahoo).toHaveBeenCalledTimes(1);
    expect(yahoo.historical).toHaveBeenCalledWith("AAPL", {
      period1: new Date("2025-05-04T12:00:00.000Z"),
      period2: new Date("2026-05-04T12:00:00.000Z"),
      interval: "1d",
    });
    expect(yahoo.fundamentalsTimeSeries).toHaveBeenCalledWith("AAPL", {
      period1: new Date("2021-05-04T12:00:00.000Z"),
      period2: new Date("2026-05-04T12:00:00.000Z"),
      type: "annual",
      module: "all",
    });
  });

  it("maps multi-year fundamentals, dividends, prices, and market cap", async () => {
    const now = new Date("2026-05-04T12:00:00.000Z");
    const yahoo = makeClient({
      historical: vi.fn().mockResolvedValue([
        {
          date: new Date("2026-05-01T00:00:00.000Z"),
          open: 170,
          high: 173,
          low: 169,
          close: 172,
          adjClose: 171.5,
          volume: 65_000_000,
        },
      ]),
      quote: vi.fn().mockResolvedValue({
        marketCap: 2_650_000_000_000,
        currency: "USD",
      }),
      fundamentalsTimeSeries: vi.fn().mockResolvedValue([
        // Padded empty boundary row should be dropped.
        { date: new Date("2023-09-30T00:00:00.000Z") },
        {
          date: new Date("2024-09-30T00:00:00.000Z"),
          totalRevenue: 383_000_000_000,
          pretaxIncome: 113_000_000_000,
          netIncome: 97_000_000_000,
          EBITDA: 125_000_000_000,
          totalDebt: 111_000_000_000,
          stockholdersEquity: 62_000_000_000,
          ordinarySharesNumber: 15_550_000_000,
          basicEPS: 6.16,
        },
        {
          date: new Date("2025-09-30T00:00:00.000Z"),
          totalRevenue: 391_000_000_000,
          pretaxIncome: 123_000_000_000,
          netIncome: 93_000_000_000,
          EBITDA: 134_000_000_000,
          totalDebt: 106_000_000_000,
          stockholdersEquity: 57_000_000_000,
          ordinarySharesNumber: 15_000_000_000,
          basicEPS: 6.11,
        },
      ]),
      chart: vi.fn().mockResolvedValue({
        events: {
          dividends: [
            { date: new Date("2024-02-15T00:00:00.000Z"), amount: 0.24 },
            { date: new Date("2024-08-15T00:00:00.000Z"), amount: 0.25 },
            { date: new Date("2025-02-15T00:00:00.000Z"), amount: 0.26 },
          ],
        },
      }),
    });

    const provider = createYahooFinanceProvider({ yahoo, now: () => now });
    const data = await provider.fetchStock(row);

    expect(provider.source).toBe("yahoo_finance");
    expect(yahoo.quote).toHaveBeenCalledWith("AAPL");
    expect(yahoo.chart).toHaveBeenCalledWith("AAPL", {
      period1: new Date("2021-05-04T12:00:00.000Z"),
      period2: now,
      interval: "1d",
      events: "dividends",
    });

    expect(data.dailyPrices).toEqual([
      {
        date: new Date("2026-05-01T00:00:00.000Z"),
        open: 170,
        high: 173,
        low: 169,
        close: 172,
        adjustedClose: 171.5,
        volume: 65_000_000,
      },
    ]);
    expect(data.marketCaps).toEqual([
      {
        date: now,
        marketCap: 2_650_000_000_000,
        currency: "USD",
        calculationMethod: "reported",
      },
    ]);
    expect(data.annualFinancials).toEqual([
      {
        fiscalYear: 2024,
        revenue: 383_000_000_000,
        profitBeforeTax: 113_000_000_000,
        profitAfterTax: 97_000_000_000,
        ebita: 125_000_000_000,
        totalDebt: 111_000_000_000,
        totalEquity: 62_000_000_000,
        sharesOutstanding: 15_550_000_000,
        earningsPerShare: 6.16,
        bookValuePerShare: 62_000_000_000 / 15_550_000_000,
      },
      {
        fiscalYear: 2025,
        revenue: 391_000_000_000,
        profitBeforeTax: 123_000_000_000,
        profitAfterTax: 93_000_000_000,
        ebita: 134_000_000_000,
        totalDebt: 106_000_000_000,
        totalEquity: 57_000_000_000,
        sharesOutstanding: 15_000_000_000,
        earningsPerShare: 6.11,
        bookValuePerShare: 57_000_000_000 / 15_000_000_000,
      },
    ]);
    expect(data.annualDividends).toEqual([
      { fiscalYear: 2024, dividendPerShare: 0.49, currency: "USD" },
      { fiscalYear: 2025, dividendPerShare: 0.26, currency: "USD" },
    ]);
    expect(data.warnings).toEqual([]);
  });

  it("warns when only one fiscal year of fundamentals is available", async () => {
    const yahoo = makeClient({
      historical: vi.fn().mockResolvedValue([
        { date: new Date("2026-05-01T00:00:00.000Z"), open: 1, high: 1, low: 1, close: 1 },
      ]),
      fundamentalsTimeSeries: vi.fn().mockResolvedValue([
        {
          date: new Date("2025-09-30T00:00:00.000Z"),
          totalRevenue: 100,
          netIncome: 10,
          stockholdersEquity: 50,
          ordinarySharesNumber: 5,
          basicEPS: 2,
          totalDebt: 20,
        },
      ]),
      chart: vi.fn().mockResolvedValue({
        events: { dividends: [{ date: new Date("2025-02-15T00:00:00.000Z"), amount: 1 }] },
      }),
    });

    const provider = createYahooFinanceProvider({
      yahoo,
      now: () => new Date("2026-05-04T12:00:00.000Z"),
    });
    const data = await provider.fetchStock(row);

    expect(data.annualFinancials).toHaveLength(1);
    expect(data.warnings).toContain("insufficient_financial_history");
  });

  it("returns warnings instead of throwing when fundamentals and dividends fail", async () => {
    const yahoo = makeClient({
      historical: vi.fn().mockResolvedValue([]),
      quote: vi.fn().mockResolvedValue({}),
      fundamentalsTimeSeries: vi.fn().mockRejectedValue(new Error("fundamentals down")),
      chart: vi.fn().mockRejectedValue(new Error("chart down")),
    });

    const provider = createYahooFinanceProvider({
      yahoo,
      now: () => new Date("2026-05-04T12:00:00.000Z"),
    });

    await expect(provider.fetchStock(row)).resolves.toMatchObject({
      dailyPrices: [],
      annualFinancials: [],
      annualDividends: [],
      marketCaps: [],
      warnings: [
        "fundamentals_failed",
        "dividends_failed",
        "no_daily_prices",
        "no_annual_financials",
        "no_dividends",
      ],
    });
  });
});
