// Tiny dependency-free stand-in for the intervals.icu wellness API, used by Playwright.
// Run with `node e2e/stub-intervals.ts` (Node strips the types).
import { createServer } from "node:http";

export const STUB_PORT = Number(process.env.E2E_STUB_PORT || 4010);
export const VALID_KEY = "e2e-valid-key";
/** Every served day has the same load, so whichever day is "today" shows these. */
export const FIXTURE = { ctl: 62.4, atl: 48.1 };

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function datesBetween(oldest: string, newest: string): string[] {
  const dates: string[] = [];
  const d = new Date(`${oldest}T00:00:00Z`);
  const end = new Date(`${newest}T00:00:00Z`);
  while (d <= end) {
    dates.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return dates;
}

function isAuthorized(header: string | undefined): boolean {
  const expected = `Basic ${Buffer.from(`API_KEY:${VALID_KEY}`).toString("base64")}`;
  return header === expected;
}

// Start only when run directly; the config and specs import the constants above.
if (process.argv[1]?.endsWith("stub-intervals.ts")) {
  createServer((req, res) => {
    const url = new URL(req.url ?? "/", `http://localhost:${STUB_PORT}`);
    if (url.pathname === "/health") {
      res.writeHead(200).end("ok");
      return;
    }
    if (url.pathname !== "/api/v1/athlete/0/wellness") {
      res.writeHead(404).end();
      return;
    }
    if (!isAuthorized(req.headers.authorization)) {
      res.writeHead(401).end();
      return;
    }
    const oldest = url.searchParams.get("oldest") ?? "";
    const newest = url.searchParams.get("newest") ?? "";
    if (!ISO_DATE.test(oldest) || !ISO_DATE.test(newest)) {
      res.writeHead(422).end();
      return;
    }
    const rows = datesBetween(oldest, newest).map((id) => ({ id, ...FIXTURE }));
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(rows));
  }).listen(STUB_PORT, () => {
    console.log(`stub intervals.icu on http://localhost:${STUB_PORT}`);
  });
}
