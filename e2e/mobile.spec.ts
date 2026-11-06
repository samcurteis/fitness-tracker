import { expect, test } from "@playwright/test";
import { VALID_KEY } from "./stub-intervals";

test.use({ viewport: { width: 390, height: 844 } });

test("mobile: both charts visible, no horizontal scroll", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("intervals.icu API key").fill(VALID_KEY);
  await page.getByRole("button", { name: "Save key" }).click();

  const canvases = page.locator("canvas");
  await expect(canvases).toHaveCount(2);
  await expect(canvases.nth(0)).toBeVisible();
  await expect(canvases.nth(1)).toBeVisible();

  const fits = await page.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
  );
  expect(fits).toBe(true);
});
