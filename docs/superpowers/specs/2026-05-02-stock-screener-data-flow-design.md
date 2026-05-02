# Stock Screener Data Flow Design

Date: 2026-05-02

## Status

This document records the approved V1 data flow for the stock screener
application. It is a design artifact, not an implementation plan.

Related documents:

- `docs/superpowers/specs/2026-05-02-stock-screener-product-scope-design.md`
- `docs/superpowers/specs/2026-05-02-stock-screener-architecture-design.md`
- `docs/superpowers/specs/2026-05-02-stock-screener-data-model-formulas-design.md`

The design assumes the approved scope: US and Singapore stocks first,
end-of-day data, free or low-cost data sources, CSV fallback, and AI review
deferred to V2.

## Data Flow Principle

V1 should use a batch-oriented data flow. The screener should not call market
data providers live when users run filters.

Instead, provider and CSV data should be imported into the local database,
normalized, converted into derived metrics, and then queried by the screener.

## Flow 1: Market Setup

The app starts with configured markets:

- `US`
- `SGX`

Each market has metadata such as currency, timezone, and supported exchanges.
This lets the app know when end-of-day updates should run and how to label
results.

Flow:

`seed configuration -> markets table`

Expected output:

- Market code.
- Market name.
- Country.
- Native currency.
- Timezone.
- Active/inactive status.

## Flow 2: Stock Universe Import

The app imports the list of stocks for each market from a provider or CSV.

Flow:

`provider or CSV -> provider adapter -> normalized stocks table`

Expected output:

- Exchange.
- Stock code.
- Stock name.
- Currency.
- Sector, if available.
- Industry, if available.
- Provider symbol.
- Active/inactive status.

The import should upsert records. If a stock already exists, the import updates
known fields without creating duplicates.

## Flow 3: End-Of-Day Price Import

After market close, ingestion fetches daily OHLC prices.

Flow:

`provider or CSV -> provider adapter -> daily_prices table`

Expected output:

- Date.
- Open price.
- High price.
- Low price.
- Close price.
- Adjusted close, if available.
- Volume, if available.
- Source.
- Fetch timestamp.

The app stores source and `fetched_at` so users can see whether the data is
fresh.

## Flow 4: Fundamental And Dividend Import

Fundamentals and dividends update slower than prices.

Flow:

`provider or CSV -> provider adapter -> annual_financials and annual_dividends`

Recommended V1 cadence:

- Weekly, monthly, or manually triggered.
- Manual CSV fallback for missing SGX data.

SGX gaps should be expected and represented as missing data, not hidden. A
missing field should affect only the metrics that depend on it.

## Flow 5: Metric Calculation

After raw data is imported, the metric calculation layer computes derived
values.

Flow:

`raw tables -> formula layer -> derived_metrics table`

Expected output:

- Metric key.
- Metric value.
- Metric date or fiscal year.
- Formula version.
- Input snapshot.
- Data quality status.
- Currency where relevant.

Metrics should be recalculated after any import that changes source values used
by the formulas.

## Flow 6: User Screening

The user selects markets and filter ranges.

Flow:

`frontend filters -> screener API -> database query -> results table`

The API filters using `derived_metrics` and stock metadata. It returns:

- Exchange.
- Stock code.
- Stock name.
- Selected metric values.
- Native currency where relevant.
- Freshness metadata.
- Unavailable-field markers.

The API should not silently drop stocks because a metric is missing unless the
user's selected filter requires that metric.

## Flow 7: Export

The user can export the current result set.

Flow:

`current screen query -> CSV export`

The CSV should include:

- Generation timestamp.
- Selected markets.
- Selected criteria and ranges.
- Stock rows.
- Visible metric values.
- Data freshness where practical.
- Marker for unavailable metric values.

## Flow 8: Audit Trail

Each screen run can be stored for debugging.

Flow:

`screen request -> screen_runs table`

This helps explain:

- Which markets were selected.
- Which filters were used.
- When the screen was run.
- How many results were returned.

The audit trail is for troubleshooting and reproducibility. It is not a user
portfolio or recommendation history.

## Failure Behavior

If ingestion fails, existing cached data remains available. The UI should show
the latest successful data timestamp instead of blocking the screener.

If metric calculation fails for one stock, that stock's affected metrics should
be marked unavailable. One bad stock should not stop the full calculation batch.

If export fails, the screen result should remain visible and the user should see
a clear retryable error.
