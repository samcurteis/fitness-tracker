import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { KEY_COOKIE, TZ_COOKIE } from "@/lib/key-cookie";

/**
 * A stored key was rejected (401). A server component can't delete cookies, so
 * the page redirects here: clear the key, then back to the key form with the error.
 */
export async function GET(request: NextRequest) {
  const store = await cookies();
  store.delete(KEY_COOKIE);
  store.delete(TZ_COOKIE);
  return NextResponse.redirect(new URL("/?error=invalid-key", request.url));
}
