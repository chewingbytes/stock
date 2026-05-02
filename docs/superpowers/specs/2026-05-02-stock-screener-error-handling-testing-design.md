# Stock Screener Error Handling And Testing Design

Date: 2026-05-02

## Status

This document records the approved V1 error handling and testing direction for
the stock screener application. It is a design artifact, not an implementation
plan.

Related documents:

- `docs/superpowers/specs/2026-05-02-stock-screener-product-scope-design.md`
- `docs/superpowers/specs/2026-05-02-stock-screener-architecture-design.md`
- `docs/superpowers/specs/2026-05-02-stock-screener-data-model-formulas-design.md`
- `docs/superpowers/specs/2026-05-02-stock-screener-data-flow-design.md`

## Error Handling Goals

V1 should fail visibly, locally, and recoverably.

The app should avoid three failure modes:

- Silent wrong results.
- Full-screen failure because one provider or stock failed.
- Confusing financial output with no data freshness or missing-data explanation.

## Error Categories

### Provider Errors

Examples:

- API key missing.
- API rate limit exceeded.
- Provider downtime.
- Provider response shape changed.
- Provider does not cover a requested SGX field.

Expected behavior:

- Record the failed provider, endpoint or import type, timestamp, and message.
- Keep the latest successful cached data available.
- Show stale data indicators where relevant.
- Do not block screening if cached data exists.

### CSV Import Errors

Examples:

- Missing required columns.
- Invalid date format.
- Non-numeric value in a numeric field.
- Unknown stock code.
- Duplicate rows for the same stock/date or stock/fiscal year.

Expected behavior:

- Reject invalid rows with row-level errors.
- Import valid rows when safe.
- Produce a clear import summary: imported, skipped, failed.
- Avoid overwriting good data with invalid CSV values.

### Formula Errors

Examples:

- Missing denominator.
- Zero or negative denominator.
- Missing prior-year value.
- Inconsistent currency.
- Missing latest close price.

Expected behavior:

- Mark the metric unavailable.
- Store a data quality reason.
- Continue calculating unrelated metrics.
- Never return `Infinity`, `NaN`, or misleading zero values.

### Screener Errors

Examples:

- Invalid filter range.
- Unsupported metric key.
- Cross-currency comparison without conversion.
- Query timeout.

Expected behavior:

- Validate filters before querying.
- Return field-level errors for invalid filters.
- Prevent misleading cross-currency filters unless a future conversion feature
  exists.
- Keep the user's selected filters visible so they can correct inputs.

### Export Errors

Examples:

- Result set too large.
- CSV serialization error.
- File generation failure.

Expected behavior:

- Keep the current results visible.
- Show a retryable export error.
- Log the failed export reason.

## User-Facing Data Quality States

The UI should display concise data quality states instead of raw technical
errors.

Recommended states:

- `Fresh`: latest expected data is available.
- `Stale`: cached data exists but the latest update failed or is old.
- `Missing`: required source data is absent.
- `Unavailable`: formula cannot be calculated safely.
- `CSV`: value came from CSV import.

Detailed provider errors should be available in logs or admin/debug views, not
shown as noisy table text.

## Testing Strategy

Testing should focus on formula correctness, data quality behavior, and
screening reliability.

### Unit Tests

Formula tests should cover:

- Normal calculations for every required metric.
- Missing inputs.
- Zero denominators.
- Negative denominators.
- Negative earnings for P/E.
- Missing dividends versus confirmed zero dividends.
- Native-currency preservation.

Adapter tests should cover:

- Provider response mapping.
- CSV row parsing.
- Required column validation.
- Numeric and date parsing.
- Duplicate handling.

### Integration Tests

Integration tests should cover:

- Import stock universe.
- Import prices.
- Import fundamentals.
- Import dividends.
- Calculate derived metrics.
- Run a screen over the imported data.
- Export the screen result.

Use a small deterministic fixture dataset with US and SGX examples so tests do
not depend on live provider APIs.

### API Tests

Screener API tests should cover:

- Market selection.
- Multiple filters.
- Min-only and max-only ranges.
- Sorting.
- Pagination.
- Missing metric behavior.
- Invalid filter validation.
- CSV export response.

### Frontend Tests

Frontend tests should cover:

- Market selection.
- Adding and removing filters.
- Range input validation.
- Results table rendering.
- Missing-data indicators.
- Export action.

The frontend should not need live market data for tests.

### Manual Acceptance Checks

Before declaring V1 complete, the team should manually verify:

- A US-only screen returns sensible rows.
- An SGX-only screen returns sensible rows.
- A combined US + SGX screen labels currencies clearly.
- Missing SGX fundamentals are visible and understandable.
- Exported CSV includes criteria and result values.
- The app does not present results as financial advice.

## Test Data Requirement

The project should include a small sample dataset for repeatable development and
testing.

The sample should include:

- At least three US stocks.
- At least three SGX stocks.
- At least two years of annual financials for growth calculations.
- At least two years of dividends for dividend growth calculations.
- Recent daily OHLC rows.
- One stock with missing fundamentals.
- One stock with confirmed zero dividend.
- One stock with negative earnings.

This dataset allows the team to test normal and edge-case behavior without
calling live APIs.
