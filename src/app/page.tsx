"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AccountMenu } from "../components/AccountMenu";
import { CriteriaSummary } from "../components/CriteriaSummary";
import { ExportButton } from "../components/ExportButton";
import { FilterBuilder } from "../components/FilterBuilder";
import { GlossaryPanel } from "../components/GlossaryPanel";
import { MarketSelector } from "../components/MarketSelector";
import { ResultsTable } from "../components/ResultsTable";
import { RowExplanation } from "../components/RowExplanation";
import { ScreenTabs, type ScreenTab } from "../components/ScreenTabs";
import { UniverseSummary } from "../components/UniverseSummary";
import { buildDisplayMetricKeys } from "../domain/metricDefinitions";
import type { RangeFilter } from "../domain/types";

type ScreenResult = {
  criteria: RangeFilter[];
  universeTotal: number;
  filteredOut: number;
  page: number;
  pageSize: number;
  rows: Array<{
    marketCode: string;
    exchange: string;
    stockCode: string;
    stockName: string;
    currency: string;
    metrics: Record<
      string,
      {
        value: number | null;
        dataQuality: string;
        reason: string | null;
        currency: string | null;
      }
    >;
  }>;
  total: number;
  lastUpdated: string | null;
  dataSource: string | null;
};

export default function HomePage() {
  const [markets, setMarkets] = useState(["US", "SGX"]);
  const [filters, setFilters] = useState<RangeFilter[]>([
    { metricKey: "pe_ratio", min: 1, max: 40 },
  ]);
  const [result, setResult] = useState<ScreenResult | null>(null);
  const [universeResult, setUniverseResult] = useState<ScreenResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [activeTab, setActiveTab] = useState<ScreenTab>("results");
  const [selectedRowKey, setSelectedRowKey] = useState<string | null>(null);
  const [lastScreenSignature, setLastScreenSignature] = useState<string | null>(
    null,
  );
  const initialScreenRan = useRef(false);

  useEffect(() => {
    setReady(true);
  }, []);

  const metricKeys = useMemo(
    () => filters.map((filter) => filter.metricKey),
    [filters],
  );

  // Core headline columns are always shown, with any extra filtered metrics
  // appended, so results stay informative no matter which filters are active.
  const displayMetricKeys = useMemo(
    () => buildDisplayMetricKeys(metricKeys),
    [metricKeys],
  );

  const screenSignature = useMemo(
    () => JSON.stringify({ filters, markets }),
    [filters, markets],
  );

  const filtersChangedSinceScreen =
    result !== null &&
    lastScreenSignature !== null &&
    screenSignature !== lastScreenSignature;

  const selectedRow = useMemo(() => {
    if (!selectedRowKey || !result) {
      return null;
    }

    return (
      result.rows.find(
        (row) => `${row.marketCode}-${row.stockCode}` === selectedRowKey,
      ) ?? null
    );
  }, [result, selectedRowKey]);

  const fetchScreen = useCallback(
    async (screenFilters: RangeFilter[]) => {
      const response = await fetch("/api/screen", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          markets,
          filters: screenFilters,
          sort: { metricKey: "stock_code", direction: "asc" },
          page: 1,
          pageSize: 50,
        }),
      });

      if (!response.ok) {
        throw new Error("Screen failed.");
      }

      return (await response.json()) as ScreenResult;
    },
    [markets],
  );

  const runScreen = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [screenResult, stockUniverse] = await Promise.all([
        fetchScreen(filters),
        fetchScreen([]),
      ]);

      setResult(screenResult);
      setUniverseResult(stockUniverse);
      setLastScreenSignature(screenSignature);
    } catch {
      setError("Screen failed. Check filter values and try again.");
    } finally {
      setLoading(false);
    }
  }, [fetchScreen, filters, screenSignature]);

  useEffect(() => {
    if (!ready || initialScreenRan.current) {
      return;
    }

    initialScreenRan.current = true;
    void runScreen();
  }, [ready, runScreen]);

  return (
    <>
      <div className="app-bar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            S
          </span>
          <span>
            <span className="brand-name">Screener</span>
            <span className="brand-tag">Equity research</span>
          </span>
        </div>
        <div className="app-bar-actions">
          <ExportButton markets={markets} filters={filters} />
          <AccountMenu />
        </div>
      </div>

      <main className="app-shell">
        <header className="hero">
          <h1>Stock Screener</h1>
          <p className="hero-lead">
            Filter end-of-day US and Singapore stocks against fundamental
            criteria to build a shortlist of research candidates.
          </p>
        </header>

        <div className="workspace">
        <aside className="sidebar">
          <MarketSelector selectedMarkets={markets} onChange={setMarkets} />
          <FilterBuilder filters={filters} onChange={setFilters} />
          <button
            className="primary"
            type="button"
            onClick={runScreen}
            disabled={!ready || loading || markets.length === 0}
          >
            {loading ? "Running..." : "Run Screen"}
          </button>
          {error ? <p className="error">{error}</p> : null}
        </aside>

        <section className="content">
          <UniverseSummary
            filteredOut={result?.filteredOut ?? 0}
            matched={result?.total ?? 0}
            markets={markets}
            universeTotal={result?.universeTotal ?? 0}
            lastUpdated={result?.lastUpdated ?? null}
            dataSource={result?.dataSource ?? null}
          />
          <ScreenTabs activeTab={activeTab} onChange={setActiveTab} />
          <CriteriaSummary markets={markets} filters={filters} />
          <p className="disclaimer">
            <span aria-hidden="true">ⓘ</span>
            <span>
              Screening results are research candidates, not financial advice.
              Data may be delayed, missing, or imported from CSV.
            </span>
          </p>
          {filtersChangedSinceScreen && !loading ? (
            <p className="pending-screen" role="status">
              <span aria-hidden="true">⟳</span>
              Filters changed. Run screen to update results.
            </p>
          ) : null}
          {activeTab === "learn" ? (
            <GlossaryPanel />
          ) : (
            <ResultsTable
              emptyMessage={
                loading
                  ? "Loading matching stocks..."
                  : activeTab === "universe"
                    ? "No stocks are available for the selected markets."
                    : "No stocks matched these ranges. Try widening one filter."
              }
              metricKeys={
                activeTab === "universe"
                  ? buildDisplayMetricKeys([])
                  : displayMetricKeys
              }
              filteredKeys={activeTab === "universe" ? [] : metricKeys}
              onSelectRow={setSelectedRowKey}
              rows={
                activeTab === "universe"
                  ? (universeResult?.rows ?? [])
                  : (result?.rows ?? [])
              }
              selectedRowKey={selectedRowKey}
              totalCount={
                activeTab === "universe" ? universeResult?.total : result?.total
              }
              title={activeTab === "universe" ? "Stock Universe" : "Results"}
            />
          )}
          <RowExplanation
            filters={filters}
            stockName={selectedRow?.stockName ?? null}
          />
        </section>
        </div>
      </main>
    </>
  );
}
