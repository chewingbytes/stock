export type ProviderUniverseRow = {
  marketCode: string;
  exchange: string;
  stockCode: string;
  stockName: string;
  currency: string;
  providerSymbol: string;
};

export type ProviderDailyPrice = {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  adjustedClose: number | null;
  volume: number | null;
};

export type ProviderAnnualFinancial = {
  fiscalYear: number;
  revenue: number | null;
  profitBeforeTax: number | null;
  profitAfterTax: number | null;
  ebita: number | null;
  totalDebt: number | null;
  totalEquity: number | null;
  sharesOutstanding: number | null;
  earningsPerShare: number | null;
  bookValuePerShare: number | null;
};

export type ProviderAnnualDividend = {
  fiscalYear: number;
  dividendPerShare: number | null;
  currency: string;
};

export type ProviderMarketCap = {
  date: Date;
  marketCap: number;
  currency: string;
  calculationMethod: string;
};

export type ProviderStockData = {
  row: ProviderUniverseRow;
  dailyPrices: ProviderDailyPrice[];
  annualFinancials: ProviderAnnualFinancial[];
  annualDividends: ProviderAnnualDividend[];
  marketCaps: ProviderMarketCap[];
  warnings: string[];
};

export type MarketDataProvider = {
  source: string;
  fetchStock(row: ProviderUniverseRow): Promise<ProviderStockData>;
};
