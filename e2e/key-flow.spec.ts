import { expect, test } from "@playwright/test";
import { FIXTURE, VALID_KEY } from "./stub-intervals";

test("key flow: wrong key, valid key, forget key", async ({ page }) => {
  await page.goto("/");

  const keyInput = page.getByLabel("intervals.icu API key");
  const save = page.getByRole("button", { name: "Save key" });
  await expect(keyInput).toBeVisible();

  await keyInput.fill("wrong-key");
  await save.click();
  // Scoped to <main>: Next's route announcer is also role="alert".
  await expect(page.getByRole("main").getByRole("alert")).toHaveText("intervals.icu rejected this key");

  await keyInput.fill(VALID_KEY);
  await save.click();
  // Scoped to the headline: the hover readout also has Fitness/Fatigue.
  const headline = page.getByRole("region", { name: "Today" });
  const fitness = headline.locator("dt", { hasText: "Fitness" }).locator("+ dd");
  const fatigue = headline.locator("dt", { hasText: "Fatigue" }).locator("+ dd");
  await expect(fitness).toHaveText(String(Math.round(FIXTURE.ctl)));
  await expect(fatigue).toHaveText(String(Math.round(FIXTURE.atl)));

  await page.getByRole("button", { name: "Forget key" }).click();
  await expect(keyInput).toBeVisible();
});
