# Stock Screener Product Scope Design

Date: 2026-05-02

## Status

This document records the approved V1 product scope for the stock screener
application. It is a design artifact, not an implementation plan.

Related document:

- `docs/superpowers/specs/2026-05-02-stock-screener-architecture-design.md`

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
stock names. The output should show the selected criteria plus a results table
containing exchange, stock code, stock name, and matched metric values.

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

## Non-Advice Requirement

The application is a research and filtering tool. It should not present screened
results as investment advice. User-facing copy should make clear that the
screener creates candidates for further research and that missing or delayed
data can affect results.
