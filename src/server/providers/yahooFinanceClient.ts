import YahooFinance from "yahoo-finance2";
import type {
  MarketDataProvider,
  ProviderAnnualDividend,
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

// Annual rows returned by the fundamentals-timeseries endpoint. Keys mirror the
// reported financial-statement line items (type prefix already stripped by the
// library, e.g. `annualTotalRevenue` -> `totalRevenue`). Only the fields we map
// are typed here; the endpoint returns many more.
type YahooFundamentalsRow = {
  date?: unknown;
  totalRevenue?: unknown;
  pretaxIncome?: unknown;
  netIncome?: unknown;
  EBITDA?: unknown;
  EBIT?: unknown;
  totalDebt?: unknown;
  stockholdersEquity?: unknown;
  commonStockEquity?: unknown;
  totalEquityGrossMinorityInterest?: unknown;
  ordinarySharesNumber?: unknown;
  shareIssued?: unknown;
  basicAverageShares?: unknown;
  basicEPS?: unknown;
  dilutedEPS?: unknown;
};

type YahooDividendEvent = {
  date?: unknown;
  amount?: unknown;
};

type YahooChartResult = {
  events?: {
    dividends?: YahooDividendEvent[];
  };
};

export type YahooFinanceClient = {
  historical(
    symbol: string,
    options: { period1: Date; period2: Date; interval: "1d" },
  ): Promise<YahooHistoricalRow[]>;
  quote(symbol: string): Promise<YahooQuote>;
  fundamentalsTimeSeries(
    symbol: string,
    options: {
      period1: Date;
      period2: Date;
      type: "annual";
      module: "all";
    },
  ): Promise<YahooFundamentalsRow[]>;
  chart(
    symbol: string,
    options: {
      period1: Date;
      period2: Date;
      interval: "1d";
      events: "dividends";
    },
  ): Promise<YahooChartResult>;
};

type YahooFinanceProviderDeps = {
  yahoo?: YahooFinanceClient;
  createYahoo?: () => YahooFinanceClient;
  now?: () => Date;
};

// How far back to request annual fundamentals and dividends. Growth metrics
// need at least two fiscal years; five gives headroom for reporting gaps.
const fundamentalsLookbackYears = 5;

function createDefaultYahooClient(): YahooFinanceClient {
  const client = new YahooFinance({
    suppressNotices: ["ripHistorical", "yahooSurvey"],
  });

  return {
    historical: async (symbol, options) =>
      (await client.historical(symbol, options)) as YahooHistoricalRow[],
    quote: async (symbol) => (await client.quote(symbol)) as YahooQuote,
    fundamentalsTimeSeries: async (symbol, options) =>
      (await client.fundamentalsTimeSeries(
        symbol,
        options,
      )) as YahooFundamentalsRow[],
    chart: async (symbol, options) =>
      (await client.chart(symbol, options)) as YahooChartResult,
  };
}

function finiteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function dateValue(value: unknown): Date | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  // The fundamentals endpoint can return a unix timestamp (seconds).
  if (typeof value === "number" && Number.isFinite(value)) {
    return new Date(value * 1000);
  }
  return null;
}

function yearOf(value: unknown): number | null {
  const date = dateValue(value);
  return date ? date.getUTCFullYear() : null;
}

function subtractYears(date: Date, years: number): Date {
  const result = new Date(date);
  result.setUTCFullYear(result.getUTCFullYear() - years);
  return result;
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

function mapAnnualFinancial(
  row: YahooFundamentalsRow,
): ProviderAnnualFinancial | null {
  const fiscalYear = yearOf(row.date);
  if (fiscalYear === null) return null;

  const revenue = finiteNumber(row.totalRevenue);
  const profitAfterTax = finiteNumber(row.netIncome);
  const totalEquity =
    finiteNumber(row.stockholdersEquity) ??
    finiteNumber(row.commonStockEquity) ??
    finiteNumber(row.totalEquityGrossMinorityInterest);
  const sharesOutstanding =
    finiteNumber(row.ordinarySharesNumber) ??
    finiteNumber(row.shareIssued) ??
    finiteNumber(row.basicAverageShares);

  // Fundamentals pad the series with empty boundary periods; skip rows that
  // carry no usable statement data.
  if (revenue === null && profitAfterTax === null && totalEquity === null) {
    return null;
  }

  const earningsPerShare =
    finiteNumber(row.basicEPS) ??
    finiteNumber(row.dilutedEPS) ??
    (profitAfterTax !== null && sharesOutstanding !== null && sharesOutstanding > 0
      ? profitAfterTax / sharesOutstanding
      : null);
  const bookValuePerShare =
    totalEquity !== null && sharesOutstanding !== null && sharesOutstanding > 0
      ? totalEquity / sharesOutstanding
      : null;

  return {
    fiscalYear,
    revenue,
    profitBeforeTax: finiteNumber(row.pretaxIncome),
    profitAfterTax,
    ebita: finiteNumber(row.EBITDA) ?? finiteNumber(row.EBIT),
    totalDebt: finiteNumber(row.totalDebt),
    totalEquity,
    sharesOutstanding,
    earningsPerShare,
    bookValuePerShare,
  };
}

// Sum individual dividend payments into a per-fiscal-year total so the screener
// can compute a year-over-year dividend growth rate.
function mapAnnualDividends(
  events: YahooDividendEvent[],
  currency: string,
): ProviderAnnualDividend[] {
  const totalsByYear = new Map<number, number>();

  for (const event of events) {
    const fiscalYear = yearOf(event.date);
    const amount = finiteNumber(event.amount);
    if (fiscalYear === null || amount === null) continue;
    totalsByYear.set(fiscalYear, (totalsByYear.get(fiscalYear) ?? 0) + amount);
  }

  return [...totalsByYear.entries()]
    .sort(([left], [right]) => left - right)
    .map(([fiscalYear, dividendPerShare]) => ({
      fiscalYear,
      dividendPerShare,
      currency,
    }));
}

function mapMarketCap(quote: YahooQuote, now: Date, fallbackCurrency: string) {
  const marketCap = finiteNumber(quote.marketCap);
  if (marketCap === null) return [];

  return [
    {
      date: now,
      marketCap,
      currency:
        typeof quote.currency === "string" ? quote.currency : fallbackCurrency,
      calculationMethod: "reported",
    } satisfies ProviderMarketCap,
  ];
}

function annualFinancialIsIncomplete(financial: ProviderAnnualFinancial): boolean {
  return [
    financial.revenue,
    financial.profitAfterTax,
    financial.totalDebt,
    financial.totalEquity,
    financial.sharesOutstanding,
    financial.earningsPerShare,
    financial.bookValuePerShare,
  ].some((value) => value === null);
}

export function createYahooFinanceProvider(
  deps: YahooFinanceProviderDeps = {},
): MarketDataProvider {
  const yahoo: YahooFinanceClient =
    deps.yahoo ?? deps.createYahoo?.() ?? createDefaultYahooClient();
  const getNow = deps.now ?? (() => new Date());

  return {
    source: "yahoo_finance",
    async fetchStock(row) {
      const now = getNow();
      const priceStart = subtractYears(now, 1);
      const fundamentalsStart = subtractYears(now, fundamentalsLookbackYears);
      const warnings: string[] = [];

      const [historicalRows, quote] = await Promise.all([
        yahoo.historical(row.providerSymbol, {
          period1: priceStart,
          period2: now,
          interval: "1d",
        }),
        yahoo.quote(row.providerSymbol),
      ]);

      let fundamentalsRows: YahooFundamentalsRow[] = [];
      try {
        fundamentalsRows = await yahoo.fundamentalsTimeSeries(
          row.providerSymbol,
          {
            period1: fundamentalsStart,
            period2: now,
            type: "annual",
            module: "all",
          },
        );
      } catch {
        warnings.push("fundamentals_failed");
      }

      let dividendEvents: YahooDividendEvent[] = [];
      try {
        const chart = await yahoo.chart(row.providerSymbol, {
          period1: fundamentalsStart,
          period2: now,
          interval: "1d",
          events: "dividends",
        });
        dividendEvents = chart.events?.dividends ?? [];
      } catch {
        warnings.push("dividends_failed");
      }

      const dailyPrices = historicalRows
        .map((historicalRow) => mapDailyPrice(historicalRow))
        .filter((dailyPrice): dailyPrice is ProviderDailyPrice => dailyPrice !== null);
      const annualFinancials = fundamentalsRows
        .map((fundamentalsRow) => mapAnnualFinancial(fundamentalsRow))
        .filter(
          (financial): financial is ProviderAnnualFinancial => financial !== null,
        )
        .sort((left, right) => left.fiscalYear - right.fiscalYear);
      const annualDividends = mapAnnualDividends(dividendEvents, row.currency);

      if (dailyPrices.length === 0) warnings.push("no_daily_prices");
      if (annualFinancials.length === 0) warnings.push("no_annual_financials");
      if (annualFinancials.length === 1) warnings.push("insufficient_financial_history");
      if (annualFinancials.some(annualFinancialIsIncomplete)) {
        warnings.push("annual_financials_incomplete");
      }
      if (annualDividends.length === 0) warnings.push("no_dividends");

      return {
        row,
        dailyPrices,
        annualFinancials,
        annualDividends,
        marketCaps: mapMarketCap(quote, now, row.currency),
        warnings,
      };
    },
  };
}
