import type { RangeFilter } from "../domain/types";

const availableFilters: { metricKey: RangeFilter["metricKey"]; label: string }[] =
  [
    { metricKey: "market_cap", label: "Market Cap" },
    { metricKey: "revenue_growth_rate", label: "Revenue Growth" },
    { metricKey: "profit_growth_rate", label: "Profit Growth" },
    { metricKey: "dividend_yield", label: "Dividend Yield" },
    { metricKey: "dividend_growth_rate", label: "Dividend Growth" },
    { metricKey: "pe_ratio", label: "P/E" },
    { metricKey: "pb_ratio", label: "P/B" },
    { metricKey: "debt_to_equity_ratio", label: "Debt To Equity" },
    { metricKey: "close", label: "Close Price" },
  ];

export function FilterBuilder({
  filters,
  onChange,
}: {
  filters: RangeFilter[];
  onChange: (filters: RangeFilter[]) => void;
}) {
  function update(index: number, patch: Partial<RangeFilter>) {
    onChange(
      filters.map((filter, itemIndex) =>
        itemIndex === index ? { ...filter, ...patch } : filter,
      ),
    );
  }

  function addFilter() {
    onChange([...filters, { metricKey: "pe_ratio", min: null, max: null }]);
  }

  function removeFilter(index: number) {
    onChange(filters.filter((_, itemIndex) => itemIndex !== index));
  }

  return (
    <section className="panel">
      <div className="panel-title">
        <h2>Filters</h2>
        <button type="button" onClick={addFilter}>
          Add Filter
        </button>
      </div>
      <div className="filter-list">
        {filters.map((filter, index) => (
          <div className="filter-row" key={`${filter.metricKey}-${index}`}>
            <select
              aria-label={`Metric ${index + 1}`}
              value={filter.metricKey}
              onChange={(event) =>
                update(index, {
                  metricKey: event.target.value as RangeFilter["metricKey"],
                })
              }
            >
              {availableFilters.map((option) => (
                <option key={option.metricKey} value={option.metricKey}>
                  {option.label}
                </option>
              ))}
            </select>
            <input
              aria-label={`Minimum ${index + 1}`}
              type="number"
              placeholder="Min"
              value={filter.min ?? ""}
              onChange={(event) =>
                update(index, {
                  min: event.target.value === "" ? null : Number(event.target.value),
                })
              }
            />
            <input
              aria-label={`Maximum ${index + 1}`}
              type="number"
              placeholder="Max"
              value={filter.max ?? ""}
              onChange={(event) =>
                update(index, {
                  max: event.target.value === "" ? null : Number(event.target.value),
                })
              }
            />
            <button type="button" onClick={() => removeFilter(index)}>
              Remove
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
