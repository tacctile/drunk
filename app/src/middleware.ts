import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authCookie = request.cookies.get("bh2-auth")?.value;
  const roleCookie = request.cookies.get("bh2-role")?.value;
  const voterId = request.cookies.get("bh2-voter-id")?.value;

  if (!authCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Hardcoded superadmin ids — kept in sync with lib/roles.ts / lib/superadmin.ts.
  // Duplicated here so the edge middleware stays free of bcrypt imports.
  const SUPER_ADMIN_IDS = [
    "00000000-0000-0000-0000-000000000001", // Nick V
    "00000000-0000-0000-0000-000000000002", // Knox V
  ];

  if (pathname.startsWith("/plan/admin")) {
    if (roleCookie !== "super_admin" && !(voterId && SUPER_ADMIN_IDS.includes(voterId))) {
      return NextResponse.redirect(new URL("/plan", request.url));
    }
  }

  if (pathname.startsWith("/plan/moderator")) {
    if (roleCookie !== "moderator" && roleCookie !== "super_admin") {
      return NextResponse.redirect(new URL("/plan", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/home", "/plan/:path*", "/social/:path*"],
};
