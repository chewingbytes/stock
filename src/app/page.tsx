"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CriteriaSummary } from "../components/CriteriaSummary";
import { ExportButton } from "../components/ExportButton";
import { FilterBuilder } from "../components/FilterBuilder";
import { MarketSelector } from "../components/MarketSelector";
import { MetricLearningPanel } from "../components/MetricLearningPanel";
import { ResultsTable } from "../components/ResultsTable";
import { RowExplanation } from "../components/RowExplanation";
import { ScreenTabs, type ScreenTab } from "../components/ScreenTabs";
import { UniverseSummary } from "../components/UniverseSummary";
import type { MetricKey, RangeFilter } from "../domain/types";

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
  const [selectedMetricKey, setSelectedMetricKey] =
    useState<MetricKey>("pe_ratio");
  const [selectedRowKey, setSelectedRowKey] = useState<string | null>(null);
  const initialScreenRan = useRef(false);

  useEffect(() => {
    setReady(true);
  }, []);

  const metricKeys = useMemo(
    () => filters.map((filter) => filter.metricKey),
    [filters],
  );

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
    } catch {
      setError("Screen failed. Check filter values and try again.");
    } finally {
      setLoading(false);
    }
  }, [fetchScreen, filters]);

  useEffect(() => {
    if (!ready || initialScreenRan.current) {
      return;
    }

    initialScreenRan.current = true;
    void runScreen();
  }, [ready, runScreen]);

  useEffect(() => {
    setSelectedMetricKey(filters[0]?.metricKey ?? "pe_ratio");
  }, [filters]);

  return (
    <main className="app-shell">
      <header className="page-header">
        <div>
          <h1>Stock Screener</h1>
          <p>Filter end-of-day US and Singapore stocks for further research.</p>
        </div>
        <ExportButton markets={markets} filters={filters} />
      </header>

      <div className="workspace">
        <aside className="market-column">
          <MarketSelector selectedMarkets={markets} onChange={setMarkets} />
        </aside>

        <aside className="sidebar">
          <FilterBuilder filters={filters} onChange={setFilters} />
          <MetricLearningPanel metricKey={selectedMetricKey} />
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
          />
          <ScreenTabs activeTab={activeTab} onChange={setActiveTab} />
          <CriteriaSummary markets={markets} filters={filters} />
          <p className="disclaimer">
            Screening results are research candidates, not financial advice.
            Data may be delayed, missing, or imported from CSV.
          </p>
          {activeTab === "learn" ? (
            <section className="panel learn-tab-panel">
              <h2>Learn</h2>
              <p>
                Choose a metric card to learn what it means before using it to
                narrow the stock universe.
              </p>
            </section>
          ) : (
            <ResultsTable
              emptyMessage={
                loading
                  ? "Loading matching stocks..."
                  : activeTab === "universe"
                    ? "No stocks are available for the selected markets."
                    : "No stocks matched these ranges. Try widening one filter."
              }
              metricKeys={activeTab === "universe" ? [] : metricKeys}
              onSelectRow={setSelectedRowKey}
              rows={
                activeTab === "universe"
                  ? (universeResult?.rows ?? [])
                  : (result?.rows ?? [])
              }
              selectedRowKey={selectedRowKey}
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
  );
}
