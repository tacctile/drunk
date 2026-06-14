import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authCookie = request.cookies.get("bh2-auth")?.value;
  const roleCookie = request.cookies.get("bh2-role")?.value;

  if (!authCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname.startsWith("/plan/admin")) {
    if (roleCookie !== "super_admin") {
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
