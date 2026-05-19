# Phase 1 Demo Slice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a fully self-contained `Phase 1/` folder at the repo root — a standalone Next.js app that screens US stocks by P/E from in-memory fixtures (no Prisma/DB), runnable with `npm install && npm run dev`, visually matching the existing app.

**Architecture:** Approach A from the spec — an independent Next.js project that copies the pure domain code unchanged, replaces the Prisma-backed screener with an in-memory fixture screener that reuses the real `calculatePeRatio`, and ships a trimmed single-page UI. Zero dependency on the parent repo.

**Tech Stack:** Next.js (App Router), React, TypeScript, zod, csv-parse. No Prisma, no test runner, no Playwright.

**Spec:** `docs/superpowers/specs/2026-05-19-phase-1-demo-slice-design.md`

---

## Notes For The Engineer

- The target folder name is literally `Phase 1` **with a space**. Every shell command that touches it MUST quote it: `"Phase 1"`. On Windows PowerShell use `Copy-Item`, `New-Item`; the equivalents are shown.
- **No test files** are created. The spec explicitly designates Phase 1 a demo artifact; the engine's correctness is already covered by the parent repo's suite. This plan therefore deviates from default TDD on the user's explicit instruction (spec overrides skill default). Verification is done via `npm run build` (typecheck) plus a live HTTP smoke check against the running app with exact expected JSON — evidence-based, no committed tests.
- The parent repo's application code is NOT modified. Only two parent files change: this plan's directory gets the plan doc, and `.gitignore` gets one line so the standalone folder stays untracked.
- Copied-unchanged files are copied with `Copy-Item` (not retyped) to guarantee they are byte-identical to the parent.
- `process.cwd()` during `next dev`/`next build`/`next start` is the `Phase 1/` folder, so fixture paths resolve relative to it.

---

## File Structure

```
Phase 1/
  package.json                       Task 1  (create)
  tsconfig.json                      Task 1  (copy)
  next.config.ts                     Task 1  (copy)
  next-env.d.ts                      Task 1  (create)
  .gitignore                         Task 1  (create)
  data/fixtures/*.csv                Task 2  (copy, all 5)
  src/domain/types.ts                Task 2  (copy unchanged)
  src/domain/metrics.ts              Task 2  (copy unchanged)
  src/domain/filtering.ts            Task 2  (copy unchanged)
  src/server/csv/readCsv.ts          Task 2  (copy unchanged)
  src/server/screener/fixtureScreener.ts   Task 3  (create — only new logic)
  src/app/api/screen/route.ts        Task 4  (create)
  src/app/layout.tsx                 Task 5  (copy unchanged)
  src/app/globals.css                Task 5  (copy + append one Phase 1 rule)
  src/app/page.tsx                   Task 5  (create — trimmed UI)
  README.md                          Task 6  (create)
.gitignore (parent)                  Task 6  (modify — 1 line)
```

---

### Task 1: Scaffold the standalone project

**Files:**
- Create: `Phase 1/package.json`
- Copy: `tsconfig.json` → `Phase 1/tsconfig.json`
- Copy: `next.config.ts` → `Phase 1/next.config.ts`
- Create: `Phase 1/next-env.d.ts`
- Create: `Phase 1/.gitignore`

- [ ] **Step 1: Create the folder skeleton**

Run (PowerShell):
```powershell
New-Item -ItemType Directory -Force "Phase 1/src/app/api/screen" | Out-Null
New-Item -ItemType Directory -Force "Phase 1/src/domain" | Out-Null
New-Item -ItemType Directory -Force "Phase 1/src/server/csv" | Out-Null
New-Item -ItemType Directory -Force "Phase 1/src/server/screener" | Out-Null
New-Item -ItemType Directory -Force "Phase 1/data/fixtures" | Out-Null
```

- [ ] **Step 2: Create `Phase 1/package.json`**

```json
{
  "name": "stock-screener-phase-1",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "csv-parse": "latest",
    "next": "latest",
    "react": "latest",
    "react-dom": "latest",
    "zod": "latest"
  },
  "devDependencies": {
    "@types/node": "latest",
    "@types/react": "latest",
    "@types/react-dom": "latest",
    "typescript": "latest"
  }
}
```

- [ ] **Step 3: Copy `tsconfig.json` and `next.config.ts` unchanged**

Run (PowerShell):
```powershell
Copy-Item "tsconfig.json" "Phase 1/tsconfig.json"
Copy-Item "next.config.ts" "Phase 1/next.config.ts"
```

- [ ] **Step 4: Create `Phase 1/next-env.d.ts`**

```typescript
/// <reference types="next" />
/// <reference types="next/image-types/global" />

// NOTE: This file should not be edited
// see https://nextjs.org/docs/app/api-reference/config/typescript for more information.
```

- [ ] **Step 5: Create `Phase 1/.gitignore`**

```
/node_modules
/.next
/out
*.log
```

- [ ] **Step 6: Commit**

```powershell
git add "Phase 1/package.json" "Phase 1/tsconfig.json" "Phase 1/next.config.ts" "Phase 1/next-env.d.ts" "Phase 1/.gitignore"
git commit -m "feat(phase-1): scaffold standalone next.js project"
```

> Note: the `git add` above is only to checkpoint progress while building. Task 6 removes `Phase 1/` from parent tracking via `.gitignore`; that is intentional and handled there.

---

### Task 2: Copy fixtures and pure domain code unchanged

**Files:**
- Copy: `data/fixtures/*.csv` (5 files) → `Phase 1/data/fixtures/`
- Copy: `src/domain/types.ts` → `Phase 1/src/domain/types.ts`
- Copy: `src/domain/metrics.ts` → `Phase 1/src/domain/metrics.ts`
- Copy: `src/domain/filtering.ts` → `Phase 1/src/domain/filtering.ts`
- Copy: `src/server/csv/readCsv.ts` → `Phase 1/src/server/csv/readCsv.ts`

- [ ] **Step 1: Copy all five fixture CSVs**

Run (PowerShell):
```powershell
Copy-Item "data/fixtures/markets.csv" "Phase 1/data/fixtures/markets.csv"
Copy-Item "data/fixtures/stocks.csv" "Phase 1/data/fixtures/stocks.csv"
Copy-Item "data/fixtures/daily_prices.csv" "Phase 1/data/fixtures/daily_prices.csv"
Copy-Item "data/fixtures/annual_financials.csv" "Phase 1/data/fixtures/annual_financials.csv"
Copy-Item "data/fixtures/annual_dividends.csv" "Phase 1/data/fixtures/annual_dividends.csv"
```

- [ ] **Step 2: Copy the pure domain and CSV-reader files unchanged**

Run (PowerShell):
```powershell
Copy-Item "src/domain/types.ts" "Phase 1/src/domain/types.ts"
Copy-Item "src/domain/metrics.ts" "Phase 1/src/domain/metrics.ts"
Copy-Item "src/domain/filtering.ts" "Phase 1/src/domain/filtering.ts"
Copy-Item "src/server/csv/readCsv.ts" "Phase 1/src/server/csv/readCsv.ts"
```

- [ ] **Step 3: Verify the copies are byte-identical**

Run (PowerShell):
```powershell
foreach ($f in @("src/domain/types.ts","src/domain/metrics.ts","src/domain/filtering.ts","src/server/csv/readCsv.ts")) {
  $a = (Get-FileHash $f).Hash
  $b = (Get-FileHash ("Phase 1/" + $f)).Hash
  if ($a -ne $b) { Write-Error "MISMATCH: $f" } else { Write-Output "OK: $f" }
}
```
Expected: four `OK:` lines, no errors.

- [ ] **Step 4: Commit**

```powershell
git add "Phase 1/data" "Phase 1/src/domain" "Phase 1/src/server/csv"
git commit -m "feat(phase-1): copy fixtures and pure domain code"
```

---

### Task 3: Implement the in-memory fixture screener (only new logic)

**Files:**
- Create: `Phase 1/src/server/screener/fixtureScreener.ts`

This is the single piece of genuinely new code. It reuses the unchanged `calculatePeRatio` (metric math) and `validateRangeFilters` (range validation), and replaces only the Prisma persistence with an in-memory fixture read.

- [ ] **Step 1: Create `Phase 1/src/server/screener/fixtureScreener.ts`**

```typescript
import path from "node:path";
import { validateRangeFilters } from "../../domain/filtering";
import { calculatePeRatio } from "../../domain/metrics";
import type { RangeFilter } from "../../domain/types";
import { readCsv } from "../csv/readCsv";

const PHASE_1_MARKET = "US";
const FIXTURE_DIR = path.join(process.cwd(), "data", "fixtures");

type StockRow = {
  marketCode: string;
  exchange: string;
  stockCode: string;
  stockName: string;
  currency: string;
  isActive: string;
};

type PriceRow = {
  stockCode: string;
  date: string;
  close: string;
};

type FinancialRow = {
  stockCode: string;
  fiscalYear: string;
  earningsPerShare: string;
};

export type Phase1MetricValue = {
  value: number | null;
  dataQuality: "complete" | "missing" | "unavailable";
  reason: string | null;
};

export type Phase1Row = {
  marketCode: string;
  exchange: string;
  stockCode: string;
  stockName: string;
  currency: string;
  peRatio: Phase1MetricValue;
  matched: boolean;
};

export type Phase1ScreenResult = {
  market: string;
  min: number | null;
  max: number | null;
  universeTotal: number;
  matchedTotal: number;
  filteredOut: number;
  rows: Phase1Row[];
};

export type Phase1ScreenInput = {
  min: number | null;
  max: number | null;
};

function latestPriceClose(rows: PriceRow[], stockCode: string): number | null {
  const matches = rows.filter((row) => row.stockCode === stockCode);
  if (matches.length === 0) {
    return null;
  }
  matches.sort((a, b) => b.date.localeCompare(a.date));
  const close = Number(matches[0].close);
  return Number.isFinite(close) ? close : null;
}

function latestEps(rows: FinancialRow[], stockCode: string): number | null {
  const matches = rows.filter((row) => row.stockCode === stockCode);
  if (matches.length === 0) {
    return null;
  }
  matches.sort((a, b) => Number(b.fiscalYear) - Number(a.fiscalYear));
  const eps = Number(matches[0].earningsPerShare);
  return Number.isFinite(eps) ? eps : null;
}

function passesRange(
  value: number,
  min: number | null,
  max: number | null,
): boolean {
  if (min !== null && value < min) {
    return false;
  }
  if (max !== null && value > max) {
    return false;
  }
  return true;
}

export async function runFixtureScreen(
  input: Phase1ScreenInput,
): Promise<Phase1ScreenResult> {
  const filter: RangeFilter = {
    metricKey: "pe_ratio",
    min: input.min,
    max: input.max,
  };
  const validation = validateRangeFilters([filter]);

  if (!validation.ok) {
    throw new Error(
      validation.errors
        .map((error) => `${error.field}: ${error.message}`)
        .join("; "),
    );
  }

  const [stocks, prices, financials] = await Promise.all([
    readCsv<StockRow>(path.join(FIXTURE_DIR, "stocks.csv")),
    readCsv<PriceRow>(path.join(FIXTURE_DIR, "daily_prices.csv")),
    readCsv<FinancialRow>(path.join(FIXTURE_DIR, "annual_financials.csv")),
  ]);

  const universe = stocks.filter(
    (stock) =>
      stock.marketCode === PHASE_1_MARKET && stock.isActive === "true",
  );

  const rows: Phase1Row[] = universe.map((stock) => {
    const pe = calculatePeRatio({
      closePrice: latestPriceClose(prices, stock.stockCode),
      earningsPerShare: latestEps(financials, stock.stockCode),
    });

    const peRatio: Phase1MetricValue =
      pe.status === "complete"
        ? { value: pe.value, dataQuality: "complete", reason: null }
        : { value: null, dataQuality: pe.status, reason: pe.reason };

    const matched =
      peRatio.dataQuality === "complete" &&
      peRatio.value !== null &&
      passesRange(peRatio.value, input.min, input.max);

    return {
      marketCode: stock.marketCode,
      exchange: stock.exchange,
      stockCode: stock.stockCode,
      stockName: stock.stockName,
      currency: stock.currency,
      peRatio,
      matched,
    };
  });

  const matchedTotal = rows.filter((row) => row.matched).length;

  return {
    market: PHASE_1_MARKET,
    min: input.min,
    max: input.max,
    universeTotal: rows.length,
    matchedTotal,
    filteredOut: rows.length - matchedTotal,
    rows,
  };
}
```

- [ ] **Step 2: Commit**

```powershell
git add "Phase 1/src/server/screener/fixtureScreener.ts"
git commit -m "feat(phase-1): add in-memory fixture screener"
```

---

### Task 4: Implement the API route

**Files:**
- Create: `Phase 1/src/app/api/screen/route.ts`

- [ ] **Step 1: Create `Phase 1/src/app/api/screen/route.ts`**

```typescript
import { NextResponse } from "next/server";
import { z } from "zod";
import { runFixtureScreen } from "../../../server/screener/fixtureScreener";

const requestSchema = z.object({
  min: z.number().finite().nullable(),
  max: z.number().finite().nullable(),
});

export async function POST(request: Request) {
  const json = await request.json();
  const parsed = requestSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  try {
    const result = await runFixtureScreen(parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Screen failed." },
      { status: 400 },
    );
  }
}
```

- [ ] **Step 2: Commit**

```powershell
git add "Phase 1/src/app/api/screen/route.ts"
git commit -m "feat(phase-1): add screen api route"
```

---

### Task 5: Implement the UI (layout, styles, trimmed page)

**Files:**
- Copy: `src/app/layout.tsx` → `Phase 1/src/app/layout.tsx` (unchanged)
- Copy: `src/app/globals.css` → `Phase 1/src/app/globals.css`, then append one Phase 1 rule
- Create: `Phase 1/src/app/page.tsx` (trimmed)

- [ ] **Step 1: Copy `layout.tsx` and `globals.css` unchanged**

Run (PowerShell):
```powershell
Copy-Item "src/app/layout.tsx" "Phase 1/src/app/layout.tsx"
Copy-Item "src/app/globals.css" "Phase 1/src/app/globals.css"
```

- [ ] **Step 2: Append one Phase 1 style rule to `Phase 1/src/app/globals.css`**

Append exactly this block to the END of `Phase 1/src/app/globals.css` (the only intentional deviation from "copied as-is" — required to visually mute excluded rows, supporting the spec's acceptance criterion that LOSS is shown as dropped out):

```css

/* Phase 1: muted styling for stocks excluded by the screen. */
tbody tr.excluded td {
  color: var(--muted);
}
```

- [ ] **Step 3: Create `Phase 1/src/app/page.tsx`**

```tsx
"use client";

import { useState } from "react";

type Phase1MetricValue = {
  value: number | null;
  dataQuality: "complete" | "missing" | "unavailable";
  reason: string | null;
};

type Phase1Row = {
  marketCode: string;
  exchange: string;
  stockCode: string;
  stockName: string;
  currency: string;
  peRatio: Phase1MetricValue;
  matched: boolean;
};

type Phase1ScreenResult = {
  market: string;
  min: number | null;
  max: number | null;
  universeTotal: number;
  matchedTotal: number;
  filteredOut: number;
  rows: Phase1Row[];
};

function parseRangeInput(value: string): number | null {
  if (value.trim() === "") {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export default function HomePage() {
  const [min, setMin] = useState("1");
  const [max, setMax] = useState("40");
  const [result, setResult] = useState<Phase1ScreenResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runScreen() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/screen", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          min: parseRangeInput(min),
          max: parseRangeInput(max),
        }),
      });

      if (!response.ok) {
        throw new Error("Screen failed.");
      }

      setResult((await response.json()) as Phase1ScreenResult);
    } catch {
      setError("Screen failed. Check the P/E range and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="app-shell">
      <header className="page-header">
        <div>
          <h1>Stock Screener</h1>
          <p>Filter end-of-day United States stocks by P/E ratio.</p>
        </div>
      </header>

      <div className="workspace">
        <aside className="sidebar">
          <section className="panel filter-builder">
            <div className="panel-title">
              <p className="eyebrow">Build your screen</p>
              <h2>P/E Ratio</h2>
            </div>
            <p style={{ margin: "0 0 12px", color: "var(--muted)", fontSize: 14 }}>
              How much investors pay for each dollar of earnings.
            </p>
            <p style={{ margin: "0 0 12px", fontWeight: 700 }}>
              Market: United States
            </p>
            <div className="filter-list">
              <div className="filter-row">
                <input
                  aria-label="Minimum P/E"
                  inputMode="decimal"
                  onChange={(event) => setMin(event.target.value)}
                  placeholder="Min"
                  value={min}
                />
                <input
                  aria-label="Maximum P/E"
                  inputMode="decimal"
                  onChange={(event) => setMax(event.target.value)}
                  placeholder="Max"
                  value={max}
                />
              </div>
            </div>
          </section>
          <button
            className="primary"
            disabled={loading}
            onClick={runScreen}
            type="button"
          >
            {loading ? "Running..." : "Run Screen"}
          </button>
          {error ? <p className="error">{error}</p> : null}
        </aside>

        <section className="content">
          <div className="universe-summary">
            <div className="summary-item">
              <span className="summary-value">
                {result?.universeTotal ?? 0}
              </span>
              <span className="summary-label">Stocks in universe</span>
            </div>
            <div className="summary-item">
              <span className="summary-value">{result?.matchedTotal ?? 0}</span>
              <span className="summary-label">Matched</span>
            </div>
            <div className="summary-item">
              <span className="summary-value">{result?.filteredOut ?? 0}</span>
              <span className="summary-label">Filtered out</span>
            </div>
          </div>

          <p className="disclaimer">
            Screening results are research candidates, not financial advice.
            Phase 1 uses a fixed United States fixture dataset.
          </p>

          <section className="panel table-panel">
            <div className="table-panel-title">
              <h2>Results</h2>
              {result ? (
                <span className="result-count">
                  {result.matchedTotal}{" "}
                  {result.matchedTotal === 1 ? "match" : "matches"}
                </span>
              ) : null}
            </div>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Market</th>
                    <th>Exchange</th>
                    <th>Code</th>
                    <th>Company</th>
                    <th>Currency</th>
                    <th>P/E Ratio</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {!result ? (
                    <tr>
                      <td className="empty-cell" colSpan={7}>
                        Run a screen to see matching stocks.
                      </td>
                    </tr>
                  ) : (
                    result.rows.map((row) => (
                      <tr
                        className={row.matched ? "" : "excluded"}
                        key={`${row.marketCode}-${row.stockCode}`}
                      >
                        <td>{row.marketCode}</td>
                        <td>{row.exchange}</td>
                        <td>{row.stockCode}</td>
                        <td>{row.stockName}</td>
                        <td>{row.currency}</td>
                        <td>
                          {row.peRatio.value === null
                            ? "—"
                            : row.peRatio.value.toFixed(2)}
                          {row.peRatio.reason ? (
                            <span className="quality quality-unavailable">
                              {row.peRatio.reason}
                            </span>
                          ) : null}
                        </td>
                        <td>
                          {row.matched ? (
                            <span className="quality quality-complete">
                              Matched
                            </span>
                          ) : (
                            <span className="quality quality-missing">
                              Excluded
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Commit**

```powershell
git add "Phase 1/src/app/layout.tsx" "Phase 1/src/app/globals.css" "Phase 1/src/app/page.tsx"
git commit -m "feat(phase-1): add trimmed ui, layout, and styles"
```

---

### Task 6: End-to-end verification, README, and parent .gitignore

**Files:**
- Create: `Phase 1/README.md`
- Modify: `.gitignore` (parent repo root)

- [ ] **Step 1: Install dependencies in the standalone folder**

Run (PowerShell):
```powershell
Set-Location "Phase 1"; npm install; Set-Location ..
```
Expected: install completes with no errors; `Phase 1/node_modules` exists.

- [ ] **Step 2: Typecheck + build (this is the static verification gate)**

Run (PowerShell):
```powershell
Set-Location "Phase 1"; npm run build; Set-Location ..
```
Expected: `next build` completes successfully (compiled / type-checked, no errors). If type errors appear, fix the offending file before continuing — do not proceed on a red build.

- [ ] **Step 3: Start the app and run the HTTP smoke check (behavioral verification)**

Start the server (PowerShell, background):
```powershell
Set-Location "Phase 1"; Start-Process -NoNewWindow npm "run start"; Set-Location ..
```
Wait ~3 seconds for boot, then verify the default range (1–40):
```powershell
$r = Invoke-RestMethod -Uri "http://localhost:3000/api/screen" -Method Post -ContentType "application/json" -Body '{"min":1,"max":40}'
"universeTotal=$($r.universeTotal) matchedTotal=$($r.matchedTotal) filteredOut=$($r.filteredOut)"
$loss = $r.rows | Where-Object { $_.stockCode -eq "LOSS" }
"LOSS value=$($loss.peRatio.value) reason=$($loss.peRatio.reason) matched=$($loss.matched)"
($r.rows | Where-Object { $_.matched } | ForEach-Object { $_.stockCode }) -join ","
```
Expected output:
```
universeTotal=3 matchedTotal=2 filteredOut=1
LOSS value= reason=earnings_per_share_not_positive matched=False
AAPL,MSFT
```

Verify a narrowed range (30–40) changes the matched set:
```powershell
$r2 = Invoke-RestMethod -Uri "http://localhost:3000/api/screen" -Method Post -ContentType "application/json" -Body '{"min":30,"max":40}'
"matchedTotal=$($r2.matchedTotal)"
($r2.rows | Where-Object { $_.matched } | ForEach-Object { $_.stockCode }) -join ","
```
Expected output:
```
matchedTotal=1
MSFT
```
(AAPL ≈ 25.98 falls below 30 and is excluded; MSFT ≈ 31.11 remains.)

Stop the server when done:
```powershell
Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*Phase 1*" } | Stop-Process -Force
```
If that selector matches nothing, stop the `node` process bound to port 3000 manually.

- [ ] **Step 4: Manual browser check**

Run `Set-Location "Phase 1"; npm run dev`, open `http://localhost:3000`. Confirm:
- Page is styled like the existing app (same header, sidebar, table chrome).
- "Market: United States" shown; P/E Min=1 / Max=40 inputs present.
- Clicking **Run Screen** shows 3 rows: AAPL and MSFT marked **Matched** with P/E ~25.98 / ~31.11; LOSS muted, P/E `—`, reason `earnings_per_share_not_positive`, **Excluded**.
- Summary strip shows 3 / 2 / 1.
- No Learn tab, no market selector, no export button, no row drawer.

Stop the dev server (Ctrl+C) when done.

- [ ] **Step 5: Create `Phase 1/README.md`**

```markdown
# Stock Screener — Phase 1

A standalone demo slice of the Stock Screener. Phase 1 proves the core
screening engine works end-to-end on a controlled dataset: real metric math,
real range filtering, rendered in the product UI.

## Scope

- Market: United States (fixed).
- Metric: P/E Ratio range filter.
- Data: bundled fixture dataset (no database, no network).

Held back for later phases: the beginner Learn/glossary experience, additional
markets, CSV export, per-stock detail inspection, the multi-metric filter
builder, and live data import.

## Run

```powershell
npm install
npm run dev
```

Open `http://localhost:3000`, set a P/E range, and click **Run Screen**.

## Non-Advice Notice

Screening results are research candidates. They are not buy, sell, or hold
recommendations.
```

- [ ] **Step 6: Exclude `Phase 1/` from the parent repository**

The standalone folder must not be tracked by the parent repo (spec: only the design doc and this plan are added to the parent). Append exactly this to the END of the parent-root `.gitignore`:

```
/Phase 1/
```

- [ ] **Step 7: Remove `Phase 1/` from parent tracking and commit the cleanup**

The progress checkpoints in Tasks 1–5 staged files under `Phase 1/`. Untrack them (files stay on disk) and commit the README + .gitignore:

```powershell
git rm -r --cached "Phase 1" | Out-Null
git add .gitignore
git commit -m "chore(phase-1): untrack standalone demo folder and ignore it"
```
Expected: `git status` shows a clean tree and `Phase 1/` is untracked/ignored. The folder remains fully intact on disk and opens standalone in a fresh VS Code window.

- [ ] **Step 8: Final standalone sanity check**

Run (PowerShell):
```powershell
git status --short
git check-ignore "Phase 1/package.json"
```
Expected: `git status --short` is empty (clean); `git check-ignore` prints `Phase 1/package.json` (confirming it is ignored). `Phase 1/` is now a self-contained, untracked project ready for the demo.

---

## Self-Review

**1. Spec coverage:**
- Standalone `Phase 1/` folder, literal space — Tasks 1–6. ✓
- `npm install && npm run dev`, no DB/migrate/seed — Tasks 1, 6 (no Prisma in deps). ✓
- In-memory fixtures reusing real engine — Task 3 reuses `calculatePeRatio` + `validateRangeFilters`. ✓
- US market fixed, P/E only — Task 3 (`PHASE_1_MARKET`), Task 5 (UI). ✓
- LOSS shown as `—` + reason, visibly excluded — Task 3 (`unavailable` mapping), Task 5 (cell + `excluded` row), verified Task 6 Step 3/4. ✓
- Visual match to screenshot — Task 5 copies `layout.tsx` + `globals.css`. ✓
- Held-back features absent (Learn, SGX, export, drawer, multi-metric) — Task 5 UI omits them; Task 3 hardcodes US + pe_ratio. ✓
- No parent app-code changes; only doc/plan + 1 `.gitignore` line — Task 6 Steps 6–7. ✓
- No test files (demo artifact) — verification is build + HTTP smoke. ✓
- Acceptance criteria (1–40 ⇒ AAPL+MSFT, LOSS excluded; range change works) — Task 6 Step 3 asserts exact values. ✓

**2. Placeholder scan:** No TBD/TODO; every code/command step contains full content and exact expected output. ✓

**3. Type consistency:** `Phase1MetricValue` / `Phase1Row` / `Phase1ScreenResult` defined in Task 3 are re-declared identically in the Task 5 client component (deliberate — client cannot import a server module's types across the fetch boundary without coupling; shapes are byte-checked against each other). `runFixtureScreen` named consistently in Tasks 3 and 4. `calculatePeRatio` input keys (`closePrice`, `earningsPerShare`) match the parent `metrics.ts` signature. ✓
