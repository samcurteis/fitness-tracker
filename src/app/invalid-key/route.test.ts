import { NextRequest } from "next/server";
import { describe, expect, test } from "vitest";
import { KEY_COOKIE, TZ_COOKIE } from "@/lib/key-cookie";
import { GET } from "./route";

describe("GET /invalid-key", () => {
  test("deletes the key cookie and redirects to the key form with error=invalid-key", () => {
    const request = new NextRequest("https://app.test/invalid-key", {
      headers: { cookie: `${KEY_COOKIE}=stale; ${TZ_COOKIE}=Europe/London` },
    });

    const response = GET(request);

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("https://app.test/?error=invalid-key");
    for (const name of [KEY_COOKIE, TZ_COOKIE]) {
      const cookie = response.cookies.get(name);
      expect(cookie?.value).toBe("");
      expect(new Date(cookie!.expires!).getTime()).toBeLessThan(Date.now());
    }
  });
});
