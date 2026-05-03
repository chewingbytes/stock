import { DataQualityBadge } from "./DataQualityBadge";

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
}: {
  rows: ScreenRow[];
  metricKeys: string[];
}) {
  return (
    <section className="panel table-panel">
      <h2>Results</h2>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Market</th>
              <th>Exchange</th>
              <th>Code</th>
              <th>Name</th>
              <th>Currency</th>
              {metricKeys.map((key) => (
                <th key={key}>{key}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.marketCode}-${row.stockCode}`}>
                <td>{row.marketCode}</td>
                <td>{row.exchange}</td>
                <td>{row.stockCode}</td>
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
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
