# Stock Screener Product Scope And Architecture Design

Date: 2026-05-02

## Status

This document records the approved V1 product scope and architecture for the
stock screener application. It is a design artifact, not an implementation plan.

Approved sections:

- Product scope.
- Architecture.

Future design sections should cover the detailed data model, exact formula
definitions, error handling, testing, and implementation plan.

## Source Requirements

The source brief is `Stock Screener Application.pdf`.

The requested application should let users enter predetermined selection
criteria, scan a stock database, and return stocks that match the selected
ranges. The brief lists these screening criteria:

- Market capital size.
- Revenue growth rate.
- Profit growth rate.
- Dividend yield.
- Dividend growth rate.
- Price earnings ratio, or P/E.
- Price to book ratio, or P/B.
- Debt to equity ratio.
- Daily OHLC price values: open, high, low, close.

The brief also requires stock reference data so users can map stock codes to
stock names, and it asks for output that shows the selected criteria plus a
results table containing exchange, stock code, stock name, and matched metric
values.

The brief mentions an optional AI recommendation step after shortlisting. That
step is deferred to V2.

## Competitor Inputs

Competitor research suggests that leading screeners share a few common patterns:

- TradingView combines saved screens, many filter categories, table/chart views,
  technicals, fundamentals, dividends, valuation, growth, and CSV export.
  Source: https://www.tradingview.com/support/solutions/43000718866-tradingview-stock-screener-trade-smarter-not-harder/
- Finviz emphasizes fast filtering, fundamental and technical analysis, multiple
  result views, and presets.
  Source: https://finviz.com/help/screener
- Stock Rover emphasizes investor-oriented screening, prebuilt screens, 500+
  metrics, weighted ranking, historical comparison, and equations.
  Source: https://www.stockrover.com/stock-screening/
- Koyfin emphasizes global coverage, thousands of filter criteria, templates,
  watchlists, and CSV download.
  Source: https://www.koyfin.com/features/stock-screener/
- Simply Wall St emphasizes beginner-friendly visual analysis, curated ideas,
  alerts, and advanced filters.
  Source: https://simplywall.st/features/stock-screener
- Yahoo Finance offers accessible premade and custom screeners across stocks,
  mutual funds, and ETFs.
  Source: https://help.yahoo.com/kb/create-premade-yahoo-finance-screeners-sln28083.html

The V1 design should not try to match the breadth of these products. It should
focus on a clear educational workflow: choose markets, set metric ranges, run
the screen, inspect results, and export the shortlist.

## Product Scope

V1 is a multi-market end-of-day stock screener.

Users can select one or more markets before running a screen. The first fully
supported markets are:

- United States stocks.
- Singapore stocks listed on SGX.

Other markets may appear later through the same market/provider architecture,
but they are outside the first build unless data coverage is confirmed.

V1 supports end-of-day data. Prices do not need to update during trading hours.
Daily OHLC data can refresh after market close. Company fundamentals, dividends,
market cap, and derived ratios can refresh on a slower cadence because they are
normally updated quarterly, yearly, or when company events are reported.

V1 assumes free or low-cost data first. This means the product must tolerate:

- API rate limits.
- Missing fields.
- Delayed updates.
- Inconsistent ticker formats across providers.
- Partial SGX coverage, especially for fundamentals.
- CSV import as a fallback when API data is unavailable.

V1 must include these user-facing capabilities:

- Select markets, with US and Singapore as the first targets.
- Select screening filters from the predetermined requirement list.
- Enter minimum and maximum values for each selected filter.
- Run a screen against locally stored end-of-day and fundamental data.
- Show a summary of the selected criteria and value ranges.
- Show a results table with exchange, stock code, stock name, and matched metric
  values.
- Indicate data freshness and missing values so users understand result quality.
- Export the shortlist as CSV.

V1 explicitly excludes:

- AI-generated stock recommendations.
- Buy, sell, or hold advice.
- Real-time or intraday market data.
- Broker integrations or trade execution.
- Portfolio tracking.
- Alerts and scheduled notifications.
- Advanced technical indicators beyond the required OHLC price fields.

V2 may add an AI review workflow after users create a shortlist. That workflow
must cite sources, explain uncertainty, and avoid presenting the output as
financial advice.

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

The application is a research and filtering tool. It should not present screened
results as investment advice. User-facing copy should make clear that the
screener creates candidates for further research and that missing or delayed
data can affect results.
