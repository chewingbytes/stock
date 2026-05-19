# Phase 1 Demo Slice Design

Date: 2026-05-19

## Status

Approved design for a standalone "Phase 1" demo artifact carved out of the
existing stock screener. This is a design document, not an implementation plan.

Related documents:

- `docs/superpowers/specs/2026-05-04-stock-screener-beginner-ui-ux-design.md`
- `docs/superpowers/specs/2026-05-02-stock-screener-architecture-design.md`

## Goal

The stock screener application is functionally complete. A screenshot of the
finished product has already been shared, but it has never been demonstrated
running. For an academic / course milestone, progress must be revealed in
phases: Phase 1 must read as a credible, deliberate first deliverable with
obvious room left to grow, and it must not reveal the whole product.

Phase 1 demonstrates that the **core screening engine works end-to-end** on a
controlled dataset — real metric math, real range filtering, rendered in the
product UI — while holding back the features that make up later milestones.

## Constraints

- Phase 1 lives in a single folder named `Phase 1/` at the repository root
  (literal name, including the space).
- That folder must be fully self-contained: it can be opened in a separate,
  standalone VS Code window and run without the parent repository present.
- Live-demo setup must be minimal: `npm install` then `npm run dev`. No
  database, no migration, no seed, no metric-recompute step.
- Phase 1 should visually resemble the already-shared screenshot so the
  milestone is recognizably the same product, just earlier.

## Chosen Approach

Approach A — fully self-contained copy. `Phase 1/` is a complete, independent
Next.js project with its own `package.json`. It duplicates the small pure
domain files unchanged, **replaces** the Prisma-backed screener with an
in-memory fixture screener, and ships a trimmed UI. It has zero dependency on
the parent repository.

Rejected alternatives:

- Shared domain via path/symlink — breaks standalone-folder requirement.
- Monorepo workspace — setup complexity defeats the demo purpose.

Code duplication is acceptable and intentional here: Phase 1 is a frozen demo
snapshot. Later phases re-reveal more capability from the main repository.

## Rationale: Why This Slice Is Possible

The existing codebase is cleanly layered:

- `src/domain/metrics.ts`, `src/domain/filtering.ts`, `src/domain/types.ts`
  are pure functions with no I/O — no Prisma, no React imports.
- The SQLite database only caches *computed* metric output
  (`DerivedMetric`). `screenerService.ts` reads pre-computed rows; the actual
  math lives in the pure `calculate*` functions.

So an in-memory fixture screener is not a shortcut around the real engine — it
reuses the real engine and replaces only the persistence of its output.

## Folder Layout

```
Phase 1/
  package.json          # next, react, react-dom, zod, csv-parse only
  tsconfig.json
  next.config.ts
  next-env.d.ts
  .gitignore            # ignores node_modules/ and .next/
  README.md             # Phase 1 framing + two-command run instructions
  data/fixtures/
    markets.csv
    stocks.csv
    daily_prices.csv
    annual_financials.csv
    annual_dividends.csv
  src/
    app/
      layout.tsx        # copied as-is
      globals.css       # copied as-is (matches the shared screenshot)
      page.tsx          # TRIMMED: one market, P/E only, Run Screen, table
      api/screen/route.ts   # rewired to the in-memory screener
    domain/
      types.ts          # copied unchanged
      metrics.ts        # copied unchanged
      filtering.ts      # copied unchanged
    server/
      csv/readCsv.ts            # copied unchanged
      screener/fixtureScreener.ts   # NEW: in-memory replacement for Prisma path
```

Note: all fixture CSVs are copied even though Phase 1 only screens US stocks,
because `markets.csv`, `stocks.csv`, `daily_prices.csv`, and
`annual_financials.csv` are jointly required to compute P/E and the dataset is
small. `annual_dividends.csv` is copied for parity but unused in Phase 1.

## Data Flow

1. User adjusts a single P/E min/max control and clicks **Run Screen**.
2. The browser POSTs to `/api/screen`.
3. `route.ts` validates the request with the existing zod schema shape and
   calls `fixtureScreener.runFixtureScreen`.
4. `fixtureScreener` reads the fixture CSVs from `data/fixtures/` (resolved
   relative to `process.cwd()`, which is the `Phase 1/` folder during
   `npm run dev`) using the copied `readCsv`.
5. For each US stock, it computes P/E with the unchanged
   `calculatePeRatio(closePrice, earningsPerShare)`, where `closePrice` is the
   latest row in `daily_prices.csv` and `earningsPerShare` is the latest
   fiscal year in `annual_financials.csv`.
6. It applies the min/max range using the existing filtering rules: a row only
   passes when its P/E status is `complete` and within range.
7. The API returns rows shaped like the existing `ScreenResult` (identity
   fields plus a `metrics.pe_ratio` entry with value, dataQuality, reason).
8. The trimmed results table renders identity columns plus the P/E column.

No database, no `metrics:recompute`, no `ScreenRun` audit write.

## UI Scope

### In Phase 1

- App header and styling carried over via `layout.tsx` + `globals.css` so the
  page resembles the shared screenshot.
- Market fixed to **United States** (stocks AAPL, MSFT, LOSS). The market is
  not user-selectable in Phase 1; it is displayed as a fixed label.
- A single P/E Ratio min/max numeric control.
- A **Run Screen** button.
- A results table with stable identity columns (market, exchange, stock code,
  company name, currency) plus a P/E Ratio column.
- Where P/E cannot be computed, the cell shows `—` with a short plain reason.
  `LOSS` (Loss Making Sample Inc., non-positive earnings) is deliberately left
  in the universe so it visibly drops out of matches — an honest, minimal
  demonstration that the engine respects data quality.

### Held Back For Later Phases

- The Learn / glossary beginner-education experience.
- Multi-market support (SGX / Singapore).
- CSV export of the shortlist.
- Row-inspection detail drawer ("why matched").
- The full multi-metric filter builder (additional metrics, multiple filters).
- Real provider / Yahoo Finance data import.

Each held-back item is a credible standalone future milestone.

## Demo Narrative

"Phase 1 proves the core screening engine works end-to-end on a controlled
dataset: real metric math, real range filtering, rendered in the product UI.
Later phases layer on the beginner-education experience, additional markets,
live data ingestion, and shortlist export."

This frames Phase 1 as a deliberate foundation-first plan rather than an
unfinished application.

## Out Of Scope

- No tests are copied into `Phase 1/`. The engine's correctness is already
  proven by the main repository's test suite; Phase 1 is a demo artifact.
- No Prisma / SQLite, no Playwright, no Yahoo import, no CSV export, no SGX
  market, no `ScreenRun` / `ImportRun` persistence.
- No changes to the parent repository's application code. Only this design
  document (and later its implementation plan) are added there.

## Acceptance Criteria

Phase 1 is successful when:

- `Phase 1/` opens in a fresh VS Code window with no parent repo present.
- `npm install` then `npm run dev` serves the app with no further setup.
- The page loads styled like the shared screenshot, showing the United States
  market and a P/E control.
- Clicking **Run Screen** with a sensible P/E range (e.g. 1–40) returns AAPL
  and MSFT and excludes LOSS, with LOSS's P/E shown as `—` and a reason.
- Widening or narrowing the P/E range changes the matched set correctly.
- No database or extra build/seed step is required at any point.
- No Learn panel, market selector, export, row drawer, multi-metric builder,
  or SGX data is reachable in the UI.
