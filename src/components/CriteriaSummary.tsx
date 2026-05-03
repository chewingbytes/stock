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
            {filter.metricKey}: {filter.min ?? "no min"} to{" "}
            {filter.max ?? "no max"}
          </li>
        ))}
      </ul>
    </section>
  );
}
