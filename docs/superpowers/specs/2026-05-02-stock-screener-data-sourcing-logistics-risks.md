# Stock Screener Data Sourcing, Logistics, And Risks

Date: 2026-05-02

## Status

This document records data sourcing logistics and project risks for the stock
screener application. It is a design artifact to help the team plan work and
raise issues early.

Related documents:

- `docs/superpowers/specs/2026-05-02-stock-screener-product-scope-design.md`
- `docs/superpowers/specs/2026-05-02-stock-screener-architecture-design.md`
- `docs/superpowers/specs/2026-05-02-stock-screener-data-model-formulas-design.md`
- `docs/superpowers/specs/2026-05-02-stock-screener-data-flow-design.md`
- `docs/superpowers/specs/2026-05-02-stock-screener-error-handling-testing-design.md`

## Data Sourcing Direction

V1 assumes free or low-cost data first.

The app should not depend on a single provider until the team verifies exact US
and SGX coverage for:

- Stock listings.
- Daily OHLC prices.
- Market cap or shares outstanding.
- Annual revenue.
- Annual profit after tax.
- Annual debt.
- Annual equity.
- Annual dividends.
- Earnings per share.
- Book value per share.

Candidate sources identified during research:

- EODHD: global end-of-day data, fundamentals, dividends, and broad exchange
  coverage. Source: https://eodhd.com/
- Marketstack: end-of-day and historical price endpoints. Source:
  https://marketstack.com/documentation
- Twelve Data: global fundamentals including statements, dividends, splits, and
  analytics. Source: https://twelvedata.com/fundamentals
- Financial Modeling Prep: historical prices and fundamentals across many
  securities. Source: https://site.financialmodelingprep.com/
- Polygon: strong for US equities, but not a single-provider fit for US plus
  SGX. Source: https://polygon.io/stocks

CSV import remains mandatory for V1 because SGX fundamentals may be incomplete
or unavailable from low-cost APIs.

## Required Logistics

The project team should prepare these items before implementation:

- API keys for one or more candidate data providers.
- A small sample dataset for US and SGX development.
- A field coverage matrix comparing providers against required fields.
- A decision on whether V1 stores data in SQLite, Postgres, or another database.
- A decision on whether ingestion jobs run manually, by CLI command, or by a
  scheduled worker.
- A convention for stock symbols across providers.
- A CSV template for stock listings, daily prices, annual financials, and
  dividends.
- A non-advice disclaimer for user-facing screens and exports.

## Field Coverage Matrix

Before implementation, the team should complete this matrix for each candidate
provider.

Columns:

- Provider.
- Market: US or SGX.
- Stock listing coverage.
- Daily OHLC coverage.
- Historical depth.
- Market cap coverage.
- Shares outstanding coverage.
- Revenue coverage.
- Profit after tax coverage.
- Debt coverage.
- Equity coverage.
- Dividend coverage.
- EPS coverage.
- Book value per share coverage.
- Free tier limits.
- Paid tier cost if needed.
- License or redistribution restrictions.
- Notes.

The provider with the best combination of coverage, cost, terms, and API
stability should become the first adapter. CSV import should still remain.

## Key Risks

### SGX Fundamentals May Be Incomplete

Low-cost providers often have better US data than Singapore data. Some SGX
stocks may have prices but missing fundamentals.

Mitigation:

- Keep CSV import as a first-class source.
- Show missing data clearly.
- Let filters ignore unavailable metrics only when the user has not selected
  those metrics.

### Provider Formulas May Differ

Providers may calculate P/E, market cap, dividend yield, or book value
differently.

Mitigation:

- Store raw facts separately from derived metrics.
- Calculate V1 formulas inside the app.
- Keep provider-supplied ratios as reference values only unless explicitly
  accepted.

### Free Tier Rate Limits May Be Too Low

Free tiers may not allow full US and SGX universe refreshes.

Mitigation:

- Cache data locally.
- Start with a smaller stock universe for V1.
- Support manual CSV imports.
- Run ingestion after market close instead of during user screening.

### Licensing May Restrict Redistribution

Some market data terms restrict storage, redistribution, or public display.

Mitigation:

- Review provider terms before public deployment.
- Treat V1 as an educational internal prototype until terms are clear.
- Do not expose paid or restricted data publicly without permission.

### Currency Comparisons Can Mislead Users

US stocks are usually in USD. SGX stocks are commonly in SGD, though some SGX
instruments may trade in other currencies.

Mitigation:

- Store native currency.
- Label currency in results.
- Avoid cross-currency market cap filters in V1 unless conversion is added.

### Stock Identifiers Can Be Messy

Ticker symbols differ across providers. Delistings, renamed stocks, secondary
listings, and ETFs can complicate the universe.

Mitigation:

- Store internal stock IDs.
- Store provider symbols separately.
- Track active/inactive status.
- Keep market and exchange fields explicit.

### AI Review Can Create Advice Risk

The optional AI step can make users think the app is recommending investments.

Mitigation:

- Keep AI review out of V1.
- In V2, cite sources, explain uncertainty, and avoid buy/sell/hold commands.

## Recommended V1 Data Strategy

Start with a bounded universe instead of every US and SGX stock.

Recommended first dataset:

- A representative list of large US stocks.
- A representative list of liquid SGX stocks.
- At least one stock with missing fundamentals.
- At least one stock with no dividend.
- At least one stock with negative earnings.

This allows the team to prove the screener workflow before spending time and
money on full-market data coverage.
