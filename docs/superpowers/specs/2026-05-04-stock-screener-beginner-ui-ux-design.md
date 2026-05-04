# Stock Screener Beginner UI/UX Design

Date: 2026-05-04

## Status

This document records the approved beginner-focused UI/UX direction for V1 of
the stock screener application. It is a design artifact, not an implementation
plan.

Related documents:

- `docs/superpowers/specs/2026-05-02-stock-screener-product-scope-design.md`
- `docs/superpowers/specs/2026-05-02-stock-screener-architecture-design.md`

Visual references:

- Current empty state screenshot: `docs/superpowers/specs/assets/2026-05-04-current-empty-state.png`
- Current results state screenshot: `docs/superpowers/specs/assets/2026-05-04-current-results-state.png`
- Proposed concept: `docs/superpowers/specs/assets/2026-05-04-beginner-ui-concept.png`

## Design Goal

V1 should optimize for beginners learning how to screen stocks, not for expert
traders who already understand all metrics.

The interface should help users answer four beginner questions:

- What stocks are available to screen?
- What does each screening metric mean?
- Why did a stock match or fail the selected filters?
- Can I trust the data enough to use this as a research shortlist?

The app must remain a research tool. It should not provide buy, sell, hold, or
AI-generated recommendations in V1.

## Current UI/UX Review

The current application is functional but reads as a technical MVP:

- The page is mostly a filter form, criteria summary, and table.
- The first view does not explain the available stock universe.
- The default results area is visually empty before the screen runs.
- Metric names such as `pe_ratio` appear without beginner explanations.
- The filter builder uses basic browser controls and has weak visual hierarchy.
- The data freshness badge exists, but it is too small to carry the trust model.
- The export action is present but visually disconnected from the result set.
- There is no summary such as "4 of 6 stocks matched".
- There is no workflow for learning what a metric means before applying it.
- There is no way to inspect why a specific stock matched the screen.

The current dynamic table behavior is not wrong. The issue is that beginners
need more orientation around it.

## Rationale For Dynamic Result Columns

The results table should keep identity columns stable and make metric columns
dynamic.

Always-visible identity columns:

- Market.
- Exchange.
- Stock code.
- Company name.
- Currency.

Dynamic metric columns:

- Only metrics selected by the user should appear by default.
- If the user filters by P/E, the table should show P/E.
- If the user adds Dividend Yield, the table should add Dividend Yield.
- If the user removes a filter, the corresponding metric column can be removed
  unless it is pinned or selected in a future column chooser.

This approach is better for beginners because it reduces noise. A full financial
table with many metrics can look impressive, but it makes it harder to understand
which numbers are relevant to the screen. The app should teach users to connect
"filter chosen" with "metric shown".

The design should still provide a visible full-stock workflow. Beginners should
not feel that stocks only exist after filters are applied.

## Recommended V1 Design

Use a guided screener workspace.

The primary screen should include:

- A compact top bar with app name, data freshness, data source mode, and export.
- A left sidebar titled "Build your screen".
- Market selectors for United States and Singapore.
- Beginner metric cards with plain-English explanations.
- Min and max range controls for active metrics.
- A main stock universe summary strip.
- Tabs for Results, Stock Universe, and Learn.
- A results table with stable identity columns and dynamic metric columns.
- A right-side learning panel or drawer for the selected metric.
- A short explanation area for why the current results matched.

The design should feel like a practical financial research workspace. It should
not look like a marketing landing page.

## Core Workflow

### 1. Start With Orientation

On first load, the app should show:

- Supported markets: United States and Singapore.
- Number of stocks currently available in the local dataset.
- Latest data refresh timestamp or fixture/import timestamp.
- A starter filter such as P/E Ratio with a beginner-friendly default range.
- A table view showing either the starter screen results or the stock universe.

The screen should not feel blank.

### 2. Build A Screen

Users choose markets and add screening metrics from beginner-friendly metric
cards.

Each metric card should show:

- Human label, such as "P/E Ratio".
- Plain-English explanation, such as "How much investors pay for each dollar of
  earnings."
- A caution note when needed, such as "Lower is not always better."
- Min and max inputs.
- Data availability or freshness signal when the metric has gaps.

### 3. Review Matches

After the screen runs, the UI should show:

- Total stocks in the selected universe.
- Number of stocks matched.
- Number of stocks filtered out.
- Active criteria in plain English.
- Results table with dynamic metric columns.
- Freshness badges at row or metric level.

The user should be able to understand that the screen is narrowing a larger
universe, not producing recommendations.

### 4. Learn The Metric

When a user selects or focuses a metric, the learning panel should explain it.

For P/E Ratio, the panel should include:

- "P/E compares share price to company earnings."
- "A lower P/E can mean a stock is cheaper, but it can also mean investors expect
  weaker growth."
- "Compare companies in the same industry when possible."

The learning panel should stay concise. It should help the user understand the
screening decision without becoming a full investing course.

### 5. Inspect A Stock

Selecting a row should open a lightweight detail drawer or panel showing:

- Company identity.
- Market and exchange.
- Metric values used in the active screen.
- Data freshness and missing-data warnings.
- A simple "why matched" explanation.

This is not an AI review. It is a deterministic explanation of the selected
criteria.

### 6. Export Shortlist

Export should be placed near the results table and should export the current
filtered shortlist, including selected markets, active criteria, and returned
metric values.

## Information Architecture

### Top Bar

The top bar should contain:

- Product name: Stock Screener.
- Data mode: Fixture data, CSV import, or provider-backed data.
- Last refresh timestamp.
- Export action.

### Left Sidebar

The left sidebar should contain:

- Market selection.
- Beginner metric library.
- Active filter controls.
- Run screen action.

The sidebar should be compact but instructional.

### Main Content

The main content should contain:

- Universe summary strip.
- Tabs: Results, Stock Universe, Learn.
- Results table or stock universe table.
- Explanation area for matched and filtered-out stocks.

### Learning Panel

The learning panel should contain:

- Selected metric definition.
- Beginner example.
- Caution note.
- Data availability note.

On smaller screens, the learning panel should collapse into a drawer or tab.

## Visual Design Direction

The visual style should be beginner-friendly fintech:

- White or very light neutral background.
- Subtle gray borders and panels.
- Restrained blue for primary actions.
- Green only for positive freshness or availability signals.
- Red or amber only for warnings and missing data.
- 8px maximum card/panel radius unless an existing component system requires
  otherwise.
- Crisp typography with clear hierarchy.
- Compact dashboard density without feeling crowded.
- Familiar icons for export, refresh, help, info, and table actions.

Avoid:

- Marketing hero sections.
- Decorative illustration-heavy layouts.
- Purple gradients, beige palettes, and decorative background effects.
- Nested cards.
- Overly large headings inside compact panels.
- In-app text that explains the UI itself instead of helping with the stock
  screening task.

## States

The V1 UI should handle these states explicitly:

- First load with fixture or imported data available.
- Loading screen results.
- Successful screen with matching rows.
- Successful screen with zero matches.
- Missing data for some metrics.
- Market selected with no available stock records.
- CSV export disabled because no results exist.
- API or local data query error.

Zero-match copy should be educational. Example:

"No stocks matched these ranges. Try widening the P/E range or removing one
filter."

## Accessibility And Responsiveness

The UI should support:

- Keyboard navigation through filters, tabs, and table rows.
- Clear focus states.
- Labels for all form controls.
- Button text or accessible labels for icon-only actions.
- Responsive layout where sidebar, table, and learning panel collapse cleanly.
- Horizontal table scrolling only when necessary.

Mobile layout should prioritize:

- Market and filter selection.
- Match count summary.
- Results table with fewer visible columns.
- Learning content behind a tab or drawer.

## Data Trust Model

Because V1 assumes free or low-cost data first, the UI must make data quality
visible.

The screen should show:

- Data source mode.
- Last refresh/import time.
- Fresh, stale, missing, or imported status where applicable.
- Missing metric explanations.

Freshness indicators should be understandable without reading the architecture
docs.

## Out Of Scope For This Design

This UI/UX design does not include:

- AI stock analysis or recommendations.
- Personalized investment advice.
- Real-time price updates.
- Alerts.
- Portfolio tracking.
- Broker integration.
- Advanced charting.
- Paid-provider account management.

## Acceptance Criteria

The redesign is successful when:

- A beginner can see the available stock universe before applying filters.
- A beginner can understand what P/E, dividend yield, revenue growth, and debt
  to equity mean at a basic level.
- The app clearly shows how many stocks matched and how many were filtered out.
- The results table remains readable by showing stable identity columns and only
  relevant metric columns by default.
- Data freshness and missing data are visible enough to affect user trust.
- Export clearly applies to the current shortlist.
- The interface remains a research tool and does not imply investment advice.
