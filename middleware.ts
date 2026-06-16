// middleware.ts
// Route protection via NextAuth + role-based access control
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { Role } from "@prisma/client";

// ─── Route configuration ──────────────────────────────────────────────────────
// Defines which roles can access which path prefixes.
// First matching rule wins. "PUBLIC" means no auth required.

const ROUTE_RULES: Array<{
  pattern: RegExp;
  allowedRoles: Role[] | "PUBLIC" | "AUTHENTICATED";
  redirectTo?: string;
}> = [
  // Auth pages — redirect to dashboard if already logged in
  { pattern: /^\/auth\/(login|register)/, allowedRoles: "PUBLIC" },
  { pattern: /^\/auth\//, allowedRoles: "PUBLIC" },

  // Admin — ADMIN only
  { pattern: /^\/admin/, allowedRoles: ["ADMIN"] },

  // Masseuse dashboard — MASSEUSE only
  { pattern: /^\/dashboard/, allowedRoles: ["MASSEUSE"] },

  // Booking — any authenticated user (VISITOR redirected to upgrade prompt)
  { pattern: /^\/booking/, allowedRoles: ["CLIENT", "MASSEUSE", "ADMIN"] },

  // Public routes — no auth required
  { pattern: /^\/$/, allowedRoles: "PUBLIC" },
  { pattern: /^\/search/, allowedRoles: "PUBLIC" },
  { pattern: /^\/model\//, allowedRoles: "PUBLIC" },
];

export default auth(async (req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const role = session?.user?.role as Role | undefined;

  // Find matching rule
  const rule = ROUTE_RULES.find((r) => r.pattern.test(pathname));

  // No rule found → allow (catch-all public)
  if (!rule || rule.allowedRoles === "PUBLIC") {
    // Redirect logged-in users away from login/register pages
    if (session && /^\/auth\/(login|register)/.test(pathname)) {
      const dest = getDashboardUrl(role);
      return NextResponse.redirect(new URL(dest, req.url));
    }
    return NextResponse.next();
  }

  // Requires authentication
  if (!session) {
    const loginUrl = new URL("/auth/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // AUTHENTICATED — any logged-in user is fine
  if (rule.allowedRoles === "AUTHENTICATED") {
    return NextResponse.next();
  }

  // Role-specific check
  if (!rule.allowedRoles.includes(role!)) {
    // VISITOR trying to book → suggest upgrading / signing up properly
    if (role === "VISITOR" && pathname.startsWith("/booking")) {
      return NextResponse.redirect(new URL("/auth/register?reason=booking", req.url));
    }
    // Wrong role → /unauthorized
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  return NextResponse.next();
});

function getDashboardUrl(role?: Role): string {
  switch (role) {
    case "ADMIN":    return "/admin";
    case "MASSEUSE": return "/dashboard";
    default:         return "/";
  }
}

export const config = {
  // Run on all routes except static assets, API routes, and Next internals
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons|images|fonts).*)",
  ],
};
