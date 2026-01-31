/**
 * Middleware - protects dashboard routes; redirects unauthenticated users to login.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that require authentication
const PROTECTED_PATHS = ["/dashboard"];

// Routes that should redirect to dashboard when already logged in
const AUTH_PATHS = ["/login", "/signup"];

// Root path shows login
const ROOT_PATH = "/";

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATHS.some((path) =>
    pathname === path || pathname.startsWith(`${path}/`)
  );
}

function isAuthPath(pathname: string): boolean {
  return AUTH_PATHS.some((path) =>
    pathname === path || pathname.startsWith(`${path}/`)
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionToken = request.cookies.get("session")?.value;

  // Note: We don't verify the token server-side in middleware for performance.
  // The session is validated on each API call and page load via getAuthSession().
  const hasSession = !!sessionToken;

  if (isProtectedPath(pathname) && !hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect logged-in users away from login/signup to dashboard
  if ((isAuthPath(pathname) || pathname === ROOT_PATH) && hasSession) {
    const redirectTo = request.nextUrl.searchParams.get("redirect");
    const dashboardUrl = new URL(redirectTo || "/dashboard", request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/signup", "/dashboard", "/dashboard/(.*)"],
}
