import {
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
      dailyPrices: { orderBy: { date: "desc" }, take: 1 },
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
      };

      for (const [metricKey, value] of Object.entries(ohlcValues)) {
        await writeMetric({
          stockId: stock.id,
          metricKey,
          metricDate,
          currency: stock.currency,
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
