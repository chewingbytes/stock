import type { MetricKey, RangeFilter } from "./types";

export type BeginnerMetricDefinition = {
  metricKey: MetricKey;
  label: string;
  shortLabel: string;
  explanation: string;
  example: string;
  caution: string;
  defaultRange: Pick<RangeFilter, "min" | "max">;
};

export const beginnerMetricDefinitions: Record<
  MetricKey,
  BeginnerMetricDefinition
> = {
  market_cap: {
    metricKey: "market_cap",
    label: "Market Cap",
    shortLabel: "Market Cap",
    explanation: "The total market value of a company's shares.",
    example: "A larger market cap usually means a larger, more established company.",
    caution: "Size does not guarantee quality or future returns.",
    defaultRange: { min: null, max: null },
  },
  revenue_growth_rate: {
    metricKey: "revenue_growth_rate",
    label: "Revenue Growth",
    shortLabel: "Revenue Growth",
    explanation: "How quickly company sales are growing.",
    example: "A value of 10 means revenue grew by about 10%.",
    caution: "Fast growth can slow down and may come with higher risk.",
    defaultRange: { min: 0, max: null },
  },
  profit_growth_rate: {
    metricKey: "profit_growth_rate",
    label: "Profit Growth",
    shortLabel: "Profit Growth",
    explanation: "How quickly company profit is growing.",
    example: "A positive value means profit increased compared with the prior period.",
    caution: "One-off gains can make profit growth look better than usual.",
    defaultRange: { min: 0, max: null },
  },
  dividend_yield: {
    metricKey: "dividend_yield",
    label: "Dividend Yield",
    shortLabel: "Yield",
    explanation: "Dividend income compared with the stock price.",
    example: "A 4% yield means annual dividends are about 4% of the share price.",
    caution: "A very high yield can signal that investors expect trouble.",
    defaultRange: { min: 0, max: 8 },
  },
  dividend_growth_rate: {
    metricKey: "dividend_growth_rate",
    label: "Dividend Growth",
    shortLabel: "Dividend Growth",
    explanation: "How quickly dividends have grown.",
    example: "A positive value means dividends increased compared with the prior period.",
    caution: "Past dividend growth does not guarantee future dividends.",
    defaultRange: { min: 0, max: null },
  },
  pe_ratio: {
    metricKey: "pe_ratio",
    label: "P/E Ratio",
    shortLabel: "P/E",
    explanation: "How much investors pay for each dollar of company earnings.",
    example: "A P/E of 20 means investors pay about $20 for $1 of earnings.",
    caution: "Lower is not always better; compare similar companies.",
    defaultRange: { min: 1, max: 40 },
  },
  pb_ratio: {
    metricKey: "pb_ratio",
    label: "P/B Ratio",
    shortLabel: "P/B",
    explanation: "Share price compared with book value per share.",
    example: "A P/B of 1 means price is close to accounting book value.",
    caution: "Book value matters more for some industries than others.",
    defaultRange: { min: 0, max: 5 },
  },
  debt_to_equity_ratio: {
    metricKey: "debt_to_equity_ratio",
    label: "Debt To Equity",
    shortLabel: "D/E",
    explanation: "Company debt compared with shareholder equity.",
    example: "A D/E of 1 means debt is roughly equal to equity.",
    caution: "Debt can increase risk, but some industries normally use more Debt.",
    defaultRange: { min: 0, max: 2 },
  },
  open: {
    metricKey: "open",
    label: "Open Price",
    shortLabel: "Open",
    explanation: "The first traded price for the day.",
    example: "Use this with high, low, and close to understand daily movement.",
    caution: "One daily price does not explain business quality.",
    defaultRange: { min: null, max: null },
  },
  high: {
    metricKey: "high",
    label: "High Price",
    shortLabel: "High",
    explanation: "The highest traded price for the day.",
    example: "This shows the top of the daily trading range.",
    caution: "Daily highs can be short-lived.",
    defaultRange: { min: null, max: null },
  },
  low: {
    metricKey: "low",
    label: "Low Price",
    shortLabel: "Low",
    explanation: "The lowest traded price for the day.",
    example: "This shows the bottom of the daily trading range.",
    caution: "Daily lows can reflect short-term trading noise.",
    defaultRange: { min: null, max: null },
  },
  close: {
    metricKey: "close",
    label: "Close Price",
    shortLabel: "Close",
    explanation: "The final traded price for the day.",
    example: "End-of-day screeners usually use the latest close price.",
    caution: "Price alone does not show whether a stock is cheap or expensive.",
    defaultRange: { min: null, max: null },
  },
};

export function getMetricDefinition(metricKey: MetricKey) {
  return beginnerMetricDefinitions[metricKey];
}

export function formatMetricLabel(metricKey: MetricKey) {
  return getMetricDefinition(metricKey).label;
}
