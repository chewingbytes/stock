import yahooFinance from "yahoo-finance2";
import type {
  MarketDataProvider,
  ProviderAnnualFinancial,
  ProviderDailyPrice,
  ProviderMarketCap,
} from "./types";

type YahooHistoricalRow = {
  date?: unknown;
  open?: unknown;
  high?: unknown;
  low?: unknown;
  close?: unknown;
  adjClose?: unknown;
  volume?: unknown;
};

type YahooQuote = {
  marketCap?: unknown;
  currency?: unknown;
};

type YahooIncomeStatement = {
  endDate?: unknown;
  totalRevenue?: unknown;
  incomeBeforeTax?: unknown;
  netIncome?: unknown;
  ebit?: unknown;
};

type YahooBalanceSheet = {
  endDate?: unknown;
  totalDebt?: unknown;
  totalStockholderEquity?: unknown;
  stockholdersEquity?: unknown;
  totalEquityGrossMinorityInterest?: unknown;
};

type YahooQuoteSummary = {
  incomeStatementHistory?: {
    incomeStatementHistory?: YahooIncomeStatement[];
  };
  balanceSheetHistory?: {
    balanceSheetStatements?: YahooBalanceSheet[];
  };
  defaultKeyStatistics?: {
    sharesOutstanding?: unknown;
    trailingEps?: unknown;
    bookValue?: unknown;
  };
  summaryDetail?: {
    dividendRate?: unknown;
    currency?: unknown;
  };
};

export type YahooFinanceClient = {
  historical(
    symbol: string,
    options: { period1: Date; interval: "1d" },
  ): Promise<YahooHistoricalRow[]>;
  quote(symbol: string): Promise<YahooQuote>;
  quoteSummary(
    symbol: string,
    options: {
      modules: [
        "incomeStatementHistory",
        "balanceSheetHistory",
        "defaultKeyStatistics",
        "summaryDetail",
      ];
    },
  ): Promise<YahooQuoteSummary>;
};

type YahooFinanceProviderDeps = {
  yahoo?: YahooFinanceClient;
  now?: () => Date;
};

const quoteSummaryModules = [
  "incomeStatementHistory",
  "balanceSheetHistory",
  "defaultKeyStatistics",
  "summaryDetail",
] as const;

function finiteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function dateValue(value: unknown): Date | null {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) return null;
  return value;
}

function oneYearBefore(date: Date): Date {
  const period1 = new Date(date);
  period1.setUTCFullYear(period1.getUTCFullYear() - 1);
  return period1;
}

function mapDailyPrice(row: YahooHistoricalRow): ProviderDailyPrice | null {
  const date = dateValue(row.date);
  const open = finiteNumber(row.open);
  const high = finiteNumber(row.high);
  const low = finiteNumber(row.low);
  const close = finiteNumber(row.close);

  if (!date || open === null || high === null || low === null || close === null) {
    return null;
  }

  return {
    date,
    open,
    high,
    low,
    close,
    adjustedClose: finiteNumber(row.adjClose),
    volume: finiteNumber(row.volume),
  };
}

function fiscalYearFrom(statement?: { endDate?: unknown }): number | null {
  const endDate = dateValue(statement?.endDate);
  return endDate ? endDate.getUTCFullYear() : null;
}

function latestByFiscalYear<T extends { endDate?: unknown }>(
  statements: T[] | undefined,
): T | undefined {
  return statements
    ?.filter((statement) => fiscalYearFrom(statement) !== null)
    .sort((left, right) => {
      return (fiscalYearFrom(right) ?? 0) - (fiscalYearFrom(left) ?? 0);
    })[0];
}

function mapAnnualFinancial(
  summary: YahooQuoteSummary,
): ProviderAnnualFinancial | null {
  const latestIncome = latestByFiscalYear(
    summary.incomeStatementHistory?.incomeStatementHistory,
  );
  const latestBalance = latestByFiscalYear(
    summary.balanceSheetHistory?.balanceSheetStatements,
  );
  const fiscalYear = fiscalYearFrom(latestIncome) ?? fiscalYearFrom(latestBalance);

  if (fiscalYear === null) return null;

  return {
    fiscalYear,
    revenue: finiteNumber(latestIncome?.totalRevenue),
    profitBeforeTax: finiteNumber(latestIncome?.incomeBeforeTax),
    profitAfterTax: finiteNumber(latestIncome?.netIncome),
    ebita: finiteNumber(latestIncome?.ebit),
    totalDebt: finiteNumber(latestBalance?.totalDebt),
    totalEquity:
      finiteNumber(latestBalance?.totalStockholderEquity) ??
      finiteNumber(latestBalance?.stockholdersEquity) ??
      finiteNumber(latestBalance?.totalEquityGrossMinorityInterest),
    sharesOutstanding: finiteNumber(
      summary.defaultKeyStatistics?.sharesOutstanding,
    ),
    earningsPerShare: finiteNumber(summary.defaultKeyStatistics?.trailingEps),
    bookValuePerShare: finiteNumber(summary.defaultKeyStatistics?.bookValue),
  };
}

function mapMarketCap(quote: YahooQuote, now: Date, fallbackCurrency: string) {
  const marketCap = finiteNumber(quote.marketCap);
  if (marketCap === null) return [];

  return [
    {
      date: now,
      marketCap,
      currency: typeof quote.currency === "string" ? quote.currency : fallbackCurrency,
      calculationMethod: "reported",
    } satisfies ProviderMarketCap,
  ];
}

export function createYahooFinanceProvider(
  deps: YahooFinanceProviderDeps = {},
): MarketDataProvider {
  const yahoo = deps.yahoo ?? yahooFinance;
  const getNow = deps.now ?? (() => new Date());

  return {
    source: "yahoo_finance",
    async fetchStock(row) {
      const now = getNow();
      const [historicalRows, quote, quoteSummary] = await Promise.all([
        yahoo.historical(row.providerSymbol, {
          period1: oneYearBefore(now),
          interval: "1d",
        }),
        yahoo.quote(row.providerSymbol),
        yahoo.quoteSummary(row.providerSymbol, { modules: quoteSummaryModules }),
      ]);

      const dailyPrices = historicalRows
        .map((historicalRow) => mapDailyPrice(historicalRow))
        .filter((dailyPrice): dailyPrice is ProviderDailyPrice => dailyPrice !== null);
      const annualFinancial = mapAnnualFinancial(quoteSummary);
      const annualFinancials = annualFinancial ? [annualFinancial] : [];
      const dividendRate = finiteNumber(quoteSummary.summaryDetail?.dividendRate);
      const warnings: string[] = [];

      if (dailyPrices.length === 0) warnings.push("no_daily_prices");
      if (annualFinancials.length === 0) warnings.push("no_annual_financials");

      return {
        row,
        dailyPrices,
        annualFinancials,
        annualDividends:
          dividendRate === null
            ? []
            : [
                {
                  fiscalYear: now.getUTCFullYear(),
                  dividendPerShare: dividendRate,
                  currency:
                    typeof quoteSummary.summaryDetail?.currency === "string"
                      ? quoteSummary.summaryDetail.currency
                      : row.currency,
                },
              ],
        marketCaps: mapMarketCap(quote, now, row.currency),
        warnings,
      };
    },
  };
}
