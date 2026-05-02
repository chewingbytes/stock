# Stock Screener Architecture Design

Date: 2026-05-02

## Status

This document records the approved V1 architecture for the stock screener
application. It is a design artifact, not an implementation plan.

Related document:

- `docs/superpowers/specs/2026-05-02-stock-screener-product-scope-design.md`

The architecture assumes the approved scope: US and Singapore stocks first,
end-of-day data, free or low-cost data sources, CSV fallback, and AI review
deferred to V2.

## Recommended Architecture

Use a local data hub architecture.

The application should not call third-party market data APIs directly from the
screening UI. Instead, ingestion jobs should pull and normalize data into a
local database. The screener should query that local database.

This approach fits the agreed constraints because it:

- Reduces repeated API calls and helps stay within free or low-cost rate limits.
- Allows data to be cached and refreshed after market close.
- Makes provider outages less visible to users.
- Allows missing data to be tracked explicitly.
- Lets students inspect and debug the stored data.
- Keeps the app replaceable if the first data provider is not good enough.

## Architecture Components

### Data Provider Adapters

Each market data source should be isolated behind a provider adapter. Candidate
providers include EODHD, Marketstack, Twelve Data, Financial Modeling Prep, and
CSV import.

The rest of the app should depend on internal normalized data shapes, not on
provider-specific response formats.

The adapter pattern should support:

- Fetching stock listings by exchange or market.
- Fetching daily OHLC prices.
- Fetching market cap where available.
- Fetching annual financials where available.
- Fetching annual dividends where available.
- Recording provider name, fetch timestamp, and raw data availability.

CSV import should be treated as a first-class adapter, not a temporary hack.
This gives the team a fallback for SGX or any provider gaps.

### Local Database

The local database should store imported and derived data. The initial logical
tables are:

- `markets`: supported markets such as US and SGX.
- `stocks`: exchange, stock code, stock name, currency, market, and provider
  identifiers.
- `daily_prices`: date, stock, open, high, low, close, adjusted close if
  available, and volume if available.
- `annual_financials`: fiscal year, stock, revenue, profit before tax, profit
  after tax, EBITA or EBITDA if available, debt, equity, shares outstanding, EPS,
  and book value per share when available.
- `annual_dividends`: fiscal year, stock, dividend per share.
- `market_caps`: date, stock, market cap, source, and currency.
- `derived_metrics`: stock, date or fiscal year, calculated metric name, value,
  formula version, and source freshness.
- `screen_runs`: selected markets, filter criteria, timestamp, and result count.

The exact physical schema can be adjusted during implementation, but the key
boundary is clear: imported raw facts and derived metrics should be separable.

### Ingestion Jobs

Ingestion should run separately from user screening.

Recommended refresh cadence:

- Daily prices: after each market closes.
- Market cap: daily when available, otherwise calculated from latest price and
  shares outstanding.
- Fundamentals: weekly, monthly, or manually triggered for V1.
- Dividends: weekly, monthly, or manually triggered for V1.
- CSV imports: manually triggered by users or developers.

Each ingestion run should record whether it completed, failed, or produced
partial data.

### Metric Calculation Layer

All screening formulas should live in one backend metric layer. The UI should
not calculate financial ratios.

This layer should calculate the required metrics from normalized database data:

- Market cap.
- Revenue growth rate.
- Profit growth rate.
- Dividend yield.
- Dividend growth rate.
- P/E ratio.
- P/B ratio.
- Debt to equity ratio.
- OHLC price values.

Formula results should include enough metadata to explain data quality:

- Input fiscal year or date.
- Source fields used.
- Whether the result is unavailable because data is missing.
- Formula version.

### Screener API

The frontend sends selected markets and filter ranges to the backend. The
backend validates the filters, queries the local database, and returns matching
stocks with the selected metric values.

The screener API should support:

- Multiple selected markets.
- Multiple active filters.
- Minimum and maximum range filters.
- Sorting by any returned metric.
- Pagination for large result sets.
- CSV export of the current result set.

### Frontend

The frontend should be a practical screening workspace, not a marketing page.

The main screen should include:

- Market selector.
- Filter builder with range inputs.
- Selected criteria summary.
- Results table.
- Data freshness and missing-data indicators.
- CSV export action.

The results table should prioritize scanability. It should show exchange, stock
code, stock name, and only the metrics relevant to the active screen by default.

## Data Provider Direction

Because V1 assumes free or low-cost data, provider selection should remain
replaceable.

Current research indicates:

- EODHD advertises global end-of-day data, fundamentals, dividends, and 60+
  exchanges. Source: https://eodhd.com/
- Marketstack provides end-of-day and historical price endpoints. Source:
  https://marketstack.com/documentation
- Twelve Data advertises global fundamentals including statements, dividends,
  splits, and analytics. Source: https://twelvedata.com/fundamentals
- Polygon is strong for US equities but is not the right single-provider choice
  for US plus SGX. Source: https://polygon.io/stocks

The first implementation plan should compare these providers against the exact
fields required for US and SGX before committing to one primary source.

## Non-Advice Requirement

The architecture should support the product's non-advice requirement. Screening
results should include data freshness and missing-data signals so the UI can
make clear that results are research candidates, not financial advice.
