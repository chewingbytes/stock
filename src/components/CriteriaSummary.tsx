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
    <section className="panel">
      <h2>Selected Criteria</h2>
      <p>Markets: {markets.join(", ") || "None"}</p>
      <ul>
        {filters.map((filter, index) => (
          <li key={`${filter.metricKey}-${index}`}>
            {formatMetricLabel(filter.metricKey)}: {filter.min ?? "Any"} to{" "}
            {filter.max ?? "Any"}
          </li>
        ))}
      </ul>
    </section>
  );
}
