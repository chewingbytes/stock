import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FilterBuilder } from "./FilterBuilder";
import type { RangeFilter } from "../domain/types";

describe("FilterBuilder", () => {
  it("labels starter metrics as quick filters and toggles them off", () => {
    const onChange = vi.fn();
    const filters: RangeFilter[] = [{ metricKey: "pe_ratio", min: 1, max: 40 }];

    render(<FilterBuilder filters={filters} onChange={onChange} />);

    expect(screen.getByText("Quick filters")).toBeInTheDocument();

    const peQuickFilter = screen.getByRole("button", {
      name: /Remove quick filter P\/E Ratio/i,
    });

    expect(peQuickFilter).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(peQuickFilter);

    expect(onChange).toHaveBeenCalledWith([]);
  });

  it("adds inactive quick filters with the default range", () => {
    const onChange = vi.fn();
    const filters: RangeFilter[] = [{ metricKey: "pe_ratio", min: 1, max: 40 }];

    render(<FilterBuilder filters={filters} onChange={onChange} />);

    fireEvent.click(
      screen.getByRole("button", { name: /Add quick filter Dividend Yield/i }),
    );

    expect(onChange).toHaveBeenCalledWith([
      { metricKey: "pe_ratio", min: 1, max: 40 },
      { metricKey: "dividend_yield", min: 0, max: 8 },
    ]);
  });

  it("does not offer an already selected metric in another filter row", () => {
    const filters: RangeFilter[] = [
      { metricKey: "pe_ratio", min: 1, max: 40 },
      { metricKey: "dividend_yield", min: 0, max: 8 },
    ];

    render(<FilterBuilder filters={filters} onChange={vi.fn()} />);

    const secondMetric = screen.getByLabelText("Metric 2");

    expect(
      within(secondMetric).queryByRole("option", { name: "P/E Ratio" }),
    ).not.toBeInTheDocument();
    expect(
      within(secondMetric).getByRole("option", { name: "Dividend Yield" }),
    ).toBeInTheDocument();
  });
});
