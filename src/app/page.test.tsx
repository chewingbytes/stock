import { fireEvent, render, screen, within } from "@testing-library/react";
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
    expect(screen.queryByText("Learn this metric")).not.toBeInTheDocument();
    expect(await screen.findByText("AAPL")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Run Screen" }),
    ).toBeInTheDocument();
    expect(screen.getByText("stocks in universe")).toBeInTheDocument();
    expect(screen.getByText("4 results")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Company" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "P/E Ratio" })).toBeInTheDocument();
  });

  it("shows when filters changed after the last screen and clears after running again", async () => {
    render(<HomePage />);

    expect(await screen.findByText("AAPL")).toBeInTheDocument();
    expect(
      screen.queryByText("Filters changed. Run screen to update results."),
    ).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Maximum 1"), {
      target: { value: "30" },
    });

    expect(
      screen.getByText("Filters changed. Run screen to update results."),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Run Screen" }));

    expect(
      await screen.findByRole("button", { name: "Run Screen" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Filters changed. Run screen to update results."),
    ).not.toBeInTheDocument();
  });

  it("shows a searchable terminology glossary in the Learn tab", () => {
    render(<HomePage />);

    fireEvent.click(screen.getByRole("tab", { name: "Learn" }));

    expect(
      screen.getByRole("heading", { name: "Glossary", level: 2 }),
    ).toBeInTheDocument();
    expect(screen.getByText("OHLC")).toBeInTheDocument();
    expect(screen.getByText("EBITA")).toBeInTheDocument();

    fireEvent.change(
      screen.getByRole("searchbox", { name: "Search terminology" }),
      {
        target: { value: "dividend" },
      },
    );

    const glossary = screen.getByRole("region", { name: "Glossary" });

    expect(
      within(glossary).getByRole("heading", {
        name: "Dividend Yield",
        level: 3,
      }),
    ).toBeInTheDocument();
    expect(within(glossary).queryByText("OHLC")).not.toBeInTheDocument();
  });
});
