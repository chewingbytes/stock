import { describe, expect, it } from "vitest";
import {
  calculateDebtToEquity,
  calculateDividendGrowthRate,
  calculateDividendYield,
  calculateMarketCap,
  calculatePbRatio,
  calculatePeRatio,
  calculateProfitGrowthRate,
  calculateRevenueGrowthRate,
} from "./metrics";

describe("metric formulas", () => {
  it("calculates market cap from close price and shares outstanding", () => {
    expect(
      calculateMarketCap({ closePrice: 10, sharesOutstanding: 1_000_000 }),
    ).toEqual({
      status: "complete",
      value: 10_000_000,
    });
  });

  it("marks market cap unavailable when shares are missing", () => {
    expect(calculateMarketCap({ closePrice: 10, sharesOutstanding: null })).toEqual({
      status: "missing",
      reason: "shares_outstanding_missing",
    });
  });

  it("calculates revenue growth", () => {
    expect(
      calculateRevenueGrowthRate({ latestRevenue: 125, priorRevenue: 100 }),
    ).toEqual({
      status: "complete",
      value: 0.25,
    });
  });

  it("marks revenue growth unavailable for zero prior revenue", () => {
    expect(
      calculateRevenueGrowthRate({ latestRevenue: 125, priorRevenue: 0 }),
    ).toEqual({
      status: "unavailable",
      reason: "prior_revenue_not_positive",
    });
  });

  it("calculates profit growth using profit after tax", () => {
    expect(
      calculateProfitGrowthRate({
        latestProfitAfterTax: 90,
        priorProfitAfterTax: 60,
      }),
    ).toEqual({
      status: "complete",
      value: 0.5,
    });
  });

  it("calculates dividend yield", () => {
    expect(
      calculateDividendYield({ dividendPerShare: 0.5, closePrice: 20 }),
    ).toEqual({
      status: "complete",
      value: 0.025,
    });
  });

  it("allows confirmed zero dividends to produce zero dividend yield", () => {
    expect(
      calculateDividendYield({ dividendPerShare: 0, closePrice: 20 }),
    ).toEqual({
      status: "complete",
      value: 0,
    });
  });

  it("calculates dividend growth", () => {
    expect(
      calculateDividendGrowthRate({ latestDividend: 0.6, priorDividend: 0.5 }),
    ).toEqual({
      status: "complete",
      value: 0.2,
    });
  });

  it("marks dividend growth unavailable when prior dividend is zero", () => {
    expect(
      calculateDividendGrowthRate({ latestDividend: 0.6, priorDividend: 0 }),
    ).toEqual({
      status: "unavailable",
      reason: "prior_dividend_not_positive",
    });
  });

  it("calculates P/E", () => {
    expect(calculatePeRatio({ closePrice: 30, earningsPerShare: 3 })).toEqual({
      status: "complete",
      value: 10,
    });
  });

  it("marks P/E unavailable for negative earnings", () => {
    expect(calculatePeRatio({ closePrice: 30, earningsPerShare: -1 })).toEqual({
      status: "unavailable",
      reason: "earnings_per_share_not_positive",
    });
  });

  it("calculates P/B", () => {
    expect(calculatePbRatio({ closePrice: 25, bookValuePerShare: 10 })).toEqual({
      status: "complete",
      value: 2.5,
    });
  });

  it("calculates debt to equity", () => {
    expect(calculateDebtToEquity({ totalDebt: 40, totalEquity: 100 })).toEqual({
      status: "complete",
      value: 0.4,
    });
  });
});
