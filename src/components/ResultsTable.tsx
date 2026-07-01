import { DataQualityBadge } from "./DataQualityBadge";
import { formatMetricLabel } from "../domain/metricDefinitions";
import type { MetricKey } from "../domain/types";

type ScreenMetricValue = {
  value: number | null;
  dataQuality: string;
  reason: string | null;
  currency: string | null;
};

type ScreenRow = {
  marketCode: string;
  exchange: string;
  stockCode: string;
  stockName: string;
  currency: string;
  metrics: Record<string, ScreenMetricValue>;
};

export function ResultsTable({
  rows,
  metricKeys,
  totalCount,
  selectedRowKey = null,
  onSelectRow,
  emptyMessage = "Run a screen to see matching stocks.",
  title = "Results",
}: {
  rows: ScreenRow[];
  metricKeys: MetricKey[];
  totalCount?: number;
  selectedRowKey?: string | null;
  onSelectRow?: (rowKey: string) => void;
  emptyMessage?: string;
  title?: string;
}) {
  return (
    <section className="panel table-panel">
      <div className="table-panel-title">
        <h2>{title}</h2>
        {totalCount !== undefined ? (
          <span className="result-count">
            {totalCount.toLocaleString()}{" "}
            {totalCount === 1 ? "result" : "results"}
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
              {metricKeys.map((key) => (
                <th key={key}>{formatMetricLabel(key)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="empty-cell" colSpan={5 + metricKeys.length}>
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const rowKey = `${row.marketCode}-${row.stockCode}`;

                return (
                  <tr
                    className={selectedRowKey === rowKey ? "selected" : ""}
                    key={rowKey}
                    onClick={() => onSelectRow?.(rowKey)}
                  >
                    <td>{row.marketCode}</td>
                    <td>{row.exchange}</td>
                    <td>
                      <span className="stock-code">{row.stockCode}</span>
                    </td>
                    <td>{row.stockName}</td>
                    <td>{row.currency}</td>
                    {metricKeys.map((key) => {
                      const metric = row.metrics[key];

                      return (
                        <td key={key}>
                          {metric?.value === null || metric?.value === undefined
                            ? "N/A"
                            : metric.value.toLocaleString()}
                          {metric ? (
                            <DataQualityBadge status={metric.dataQuality} />
                          ) : (
                            <DataQualityBadge status="missing" />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
