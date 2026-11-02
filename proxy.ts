import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

/**
 * Sends signed-out visitors on /projects to sign-in.
 *
 * This only checks that a session cookie exists — it does not hit the
 * database. It is a fast redirect, not the security boundary: every page and
 * route under /projects and /api/builds checks the session and ownership
 * itself (lib/builds/client.ts).
 */
export function proxy(request: NextRequest) {
  if (getSessionCookie(request)) return NextResponse.next();

  const url = new URL("/signin", request.url);
  url.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/projects/:path*"],
};
