import { defineConfig, devices } from "@playwright/test";
import { STUB_PORT } from "./e2e/stub-intervals";

const APP_PORT = Number(process.env.E2E_APP_PORT || 3100);

export default defineConfig({
  testDir: "e2e",
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  use: { baseURL: `http://localhost:${APP_PORT}`, trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "node e2e/stub-intervals.ts",
      url: `http://localhost:${STUB_PORT}/health`,
      reuseExistingServer: false,
    },
    {
      // Production build so e2e behaviour matches deploy.
      command: `pnpm build && pnpm start --port ${APP_PORT}`,
      url: `http://localhost:${APP_PORT}`,
      reuseExistingServer: false,
      timeout: 180_000,
      env: { INTERVALS_BASE_URL: `http://localhost:${STUB_PORT}` },
    },
  ],
});
