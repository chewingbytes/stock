import { beginnerMetricDefinitions } from "./metricDefinitions";

export type GlossaryTerm = {
  term: string;
  category: "Metric" | "Price Data" | "Company Data";
  definition: string;
  example?: string;
  caution?: string;
};

const metricTerms: GlossaryTerm[] = Object.values(beginnerMetricDefinitions).map(
  (definition) => ({
    term: definition.label,
    category: "Metric",
    definition: definition.explanation,
    example: definition.example,
    caution: definition.caution,
  }),
);

const companyDataTerms: GlossaryTerm[] = [
  {
    term: "Exchange",
    category: "Company Data",
    definition: "The market where a stock is listed and traded.",
    example: "NASDAQ, NYSE, and SGX are exchanges.",
  },
  {
    term: "Stock Code",
    category: "Company Data",
    definition: "The ticker or symbol used to identify a listed stock.",
    example: "AAPL is Apple Inc.'s stock code on NASDAQ.",
  },
  {
    term: "Yearly Dividend",
    category: "Company Data",
    definition: "The total dividend paid per share over a year.",
    caution: "Dividends can be changed, paused, or cancelled.",
  },
  {
    term: "Yearly Revenue",
    category: "Company Data",
    definition: "The total sales a company reported over a financial year.",
  },
  {
    term: "Profit Before Tax",
    category: "Company Data",
    definition: "Profit after operating and financing costs, before tax expense.",
  },
  {
    term: "Profit After Tax",
    category: "Company Data",
    definition: "Profit remaining after tax expense.",
  },
  {
    term: "EBITA",
    category: "Company Data",
    definition:
      "Earnings before interest, tax, and amortization; a measure of operating profit before some financing, tax, and accounting effects.",
    caution: "EBITA is not the same as cash flow.",
  },
  {
    term: "Equity",
    category: "Company Data",
    definition: "The accounting value left for shareholders after liabilities.",
  },
  {
    term: "Debt",
    category: "Company Data",
    definition: "Money the company owes to lenders or bondholders.",
  },
];

const priceDataTerms: GlossaryTerm[] = [
  {
    term: "OHLC",
    category: "Price Data",
    definition:
      "Open, high, low, and close prices for a trading day or another time period.",
    example: "Daily OHLC shows where the stock started, peaked, bottomed, and ended.",
  },
  {
    term: "Open",
    category: "Price Data",
    definition: "The first traded price in a trading session.",
  },
  {
    term: "High",
    category: "Price Data",
    definition: "The highest traded price in a trading session.",
  },
  {
    term: "Low",
    category: "Price Data",
    definition: "The lowest traded price in a trading session.",
  },
  {
    term: "Close",
    category: "Price Data",
    definition: "The final traded price in a trading session.",
  },
];

export const glossaryTerms = [
  ...metricTerms,
  ...priceDataTerms,
  ...companyDataTerms,
].sort((left, right) => left.term.localeCompare(right.term));
