import { NextResponse, type NextRequest } from "next/server";
import { KEY_COOKIE, TZ_COOKIE } from "@/lib/key-cookie";

/**
 * A stored key got a 401. The page (a server component) can't delete cookies,
 * so it redirects here: clear the key and send the Athlete back to the key form.
 */
export function GET(request: NextRequest): NextResponse {
  const response = NextResponse.redirect(new URL("/?error=invalid-key", request.url), 303);
  response.cookies.delete(KEY_COOKIE);
  response.cookies.delete(TZ_COOKIE);
  return response;
}
