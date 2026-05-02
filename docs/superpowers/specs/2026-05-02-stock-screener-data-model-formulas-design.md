# Stock Screener Data Model And Formula Definitions Design

Date: 2026-05-02

## Status

This document records the approved V1 data model and formula definitions for
the stock screener application. It is a design artifact, not an implementation
plan.

Related documents:

- `docs/superpowers/specs/2026-05-02-stock-screener-product-scope-design.md`
- `docs/superpowers/specs/2026-05-02-stock-screener-architecture-design.md`

The design assumes the approved scope: US and Singapore stocks first,
end-of-day data, free or low-cost data sources, CSV fallback, and AI review
deferred to V2.

## Data Modeling Principle

V1 should separate raw imported facts from derived screening metrics.

This keeps the system auditable. If a metric looks wrong, students should be
able to trace it back to the source fields, the formula version, and the
provider or CSV import that supplied the data.

## Core Tables

### `markets`

Stores supported markets.

Fields:

- `id`
- `code`
- `name`
- `country`
- `currency`
- `timezone`
- `status`

Initial examples:

- `US`
- `SGX`

### `stocks`

Stores one row per listed stock.

Fields:

- `id`
- `market_id`
- `exchange`
- `stock_code`
- `stock_name`
- `currency`
- `sector`
- `industry`
- `provider_symbol`
- `is_active`

### `daily_prices`

Stores end-of-day OHLC data.

Fields:

- `id`
- `stock_id`
- `date`
- `open`
- `high`
- `low`
- `close`
- `adjusted_close`
- `volume`
- `source`
- `fetched_at`

### `annual_financials`

Stores yearly company financials.

Fields:

- `id`
- `stock_id`
- `fiscal_year`
- `revenue`
- `profit_before_tax`
- `profit_after_tax`
- `ebita`
- `total_debt`
- `total_equity`
- `shares_outstanding`
- `earnings_per_share`
- `book_value_per_share`
- `source`
- `fetched_at`

### `annual_dividends`

Stores annual dividend per share.

Fields:

- `id`
- `stock_id`
- `fiscal_year`
- `dividend_per_share`
- `currency`
- `source`
- `fetched_at`

### `derived_metrics`

Stores calculated metrics used by the screener.

Fields:

- `id`
- `stock_id`
- `metric_key`
- `metric_date`
- `fiscal_year`
- `value`
- `currency`
- `formula_version`
- `input_snapshot`
- `data_quality`

`input_snapshot` should record enough source values to explain the result later.
It does not need to duplicate entire raw provider responses.

`data_quality` should identify whether the metric is complete, missing,
stale, unavailable because of invalid inputs, or imported from CSV.

### `screen_runs`

Stores user screening history for audit and debugging.

Fields:

- `id`
- `created_at`
- `selected_markets`
- `filters_json`
- `result_count`

## Formula Rules

V1 should use the latest available data unless a future version adds an "as of
date" control.

### Market Cap

Formula:

`latest close price * shares outstanding`

If a provider supplies market cap directly, the app may store it in
`market_caps` or as a raw provider value, but the formula layer should still be
able to calculate market cap from price and shares outstanding when both inputs
are available.

### Revenue Growth Rate

Formula:

`(latest revenue - prior year revenue) / prior year revenue`

### Profit Growth Rate

Formula:

`(latest profit after tax - prior year profit after tax) / prior year profit after tax`

Profit after tax is the default profit field for V1 because it is closest to
the profit available to ordinary shareholders after tax. Profit before tax and
EBITA remain stored for future analysis.

### Dividend Yield

Formula:

`latest annual dividend per share / latest close price`

### Dividend Growth Rate

Formula:

`(latest annual dividend per share - prior year dividend per share) / prior year dividend per share`

### P/E Ratio

Formula:

`latest close price / earnings per share`

### P/B Ratio

Formula:

`latest close price / book value per share`

### Debt To Equity Ratio

Formula:

`total debt / total equity`

### OHLC Price Filters

OHLC filters use one of:

- `open`
- `high`
- `low`
- `close`

The default OHLC field is `close`.

## Edge Cases And Data Quality

If a denominator is zero, negative, or missing, the metric should be marked
unavailable instead of returning a misleading number.

Specific V1 rules:

- No prior-year revenue means revenue growth is unavailable.
- Prior-year revenue less than or equal to zero means revenue growth is
  unavailable.
- No prior-year profit after tax means profit growth is unavailable.
- Prior-year profit after tax less than or equal to zero means profit growth is
  unavailable.
- Negative or zero earnings per share means P/E is unavailable by default.
- Negative or zero book value per share means P/B is unavailable by default.
- Total equity less than or equal to zero means debt-to-equity is unavailable.
- No dividend means dividend yield can be `0` only if the source confirms zero
  dividend. Otherwise, dividend yield is unavailable.
- Missing SGX fundamentals should not remove the stock silently. The UI should
  show that the relevant metric is unavailable.

## Currency Handling

For multi-market support, store values in the stock's native currency first.

V1 should not compare market cap across USD and SGD unless a currency conversion
feature is explicitly added later. When users select multiple markets with
different currencies, the UI should either:

- Show native-currency values clearly by row; or
- Disable cross-currency filters that would create misleading comparisons.

The implementation plan should choose one behavior explicitly.

## Formula Versioning

Every derived metric should include a `formula_version`.

V1 can start with a single version such as `v1`, but the field should exist from
the beginning so future formula changes do not silently alter historical screen
results without explanation.
