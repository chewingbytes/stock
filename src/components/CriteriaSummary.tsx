import { formatMetricLabel } from "../domain/metricDefinitions";
import type { RangeFilter } from "../domain/types";

export function CriteriaSummary({
  markets,
  filters,
}: {
  markets: string[];
  filters: RangeFilter[];
}) {
  return (
    <section className="panel criteria-summary">
      <h2>Selected Criteria</h2>
      <div className="criteria-markets">
        {markets.length > 0 ? (
          markets.map((market) => (
            <span className="market-chip" key={market}>
              {market}
            </span>
          ))
        ) : (
          <span className="market-chip">No markets</span>
        )}
      </div>
      <ul>
        {filters.length === 0 ? (
          <li>
            <strong>No filters</strong>
            <span className="criteria-range">Whole universe</span>
          </li>
        ) : (
          filters.map((filter, index) => (
            <li key={`${filter.metricKey}-${index}`}>
              <strong>{formatMetricLabel(filter.metricKey)}</strong>
              <span className="criteria-range">
                {filter.min ?? "Any"} – {filter.max ?? "Any"}
              </span>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
