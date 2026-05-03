import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HomePage from "./page";

describe("HomePage", () => {
  it("renders the screener workspace", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", { name: "Stock Screener" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("United States")).toBeInTheDocument();
    expect(screen.getByLabelText("Singapore")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Run Screen" }),
    ).toBeInTheDocument();
  });
});
