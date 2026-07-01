import type { MetricResult } from "./types";

function missing(reason: string): MetricResult {
  return { status: "missing", reason };
}

function unavailable(reason: string): MetricResult {
  return { status: "unavailable", reason };
}

function complete(value: number): MetricResult {
  if (!Number.isFinite(value)) {
    return unavailable("metric_not_finite");
  }

  return { status: "complete", value: Number(value.toFixed(12)) };
}

function requireNumber(
  value: number | null | undefined,
  reason: string,
): MetricResult | number {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return missing(reason);
  }

  return value;
}

export function calculateMarketCap(input: {
  closePrice: number | null | undefined;
  sharesOutstanding: number | null | undefined;
}): MetricResult {
  const closePrice = requireNumber(input.closePrice, "close_price_missing");
  if (typeof closePrice !== "number") return closePrice;

  const sharesOutstanding = requireNumber(
    input.sharesOutstanding,
    "shares_outstanding_missing",
  );
  if (typeof sharesOutstanding !== "number") return sharesOutstanding;

  if (closePrice < 0) return unavailable("close_price_negative");
  if (sharesOutstanding <= 0) {
    return unavailable("shares_outstanding_not_positive");
  }

  return complete(closePrice * sharesOutstanding);
}

export function calculateRevenueGrowthRate(input: {
  latestRevenue: number | null | undefined;
  priorRevenue: number | null | undefined;
}): MetricResult {
  const latestRevenue = requireNumber(
    input.latestRevenue,
    "latest_revenue_missing",
  );
  if (typeof latestRevenue !== "number") return latestRevenue;

  const priorRevenue = requireNumber(input.priorRevenue, "prior_revenue_missing");
  if (typeof priorRevenue !== "number") return priorRevenue;

  if (priorRevenue <= 0) return unavailable("prior_revenue_not_positive");

  return complete(((latestRevenue - priorRevenue) / priorRevenue) * 100);
}

export function calculateProfitGrowthRate(input: {
  latestProfitAfterTax: number | null | undefined;
  priorProfitAfterTax: number | null | undefined;
}): MetricResult {
  const latestProfit = requireNumber(
    input.latestProfitAfterTax,
    "latest_profit_after_tax_missing",
  );
  if (typeof latestProfit !== "number") return latestProfit;

  const priorProfit = requireNumber(
    input.priorProfitAfterTax,
    "prior_profit_after_tax_missing",
  );
  if (typeof priorProfit !== "number") return priorProfit;

  if (priorProfit <= 0) {
    return unavailable("prior_profit_after_tax_not_positive");
  }

  return complete(((latestProfit - priorProfit) / priorProfit) * 100);
}

export function calculateDividendYield(input: {
  dividendPerShare: number | null | undefined;
  closePrice: number | null | undefined;
}): MetricResult {
  const dividend = requireNumber(
    input.dividendPerShare,
    "dividend_per_share_missing",
  );
  if (typeof dividend !== "number") return dividend;

  const closePrice = requireNumber(input.closePrice, "close_price_missing");
  if (typeof closePrice !== "number") return closePrice;

  if (dividend < 0) return unavailable("dividend_per_share_negative");
  if (closePrice <= 0) return unavailable("close_price_not_positive");

  return complete((dividend / closePrice) * 100);
}

export function calculateDividendGrowthRate(input: {
  latestDividend: number | null | undefined;
  priorDividend: number | null | undefined;
}): MetricResult {
  const latestDividend = requireNumber(
    input.latestDividend,
    "latest_dividend_missing",
  );
  if (typeof latestDividend !== "number") return latestDividend;

  const priorDividend = requireNumber(
    input.priorDividend,
    "prior_dividend_missing",
  );
  if (typeof priorDividend !== "number") return priorDividend;

  if (priorDividend <= 0) return unavailable("prior_dividend_not_positive");

  return complete(((latestDividend - priorDividend) / priorDividend) * 100);
}

export function calculatePeRatio(input: {
  closePrice: number | null | undefined;
  earningsPerShare: number | null | undefined;
}): MetricResult {
  const closePrice = requireNumber(input.closePrice, "close_price_missing");
  if (typeof closePrice !== "number") return closePrice;

  const earningsPerShare = requireNumber(
    input.earningsPerShare,
    "earnings_per_share_missing",
  );
  if (typeof earningsPerShare !== "number") return earningsPerShare;

  if (closePrice <= 0) return unavailable("close_price_not_positive");
  if (earningsPerShare <= 0) {
    return unavailable("earnings_per_share_not_positive");
  }

  return complete(closePrice / earningsPerShare);
}

export function calculatePbRatio(input: {
  closePrice: number | null | undefined;
  bookValuePerShare: number | null | undefined;
}): MetricResult {
  const closePrice = requireNumber(input.closePrice, "close_price_missing");
  if (typeof closePrice !== "number") return closePrice;

  const bookValuePerShare = requireNumber(
    input.bookValuePerShare,
    "book_value_per_share_missing",
  );
  if (typeof bookValuePerShare !== "number") return bookValuePerShare;

  if (closePrice <= 0) return unavailable("close_price_not_positive");
  if (bookValuePerShare <= 0) {
    return unavailable("book_value_per_share_not_positive");
  }

  return complete(closePrice / bookValuePerShare);
}

export function calculateDebtToEquity(input: {
  totalDebt: number | null | undefined;
  totalEquity: number | null | undefined;
}): MetricResult {
  const totalDebt = requireNumber(input.totalDebt, "total_debt_missing");
  if (typeof totalDebt !== "number") return totalDebt;

  const totalEquity = requireNumber(input.totalEquity, "total_equity_missing");
  if (typeof totalEquity !== "number") return totalEquity;

  if (totalDebt < 0) return unavailable("total_debt_negative");
  if (totalEquity <= 0) return unavailable("total_equity_not_positive");

  return complete(totalDebt / totalEquity);
}
