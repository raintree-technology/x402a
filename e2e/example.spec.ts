import { test, expect } from "@playwright/test";

test("homepage loads successfully", async ({ page }) => {
  await page.goto("http://localhost:3000");
  await expect(page).toHaveTitle(/x402a/i);
});
