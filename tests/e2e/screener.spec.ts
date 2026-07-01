import { expect, test } from "@playwright/test";

test("runs a stock screen", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Stock Screener" })).toBeVisible();
  await expect(page.getByText("stocks in universe")).toBeVisible();
  await expect(page.getByText("Learn this metric")).toBeVisible();
  await expect(page.getByRole("tab", { name: "Stock Universe" })).toBeVisible();

  const runButton = page.getByRole("button", { name: "Run Screen" });
  await expect(runButton).toBeEnabled();
  await runButton.click();

  await expect(page.getByRole("heading", { name: "Results" })).toBeVisible();
  await expect(page.getByText("AAPL")).toBeVisible();
  await expect(page.getByRole("heading", { name: "P/E Ratio" })).toBeVisible();
  await expect(page.getByText("Lower is not always better")).toBeVisible();
  await expect(page.getByText("filtered out")).toBeVisible();
  await page.getByRole("tab", { name: "Stock Universe" }).click();
  await expect(page.getByRole("heading", { name: "Stock Universe" })).toBeVisible();
  await page.getByRole("tab", { name: "Results" }).click();
  await page.getByText("AAPL").click();
  await expect(page.getByText("Why Apple Inc. matched")).toBeVisible();
});
