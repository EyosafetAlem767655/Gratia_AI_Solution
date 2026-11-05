import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

/**
 * /Admin goes to /admin: routes are case-sensitive, and the capitalised address
 * is one people type.
 *
 * Signed-out visitors on /projects go to sign-in. That part only checks that a
 * session cookie exists — it does not hit the database. It is a fast redirect,
 * not the security boundary: every page and route under /projects and
 * /api/builds checks the session and ownership itself (lib/builds/client.ts).
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/Admin") {
    return NextResponse.redirect(new URL("/admin", request.url));
  }
  if (!pathname.startsWith("/projects") || getSessionCookie(request)) {
    return NextResponse.next();
  }

  const url = new URL("/signin", request.url);
  url.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/projects/:path*", "/Admin"],
};
