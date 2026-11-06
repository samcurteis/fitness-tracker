import { NextRequest } from "next/server";
import { expect, test, vi } from "vitest";
import { KEY_COOKIE, TZ_COOKIE } from "@/lib/key-cookie";

const cookieStore = { delete: vi.fn() };
vi.mock("next/headers", () => ({ cookies: async () => cookieStore }));

const { GET } = await import("./route");

test("clears the stored key and redirects to the key form with ?error=invalid-key", async () => {
  const res = await GET(new NextRequest("https://app.test/invalid-key"));

  expect(cookieStore.delete).toHaveBeenCalledWith(KEY_COOKIE);
  expect(cookieStore.delete).toHaveBeenCalledWith(TZ_COOKIE);
  expect(res.status).toBeGreaterThanOrEqual(300);
  expect(res.status).toBeLessThan(400);
  expect(res.headers.get("location")).toBe("https://app.test/?error=invalid-key");
});
