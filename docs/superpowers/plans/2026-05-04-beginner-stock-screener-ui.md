# Beginner Stock Screener UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the approved beginner-friendly guided screener workspace for V1.

**Architecture:** Keep the existing Next.js App Router structure and the local screener API. Add small frontend components for metric education, universe summary, tabs, and row explanation, plus a narrow backend response enhancement for universe and filtered-out counts.

**Tech Stack:** Next.js, React, TypeScript, Prisma, Vitest, Testing Library, Playwright.

---

## Source Specs

- `docs/superpowers/specs/2026-05-04-stock-screener-beginner-ui-ux-design.md`
- `docs/superpowers/specs/assets/2026-05-04-beginner-ui-concept.png`

## File Structure

- Create `src/domain/metricDefinitions.ts`
  - Owns beginner-facing metric labels, definitions, examples, cautions, and default ranges.
- Create `src/domain/metricDefinitions.test.ts`
  - Verifies required beginner metrics and fallbacks.
- Modify `src/server/screener/screenerService.ts`
  - Adds `universeTotal` and `filteredOut` to `ScreenResult`.
- Modify `src/server/screener/screenerService.test.ts`
  - Verifies count semantics.
- Create `src/components/UniverseSummary.tsx`
  - Shows total universe, matched, filtered-out, selected markets, and data mode.
- Create `src/components/MetricLearningPanel.tsx`
  - Shows selected metric explanation.
- Create `src/components/ScreenTabs.tsx`
  - Provides Results, Stock Universe, and Learn tabs.
- Create `src/components/RowExplanation.tsx`
  - Shows deterministic "why matched" copy for a selected row.
- Modify `src/components/FilterBuilder.tsx`
  - Changes the filter UI from raw rows to beginner metric cards and range controls.
- Modify `src/components/ResultsTable.tsx`
  - Keeps identity columns stable, uses human labels for dynamic metric columns, supports row selection, and shows empty states.
- Modify `src/components/ExportButton.tsx`
  - Aligns export state with current shortlist and disabled state.
- Modify `src/components/CriteriaSummary.tsx`
  - Uses human labels and plain-English ranges.
- Modify `src/app/page.tsx`
  - Composes the guided workspace, runs the starter screen on load, manages tabs, selected metric, selected row, and universe/result data.
- Modify `src/app/page.test.tsx`
  - Tests beginner workflow rendering.
- Modify `tests/e2e/screener.spec.ts`
  - Tests the primary guided workflow.
- Modify `src/app/globals.css`
  - Implements the approved visual system.

---

### Task 1: Add Beginner Metric Definitions

**Files:**
- Create: `src/domain/metricDefinitions.ts`
- Create: `src/domain/metricDefinitions.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/domain/metricDefinitions.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  beginnerMetricDefinitions,
  formatMetricLabel,
  getMetricDefinition,
} from "./metricDefinitions";

describe("metricDefinitions", () => {
  it("defines beginner explanations for the V1 starter metrics", () => {
    expect(beginnerMetricDefinitions.pe_ratio.label).toBe("P/E Ratio");
    expect(beginnerMetricDefinitions.dividend_yield.label).toBe("Dividend Yield");
    expect(beginnerMetricDefinitions.revenue_growth_rate.label).toBe(
      "Revenue Growth",
    );
    expect(beginnerMetricDefinitions.debt_to_equity_ratio.caution).toContain(
      "Debt",
    );
  });

  it("returns a readable fallback label for supported metrics", () => {
    expect(formatMetricLabel("pb_ratio")).toBe("P/B Ratio");
    expect(getMetricDefinition("close").label).toBe("Close Price");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/domain/metricDefinitions.test.ts`

Expected: FAIL because `src/domain/metricDefinitions.ts` does not exist.

- [ ] **Step 3: Add metric definitions**

Create `src/domain/metricDefinitions.ts`:

```ts
import type { MetricKey, RangeFilter } from "./types";

export type BeginnerMetricDefinition = {
  metricKey: MetricKey;
  label: string;
  shortLabel: string;
  explanation: string;
  example: string;
  caution: string;
  defaultRange: Pick<RangeFilter, "min" | "max">;
};

export const beginnerMetricDefinitions: Record<
  MetricKey,
  BeginnerMetricDefinition
> = {
  market_cap: {
    metricKey: "market_cap",
    label: "Market Cap",
    shortLabel: "Market Cap",
    explanation: "The total market value of a company's shares.",
    example: "A larger market cap usually means a larger, more established company.",
    caution: "Size does not guarantee quality or future returns.",
    defaultRange: { min: null, max: null },
  },
  revenue_growth_rate: {
    metricKey: "revenue_growth_rate",
    label: "Revenue Growth",
    shortLabel: "Revenue Growth",
    explanation: "How quickly company sales are growing.",
    example: "A value of 10 means revenue grew by about 10%.",
    caution: "Fast growth can slow down and may come with higher risk.",
    defaultRange: { min: 0, max: null },
  },
  profit_growth_rate: {
    metricKey: "profit_growth_rate",
    label: "Profit Growth",
    shortLabel: "Profit Growth",
    explanation: "How quickly company profit is growing.",
    example: "A positive value means profit increased compared with the prior period.",
    caution: "One-off gains can make profit growth look better than usual.",
    defaultRange: { min: 0, max: null },
  },
  dividend_yield: {
    metricKey: "dividend_yield",
    label: "Dividend Yield",
    shortLabel: "Yield",
    explanation: "Dividend income compared with the stock price.",
    example: "A 4% yield means annual dividends are about 4% of the share price.",
    caution: "A very high yield can signal that investors expect trouble.",
    defaultRange: { min: 0, max: 8 },
  },
  dividend_growth_rate: {
    metricKey: "dividend_growth_rate",
    label: "Dividend Growth",
    shortLabel: "Dividend Growth",
    explanation: "How quickly dividends have grown.",
    example: "A positive value means dividends increased compared with the prior period.",
    caution: "Past dividend growth does not guarantee future dividends.",
    defaultRange: { min: 0, max: null },
  },
  pe_ratio: {
    metricKey: "pe_ratio",
    label: "P/E Ratio",
    shortLabel: "P/E",
    explanation: "How much investors pay for each dollar of company earnings.",
    example: "A P/E of 20 means investors pay about $20 for $1 of earnings.",
    caution: "Lower is not always better; compare similar companies.",
    defaultRange: { min: 1, max: 40 },
  },
  pb_ratio: {
    metricKey: "pb_ratio",
    label: "P/B Ratio",
    shortLabel: "P/B",
    explanation: "Share price compared with book value per share.",
    example: "A P/B of 1 means price is close to accounting book value.",
    caution: "Book value matters more for some industries than others.",
    defaultRange: { min: 0, max: 5 },
  },
  debt_to_equity_ratio: {
    metricKey: "debt_to_equity_ratio",
    label: "Debt To Equity",
    shortLabel: "D/E",
    explanation: "Company debt compared with shareholder equity.",
    example: "A D/E of 1 means debt is roughly equal to equity.",
    caution: "Debt can increase risk, but some industries normally use more Debt.",
    defaultRange: { min: 0, max: 2 },
  },
  open: {
    metricKey: "open",
    label: "Open Price",
    shortLabel: "Open",
    explanation: "The first traded price for the day.",
    example: "Use this with high, low, and close to understand daily movement.",
    caution: "One daily price does not explain business quality.",
    defaultRange: { min: null, max: null },
  },
  high: {
    metricKey: "high",
    label: "High Price",
    shortLabel: "High",
    explanation: "The highest traded price for the day.",
    example: "This shows the top of the daily trading range.",
    caution: "Daily highs can be short-lived.",
    defaultRange: { min: null, max: null },
  },
  low: {
    metricKey: "low",
    label: "Low Price",
    shortLabel: "Low",
    explanation: "The lowest traded price for the day.",
    example: "This shows the bottom of the daily trading range.",
    caution: "Daily lows can reflect short-term trading noise.",
    defaultRange: { min: null, max: null },
  },
  close: {
    metricKey: "close",
    label: "Close Price",
    shortLabel: "Close",
    explanation: "The final traded price for the day.",
    example: "End-of-day screeners usually use the latest close price.",
    caution: "Price alone does not show whether a stock is cheap or expensive.",
    defaultRange: { min: null, max: null },
  },
};

export function getMetricDefinition(metricKey: MetricKey) {
  return beginnerMetricDefinitions[metricKey];
}

export function formatMetricLabel(metricKey: MetricKey) {
  return getMetricDefinition(metricKey).label;
}
```

- [ ] **Step 4: Run tests**

Run: `npm test -- src/domain/metricDefinitions.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/metricDefinitions.ts src/domain/metricDefinitions.test.ts
git commit -m "feat: add beginner metric definitions"
```

---

### Task 2: Add Universe Counts To Screener Results

**Files:**
- Modify: `src/server/screener/screenerService.ts`
- Modify: `src/server/screener/screenerService.test.ts`

- [ ] **Step 1: Write the failing service test**

In `src/server/screener/screenerService.test.ts`, add an assertion to the existing screen test or a new test after fixture import:

```ts
expect(result.universeTotal).toBeGreaterThanOrEqual(result.total);
expect(result.filteredOut).toBe(result.universeTotal - result.total);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/server/screener/screenerService.test.ts`

Expected: FAIL because `universeTotal` and `filteredOut` are not returned.

- [ ] **Step 3: Update result type and return value**

In `src/server/screener/screenerService.ts`, update `ScreenResult`:

```ts
export type ScreenResult = {
  criteria: RangeFilter[];
  universeTotal: number;
  filteredOut: number;
  total: number;
  page: number;
  pageSize: number;
  rows: ScreenRow[];
};
```

Then update the return block:

```ts
const universeTotal = rows.length;
const total = filteredRows.length;
const filteredOut = universeTotal - total;
```

```ts
return {
  criteria: validation.filters,
  universeTotal,
  filteredOut,
  total,
  page: input.page,
  pageSize: input.pageSize,
  rows: pagedRows,
};
```

- [ ] **Step 4: Run tests**

Run: `npm test -- src/server/screener/screenerService.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/server/screener/screenerService.ts src/server/screener/screenerService.test.ts
git commit -m "feat: return screener universe counts"
```

---

### Task 3: Add Beginner UI Components

**Files:**
- Create: `src/components/UniverseSummary.tsx`
- Create: `src/components/MetricLearningPanel.tsx`
- Create: `src/components/ScreenTabs.tsx`
- Create: `src/components/RowExplanation.tsx`

- [ ] **Step 1: Add component tests through page test first**

In `src/app/page.test.tsx`, extend the existing test:

```ts
expect(
  screen.getByRole("heading", { name: "Build your screen" }),
).toBeInTheDocument();
expect(screen.getByRole("tab", { name: "Results" })).toBeInTheDocument();
expect(screen.getByRole("tab", { name: "Stock Universe" })).toBeInTheDocument();
expect(screen.getByRole("tab", { name: "Learn" })).toBeInTheDocument();
expect(screen.getByText("Learn this metric")).toBeInTheDocument();
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/app/page.test.tsx`

Expected: FAIL because the new UI is not rendered.

- [ ] **Step 3: Create `UniverseSummary.tsx`**

```tsx
export function UniverseSummary({
  universeTotal,
  matched,
  filteredOut,
  markets,
}: {
  universeTotal: number;
  matched: number;
  filteredOut: number;
  markets: string[];
}) {
  return (
    <section className="universe-summary" aria-label="Stock universe summary">
      <div>
        <span className="summary-value">{universeTotal}</span>
        <span className="summary-label">stocks in universe</span>
      </div>
      <div>
        <span className="summary-value">{matched}</span>
        <span className="summary-label">matched</span>
      </div>
      <div>
        <span className="summary-value">{filteredOut}</span>
        <span className="summary-label">filtered out</span>
      </div>
      <div>
        <span className="summary-value">{markets.join(", ")}</span>
        <span className="summary-label">selected markets</span>
      </div>
      <div>
        <span className="summary-value">Fixture data</span>
        <span className="summary-label">data mode</span>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Create `MetricLearningPanel.tsx`**

```tsx
import type { MetricKey } from "../domain/types";
import { getMetricDefinition } from "../domain/metricDefinitions";

export function MetricLearningPanel({ metricKey }: { metricKey: MetricKey }) {
  const definition = getMetricDefinition(metricKey);

  return (
    <aside className="learning-panel" aria-labelledby="learning-title">
      <p className="eyebrow">Learn this metric</p>
      <h2 id="learning-title">{definition.label}</h2>
      <p>{definition.explanation}</p>
      <div className="learning-note">
        <strong>Example</strong>
        <p>{definition.example}</p>
      </div>
      <div className="learning-note warning">
        <strong>Watch out</strong>
        <p>{definition.caution}</p>
      </div>
    </aside>
  );
}
```

- [ ] **Step 5: Create `ScreenTabs.tsx`**

```tsx
export type ScreenTab = "results" | "universe" | "learn";

const tabs: Array<{ id: ScreenTab; label: string }> = [
  { id: "results", label: "Results" },
  { id: "universe", label: "Stock Universe" },
  { id: "learn", label: "Learn" },
];

export function ScreenTabs({
  activeTab,
  onChange,
}: {
  activeTab: ScreenTab;
  onChange: (tab: ScreenTab) => void;
}) {
  return (
    <div className="screen-tabs" role="tablist" aria-label="Screen views">
      {tabs.map((tab) => (
        <button
          aria-selected={activeTab === tab.id}
          className={activeTab === tab.id ? "active" : ""}
          key={tab.id}
          onClick={() => onChange(tab.id)}
          role="tab"
          type="button"
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 6: Create `RowExplanation.tsx`**

```tsx
import type { RangeFilter } from "../domain/types";
import { formatMetricLabel } from "../domain/metricDefinitions";

export function RowExplanation({
  stockName,
  filters,
}: {
  stockName: string | null;
  filters: RangeFilter[];
}) {
  if (!stockName) {
    return (
      <section className="row-explanation">
        <h2>Why these stocks matched</h2>
        <p>Select a row to see how it matches your active criteria.</p>
      </section>
    );
  }

  return (
    <section className="row-explanation">
      <h2>Why {stockName} matched</h2>
      <p>
        This stock passed {filters.length} active{" "}
        {filters.length === 1 ? "filter" : "filters"}.
      </p>
      <ul>
        {filters.map((filter) => (
          <li key={filter.metricKey}>
            {formatMetricLabel(filter.metricKey)} is within the selected range.
          </li>
        ))}
      </ul>
    </section>
  );
}
```

- [ ] **Step 7: Commit**

```bash
git add src/components/UniverseSummary.tsx src/components/MetricLearningPanel.tsx src/components/ScreenTabs.tsx src/components/RowExplanation.tsx src/app/page.test.tsx
git commit -m "feat: add beginner screener workspace components"
```

---

### Task 4: Redesign Filter Builder And Results Table

**Files:**
- Modify: `src/components/FilterBuilder.tsx`
- Modify: `src/components/ResultsTable.tsx`
- Modify: `src/components/CriteriaSummary.tsx`

- [ ] **Step 1: Add expectations to page test**

In `src/app/page.test.tsx`, add:

```ts
expect(screen.getByText("How much investors pay for each dollar")).toBeInTheDocument();
expect(screen.getByRole("columnheader", { name: "Company" })).toBeInTheDocument();
expect(screen.getByRole("columnheader", { name: "P/E Ratio" })).toBeInTheDocument();
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/app/page.test.tsx`

Expected: FAIL until the redesigned components are wired into the page.

- [ ] **Step 3: Update `FilterBuilder.tsx`**

Use `beginnerMetricDefinitions` for labels, explanations, and defaults. Keep the
existing props:

```tsx
import { beginnerMetricDefinitions } from "../domain/metricDefinitions";
import type { MetricKey, RangeFilter } from "../domain/types";

const starterMetrics: MetricKey[] = [
  "pe_ratio",
  "dividend_yield",
  "revenue_growth_rate",
  "debt_to_equity_ratio",
];
```

Render cards with buttons that add filters using `defaultRange`. Existing active
filters keep min and max inputs.

- [ ] **Step 4: Update `ResultsTable.tsx`**

Add props:

```ts
selectedRowKey: string | null;
onSelectRow: (rowKey: string) => void;
emptyMessage?: string;
```

Use `formatMetricLabel(key)` for dynamic column headers. Rename the stable name
column from `Name` to `Company`.

- [ ] **Step 5: Update `CriteriaSummary.tsx`**

Use `formatMetricLabel(filter.metricKey)` and render ranges as:

```ts
`${label}: ${filter.min ?? "Any"} to ${filter.max ?? "Any"}`
```

- [ ] **Step 6: Run focused tests**

Run: `npm test -- src/app/page.test.tsx`

Expected: PASS after Task 5 wires components into the page. If this task is
implemented before Task 5, the expected result remains FAIL because the page has
not yet rendered the new component props.

- [ ] **Step 7: Commit**

```bash
git add src/components/FilterBuilder.tsx src/components/ResultsTable.tsx src/components/CriteriaSummary.tsx
git commit -m "feat: redesign beginner filters and results table"
```

---

### Task 5: Compose The Guided Workspace Page

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/page.test.tsx`

- [ ] **Step 1: Update page test with fetch mock**

Mock `/api/screen` so the page can render starter results:

```ts
const screenResult = {
  criteria: [{ metricKey: "pe_ratio", min: 1, max: 40 }],
  universeTotal: 6,
  filteredOut: 2,
  total: 4,
  page: 1,
  pageSize: 50,
  rows: [
    {
      marketCode: "US",
      exchange: "NASDAQ",
      stockCode: "AAPL",
      stockName: "Apple Inc.",
      currency: "USD",
      metrics: {
        pe_ratio: {
          value: 25.982,
          dataQuality: "fresh",
          reason: null,
          currency: null,
        },
      },
    },
  ],
};

global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: async () => screenResult,
}) as unknown as typeof fetch;
```

Assert:

```ts
expect(await screen.findByText("6")).toBeInTheDocument();
expect(await screen.findByText("AAPL")).toBeInTheDocument();
expect(screen.getByText("2")).toBeInTheDocument();
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/app/page.test.tsx`

Expected: FAIL until `page.tsx` runs the starter screen and renders summary.

- [ ] **Step 3: Update `ScreenResult` type in `page.tsx`**

Add:

```ts
criteria: RangeFilter[];
universeTotal: number;
filteredOut: number;
page: number;
pageSize: number;
```

- [ ] **Step 4: Add page state**

Add:

```ts
const [activeTab, setActiveTab] = useState<ScreenTab>("results");
const [selectedMetricKey, setSelectedMetricKey] =
  useState<RangeFilter["metricKey"]>("pe_ratio");
const [selectedRowKey, setSelectedRowKey] = useState<string | null>(null);
```

- [ ] **Step 5: Run starter screen on load**

After `ready` is true, call `runScreen()` once using the default P/E range.
Avoid duplicate calls by using a `useRef(false)` guard.

- [ ] **Step 6: Compose layout**

Render:

- `UniverseSummary`
- `ScreenTabs`
- `ResultsTable`
- `RowExplanation`
- `MetricLearningPanel`

Keep the disclaimer visible and non-advice oriented.

- [ ] **Step 7: Run tests**

Run: `npm test -- src/app/page.test.tsx`

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/app/page.tsx src/app/page.test.tsx
git commit -m "feat: compose guided beginner screener workspace"
```

---

### Task 6: Apply The Visual System

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Add visual regression expectations to E2E**

In `tests/e2e/screener.spec.ts`, add assertions for visible beginner UI:

```ts
await expect(page.getByText("stocks in universe")).toBeVisible();
await expect(page.getByText("Learn this metric")).toBeVisible();
await expect(page.getByRole("tab", { name: "Stock Universe" })).toBeVisible();
```

- [ ] **Step 2: Run E2E to verify it fails before styling/page work is complete**

Run: `npm run test:e2e`

Expected: FAIL before the new page is implemented, PASS after Task 5 and this
task are complete.

- [ ] **Step 3: Update CSS tokens**

Use:

```css
:root {
  --background: #f6f8fb;
  --surface: #ffffff;
  --surface-muted: #f1f5f9;
  --border: #d9e2ec;
  --text: #101828;
  --muted: #5f6f85;
  --primary: #2563eb;
  --primary-dark: #1d4ed8;
  --success: #0f766e;
  --warning: #b45309;
  --danger: #b42318;
  --radius: 8px;
}
```

- [ ] **Step 4: Style app shell**

Implement a three-column desktop grid:

```css
.workspace {
  display: grid;
  grid-template-columns: minmax(280px, 340px) minmax(0, 1fr) minmax(280px, 320px);
  gap: 20px;
  align-items: start;
}
```

Add responsive collapse under `960px`.

- [ ] **Step 5: Style panels, tabs, cards, table, focus states**

Keep radii at `8px`, avoid nested card styling, and keep table rows dense enough
for scanning.

- [ ] **Step 6: Run unit and build checks**

Run:

```bash
npm test
npm run build
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/app/globals.css tests/e2e/screener.spec.ts
git commit -m "feat: style beginner screener workspace"
```

---

### Task 7: Verify End-To-End Beginner Workflow

**Files:**
- Modify: `tests/e2e/screener.spec.ts`

- [ ] **Step 1: Extend E2E test**

Assert:

```ts
await expect(page.getByText("P/E Ratio")).toBeVisible();
await expect(page.getByText("Lower is not always better")).toBeVisible();
await expect(page.getByText("filtered out")).toBeVisible();
await page.getByRole("tab", { name: "Stock Universe" }).click();
await expect(page.getByRole("heading", { name: "Stock Universe" })).toBeVisible();
await page.getByRole("tab", { name: "Results" }).click();
await page.getByText("AAPL").click();
await expect(page.getByText("Why Apple Inc. matched")).toBeVisible();
```

- [ ] **Step 2: Run full verification**

Run:

```bash
npm test
npm run build
npm run test:e2e
```

Expected: all PASS.

- [ ] **Step 3: Browser screenshot review**

Start the app:

```bash
npm run build
npm run start -- -p 3010
```

Capture desktop screenshot with Chrome or Playwright. Compare against:

- `docs/superpowers/specs/assets/2026-05-04-beginner-ui-concept.png`

Check:

- App shell structure.
- Beginner filter cards.
- Universe summary.
- Results table with stable identity columns.
- Learning panel.
- No overlapping text at desktop width.

- [ ] **Step 4: Stop local server**

Stop the `next start -p 3010` process after verification.

- [ ] **Step 5: Commit E2E verification updates**

```bash
git add tests/e2e/screener.spec.ts
git commit -m "test: cover beginner screener workflow"
```

---

## Implementation Notes

- Do not add AI review, advice language, alerts, portfolio tracking, or broker
  integration.
- Keep export as CSV for the current shortlist.
- Keep the current provider/data architecture unchanged.
- Keep dynamic metric columns, but always show Market, Exchange, Code, Company,
  and Currency.
- Prefer small components over expanding `src/app/page.tsx` into a large mixed
  layout file.
- Use deterministic explanations only. "Why matched" should explain filters, not
  interpret investment quality.

## Self-Review

Spec coverage:

- Beginner orientation: Tasks 3, 5, and 6.
- Dynamic columns rationale: Task 4.
- Visible stock universe and counts: Tasks 2, 3, and 5.
- Metric learning: Tasks 1, 3, and 5.
- Data trust model: Tasks 3, 5, and 6.
- Export remains current shortlist: Task 5 and existing `ExportButton`.
- Accessibility and responsive layout: Task 6.
- E2E workflow verification: Task 7.

No AI review or investment advice is included in this plan.

