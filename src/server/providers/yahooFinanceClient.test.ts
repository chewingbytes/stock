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

describe("createYahooFinanceProvider", () => {
  it("creates a Yahoo client on the default path before fetching", async () => {
    const yahoo: YahooFinanceClient = {
      historical: vi.fn().mockResolvedValue([]),
      quote: vi.fn().mockResolvedValue({}),
      quoteSummary: vi.fn().mockResolvedValue({}),
    };
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
  });

  it("maps Yahoo historical, quote, and quoteSummary data to provider-neutral stock data", async () => {
    const now = new Date("2026-05-04T12:00:00.000Z");
    const yahoo: YahooFinanceClient = {
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
      quoteSummary: vi.fn().mockResolvedValue({
        incomeStatementHistory: {
          incomeStatementHistory: [
            {
              endDate: new Date("2025-09-30T00:00:00.000Z"),
              totalRevenue: 410_000_000_000,
              incomeBeforeTax: 123_000_000_000,
              netIncome: 102_000_000_000,
              ebit: 115_000_000_000,
            },
          ],
        },
        balanceSheetHistory: {
          balanceSheetStatements: [
            {
              endDate: new Date("2025-09-30T00:00:00.000Z"),
              totalDebt: 90_000_000_000,
              totalStockholderEquity: 72_000_000_000,
            },
          ],
        },
        defaultKeyStatistics: {
          sharesOutstanding: 15_400_000_000,
          trailingEps: 6.62,
          bookValue: 4.68,
        },
        summaryDetail: {
          dividendRate: 1,
          currency: "USD",
        },
      }),
    };

    const provider = createYahooFinanceProvider({ yahoo, now: () => now });

    const data = await provider.fetchStock(row);

    expect(provider.source).toBe("yahoo_finance");
    expect(yahoo.historical).toHaveBeenCalledWith("AAPL", {
      period1: new Date("2025-05-04T12:00:00.000Z"),
      period2: now,
      interval: "1d",
    });
    expect(yahoo.quote).toHaveBeenCalledWith("AAPL");
    expect(yahoo.quoteSummary).toHaveBeenCalledWith("AAPL", {
      modules: [
        "incomeStatementHistory",
        "balanceSheetHistory",
        "defaultKeyStatistics",
        "summaryDetail",
      ],
    });
    expect(data).toEqual({
      row,
      dailyPrices: [
        {
          date: new Date("2026-05-01T00:00:00.000Z"),
          open: 170,
          high: 173,
          low: 169,
          close: 172,
          adjustedClose: 171.5,
          volume: 65_000_000,
        },
      ],
      marketCaps: [
        {
          date: now,
          marketCap: 2_650_000_000_000,
          currency: "USD",
          calculationMethod: "reported",
        },
      ],
      annualFinancials: [
        {
          fiscalYear: 2025,
          revenue: 410_000_000_000,
          profitBeforeTax: 123_000_000_000,
          profitAfterTax: 102_000_000_000,
          ebita: 115_000_000_000,
          totalDebt: 90_000_000_000,
          totalEquity: 72_000_000_000,
          sharesOutstanding: 15_400_000_000,
          earningsPerShare: 6.62,
          bookValuePerShare: 4.68,
        },
      ],
      annualDividends: [
        {
          fiscalYear: 2026,
          dividendPerShare: 1,
          currency: "USD",
        },
      ],
      warnings: [],
    });
  });

  it("does not merge balance sheet values from a different fiscal year", async () => {
    const yahoo: YahooFinanceClient = {
      historical: vi.fn().mockResolvedValue([
        {
          date: new Date("2026-05-01T00:00:00.000Z"),
          open: 170,
          high: 173,
          low: 169,
          close: 172,
        },
      ]),
      quote: vi.fn().mockResolvedValue({}),
      quoteSummary: vi.fn().mockResolvedValue({
        incomeStatementHistory: {
          incomeStatementHistory: [
            {
              endDate: new Date("2025-09-30T00:00:00.000Z"),
              totalRevenue: 410_000_000_000,
              incomeBeforeTax: 123_000_000_000,
              netIncome: 102_000_000_000,
              ebit: 115_000_000_000,
            },
          ],
        },
        balanceSheetHistory: {
          balanceSheetStatements: [
            {
              endDate: new Date("2024-09-30T00:00:00.000Z"),
              totalDebt: 90_000_000_000,
              totalStockholderEquity: 72_000_000_000,
            },
          ],
        },
        defaultKeyStatistics: {},
        summaryDetail: {},
      }),
    };

    const provider = createYahooFinanceProvider({
      yahoo,
      now: () => new Date("2026-05-04T12:00:00.000Z"),
    });

    const data = await provider.fetchStock(row);

    expect(data.annualFinancials).toEqual([
      {
        fiscalYear: 2025,
        revenue: 410_000_000_000,
        profitBeforeTax: 123_000_000_000,
        profitAfterTax: 102_000_000_000,
        ebita: 115_000_000_000,
        totalDebt: null,
        totalEquity: null,
        sharesOutstanding: null,
        earningsPerShare: null,
        bookValuePerShare: null,
      },
    ]);
    expect(data.warnings).toEqual(["annual_financials_incomplete"]);
  });

  it("returns historical and quote data with a warning when quoteSummary fails", async () => {
    const now = new Date("2026-05-04T12:00:00.000Z");
    const yahoo: YahooFinanceClient = {
      historical: vi.fn().mockResolvedValue([
        {
          date: new Date("2026-05-01T00:00:00.000Z"),
          open: 170,
          high: 173,
          low: 169,
          close: 172,
        },
      ]),
      quote: vi.fn().mockResolvedValue({
        marketCap: 2_650_000_000_000,
        currency: "USD",
      }),
      quoteSummary: vi.fn().mockRejectedValue(new Error("summary unavailable")),
    };

    const provider = createYahooFinanceProvider({ yahoo, now: () => now });

    await expect(provider.fetchStock(row)).resolves.toMatchObject({
      dailyPrices: [
        {
          date: new Date("2026-05-01T00:00:00.000Z"),
          open: 170,
          high: 173,
          low: 169,
          close: 172,
        },
      ],
      annualFinancials: [],
      annualDividends: [],
      marketCaps: [
        {
          date: now,
          marketCap: 2_650_000_000_000,
          currency: "USD",
          calculationMethod: "reported",
        },
      ],
      warnings: ["quote_summary_failed", "no_annual_financials"],
    });
  });

  it("returns warnings instead of throwing when optional daily prices and fundamentals are missing", async () => {
    const yahoo: YahooFinanceClient = {
      historical: vi.fn().mockResolvedValue([]),
      quote: vi.fn().mockResolvedValue({}),
      quoteSummary: vi.fn().mockResolvedValue({
        summaryDetail: {},
      }),
    };

    const provider = createYahooFinanceProvider({
      yahoo,
      now: () => new Date("2026-05-04T12:00:00.000Z"),
    });

    await expect(provider.fetchStock(row)).resolves.toMatchObject({
      dailyPrices: [],
      annualFinancials: [],
      annualDividends: [],
      marketCaps: [],
      warnings: ["no_daily_prices", "no_annual_financials"],
    });
  });
});
