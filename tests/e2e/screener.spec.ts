import { expect, test } from "@playwright/test";

test("runs a stock screen", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Stock Screener" })).toBeVisible();

  const runButton = page.getByRole("button", { name: "Run Screen" });
  await expect(runButton).toBeEnabled();
  await runButton.click();

  await expect(page.getByRole("heading", { name: "Results" })).toBeVisible();
  await expect(page.getByText("AAPL")).toBeVisible();
});
