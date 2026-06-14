import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Soft guard for the authenticated areas. The real identity lives in
// localStorage (the client mirrors a "bh2-auth" presence cookie via
// isAuthenticated / clearIdentity); here we only keep unauthenticated visitors
// off /home, /plan/*, and /social/* so they never see a blank protected screen
// before the client can redirect them. Existence of the cookie is all we check.
const AUTH_COOKIE = "bh2-auth";

export function middleware(request: NextRequest) {
  if (request.cookies.has(AUTH_COOKIE)) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/home", "/plan/:path*", "/social/:path*"],
};
