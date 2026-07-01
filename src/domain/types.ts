export type DataQualityStatus =
  | "complete"
  | "fresh"
  | "stale"
  | "missing"
  | "unavailable"
  | "csv";

export type MetricSuccess = {
  status: "complete";
  value: number;
};

export type MetricFailure = {
  status: "missing" | "unavailable";
  reason: string;
};

export type MetricResult = MetricSuccess | MetricFailure;

export type MetricKey =
  | "market_cap"
  | "revenue_growth_rate"
  | "profit_growth_rate"
  | "dividend_yield"
  | "dividend_growth_rate"
  | "pe_ratio"
  | "pb_ratio"
  | "debt_to_equity_ratio"
  | "open"
  | "high"
  | "low"
  | "close";

export type RangeFilter = {
  metricKey: MetricKey;
  min: number | null;
  max: number | null;
};
