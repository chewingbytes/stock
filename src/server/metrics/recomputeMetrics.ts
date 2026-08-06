import {
  calculate52WeekHigh,
  calculate52WeekLow,
  calculateDebtToEquity,
  calculateDividendGrowthRate,
  calculateDividendYield,
  calculateMarketCap,
  calculatePbRatio,
  calculatePeRatio,
  calculateProfitGrowthRate,
  calculateRevenueGrowthRate,
} from "../../domain/metrics";
import type { MetricResult } from "../../domain/types";
import { prisma } from "../db";

const formulaVersion = "v1";

type RecomputeSummary = {
  stocksProcessed: number;
  metricsWritten: number;
};

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

async function writeMetric(input: {
  stockId: number;
  metricKey: string;
  metricDate?: Date;
  fiscalYear?: number;
  currency?: string;
  result: MetricResult;
  inputSnapshot: Record<string, unknown>;
}) {
  const value = input.result.status === "complete" ? input.result.value : null;
  const reason = input.result.status === "complete" ? null : input.result.reason;
  const dataQuality = input.result.status;

  await prisma.derivedMetric.upsert({
    where: {
      stockId_metricKey_formulaVersion: {
        stockId: input.stockId,
        metricKey: input.metricKey,
        formulaVersion,
      },
    },
    update: {
      metricDate: input.metricDate ?? null,
      fiscalYear: input.fiscalYear ?? null,
      value,
      currency: input.currency ?? null,
      inputSnapshot: JSON.stringify(input.inputSnapshot),
      dataQuality,
      reason,
    },
    create: {
      stockId: input.stockId,
      metricKey: input.metricKey,
      metricDate: input.metricDate ?? null,
      fiscalYear: input.fiscalYear ?? null,
      value,
      currency: input.currency ?? null,
      formulaVersion,
      inputSnapshot: JSON.stringify(input.inputSnapshot),
      dataQuality,
      reason,
    },
  });
}

export async function recomputeMetrics(): Promise<RecomputeSummary> {
  const stocks = await prisma.stock.findMany({
    include: {
      // A trading year is ~252 sessions; 400 bounds the query while leaving
      // headroom to cover a full 52 weeks of bars for the range metrics.
      dailyPrices: { orderBy: { date: "desc" }, take: 400 },
      financials: { orderBy: { fiscalYear: "desc" }, take: 2 },
      dividends: { orderBy: { fiscalYear: "desc" }, take: 2 },
    },
  });

  let metricsWritten = 0;

  for (const stock of stocks) {
    const latestPrice = stock.dailyPrices[0];
    const latestFinancial = stock.financials[0];
    const priorFinancial = stock.financials[1];
    const latestDividend = stock.dividends[0];
    const priorDividend = stock.dividends[1];
    const metricDate = latestPrice?.date;
    const fiscalYear = latestFinancial?.fiscalYear;
    const closePrice = toNumber(latestPrice?.close);

    // Window the 52-week range on the latest bar we actually hold, so stocks
    // with stale history still report a range instead of dropping out.
    const windowStart = latestPrice
      ? new Date(latestPrice.date.getTime() - 365 * 24 * 60 * 60 * 1000)
      : null;
    const window52Weeks = windowStart
      ? stock.dailyPrices.filter((price) => price.date >= windowStart)
      : [];

    const metricInputs = [
      {
        metricKey: "market_cap",
        result: calculateMarketCap({
          closePrice,
          sharesOutstanding: toNumber(latestFinancial?.sharesOutstanding),
        }),
        currency: stock.currency,
        inputSnapshot: {
          closePrice,
          sharesOutstanding: toNumber(latestFinancial?.sharesOutstanding),
        },
      },
      {
        metricKey: "revenue_growth_rate",
        result: calculateRevenueGrowthRate({
          latestRevenue: toNumber(latestFinancial?.revenue),
          priorRevenue: toNumber(priorFinancial?.revenue),
        }),
        inputSnapshot: {
          latestRevenue: toNumber(latestFinancial?.revenue),
          priorRevenue: toNumber(priorFinancial?.revenue),
        },
      },
      {
        metricKey: "profit_growth_rate",
        result: calculateProfitGrowthRate({
          latestProfitAfterTax: toNumber(latestFinancial?.profitAfterTax),
          priorProfitAfterTax: toNumber(priorFinancial?.profitAfterTax),
        }),
        inputSnapshot: {
          latestProfitAfterTax: toNumber(latestFinancial?.profitAfterTax),
          priorProfitAfterTax: toNumber(priorFinancial?.profitAfterTax),
        },
      },
      {
        metricKey: "dividend_yield",
        result: calculateDividendYield({
          dividendPerShare: toNumber(latestDividend?.dividendPerShare),
          closePrice,
        }),
        inputSnapshot: {
          dividendPerShare: toNumber(latestDividend?.dividendPerShare),
          closePrice,
        },
      },
      {
        metricKey: "dividend_growth_rate",
        result: calculateDividendGrowthRate({
          latestDividend: toNumber(latestDividend?.dividendPerShare),
          priorDividend: toNumber(priorDividend?.dividendPerShare),
        }),
        inputSnapshot: {
          latestDividend: toNumber(latestDividend?.dividendPerShare),
          priorDividend: toNumber(priorDividend?.dividendPerShare),
        },
      },
      {
        metricKey: "pe_ratio",
        result: calculatePeRatio({
          closePrice,
          earningsPerShare: toNumber(latestFinancial?.earningsPerShare),
        }),
        inputSnapshot: {
          closePrice,
          earningsPerShare: toNumber(latestFinancial?.earningsPerShare),
        },
      },
      {
        metricKey: "pb_ratio",
        result: calculatePbRatio({
          closePrice,
          bookValuePerShare: toNumber(latestFinancial?.bookValuePerShare),
        }),
        inputSnapshot: {
          closePrice,
          bookValuePerShare: toNumber(latestFinancial?.bookValuePerShare),
        },
      },
      {
        metricKey: "debt_to_equity_ratio",
        result: calculateDebtToEquity({
          totalDebt: toNumber(latestFinancial?.totalDebt),
          totalEquity: toNumber(latestFinancial?.totalEquity),
        }),
        inputSnapshot: {
          totalDebt: toNumber(latestFinancial?.totalDebt),
          totalEquity: toNumber(latestFinancial?.totalEquity),
        },
      },
      {
        metricKey: "week52_high",
        result: calculate52WeekHigh({
          highs: window52Weeks.map((price) => toNumber(price.high)),
        }),
        currency: stock.currency,
        inputSnapshot: {
          sessions: window52Weeks.length,
          windowStart: windowStart?.toISOString() ?? null,
        },
      },
      {
        metricKey: "week52_low",
        result: calculate52WeekLow({
          lows: window52Weeks.map((price) => toNumber(price.low)),
        }),
        currency: stock.currency,
        inputSnapshot: {
          sessions: window52Weeks.length,
          windowStart: windowStart?.toISOString() ?? null,
        },
      },
    ];

    for (const item of metricInputs) {
      await writeMetric({
        stockId: stock.id,
        metricKey: item.metricKey,
        metricDate,
        fiscalYear,
        currency: item.currency,
        result: item.result,
        inputSnapshot: item.inputSnapshot,
      });
      metricsWritten += 1;
    }

    if (latestPrice) {
      const ohlcValues = {
        open: toNumber(latestPrice.open),
        high: toNumber(latestPrice.high),
        low: toNumber(latestPrice.low),
        close: toNumber(latestPrice.close),
        volume: toNumber(latestPrice.volume),
      };

      for (const [metricKey, value] of Object.entries(ohlcValues)) {
        await writeMetric({
          stockId: stock.id,
          metricKey,
          metricDate,
          // Volume is a share count, not a monetary amount.
          currency: metricKey === "volume" ? undefined : stock.currency,
          result:
            value === null
              ? { status: "missing", reason: `${metricKey}_missing` }
              : { status: "complete", value },
          inputSnapshot: { [metricKey]: value },
        });
        metricsWritten += 1;
      }
    }
  }

  return { stocksProcessed: stocks.length, metricsWritten };
}
