import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import HomePage from "./page";

describe("HomePage", () => {
  beforeEach(() => {
    const screenResult = {
      criteria: [{ metricKey: "pe_ratio", min: 1, max: 40 }],
      universeTotal: 6,
      filteredOut: 2,
      total: 4,
      page: 1,
      pageSize: 50,
      rows: [
        {
          marketCode: "US",
          exchange: "NASDAQ",
          stockCode: "AAPL",
          stockName: "Apple Inc.",
          currency: "USD",
          metrics: {
            pe_ratio: {
              value: 25.982,
              dataQuality: "fresh",
              reason: null,
              currency: null,
            },
          },
        },
      ],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => screenResult,
    }) as unknown as typeof fetch;
  });

  it("renders the beginner screener workspace", async () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", { name: "Stock Screener" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("United States")).toBeInTheDocument();
    expect(screen.getByLabelText("Singapore")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Build your screen" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Results" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Stock Universe" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Learn" })).toBeInTheDocument();
    expect(screen.getByText("Learn this metric")).toBeInTheDocument();
    expect(await screen.findByText("AAPL")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Run Screen" }),
    ).toBeInTheDocument();
    expect(screen.getByText("stocks in universe")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Company" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "P/E Ratio" })).toBeInTheDocument();
  });
});
