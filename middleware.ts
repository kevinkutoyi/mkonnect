// middleware.ts
// Route protection via NextAuth + role-based access control.
// Uses the LITE auth config (no Prisma) — Edge Runtime cannot run Prisma.
import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";
import type { Role } from "@prisma/client";

// Create a middleware-safe NextAuth instance (no Prisma in JWT callback)
const { auth } = NextAuth(authConfig);

// ─── Route configuration ──────────────────────────────────────────────────────
const ROUTE_RULES: Array<{
  pattern: RegExp;
  allowedRoles: Role[] | "PUBLIC" | "AUTHENTICATED";
}> = [
  // Auth pages — redirect to dashboard if already logged in
  { pattern: /^\/auth\/(login|register)/, allowedRoles: "PUBLIC" },
  { pattern: /^\/auth\//, allowedRoles: "PUBLIC" },

  // Admin — ADMIN only
  { pattern: /^\/admin/, allowedRoles: ["ADMIN"] },

  // Masseuse dashboard — MASSEUSE only
  { pattern: /^\/dashboard/, allowedRoles: ["MASSEUSE"] },

  // Booking — any authenticated user
  { pattern: /^\/booking/, allowedRoles: ["CLIENT", "MASSEUSE", "ADMIN"] },

  // Public routes
  { pattern: /^\/$/, allowedRoles: "PUBLIC" },
  { pattern: /^\/search/, allowedRoles: "PUBLIC" },
  { pattern: /^\/model\//, allowedRoles: "PUBLIC" },
];

export default auth(async (req) => {
  const { pathname } = req.nextUrl;
  const session = (req as any).auth;
  const role = session?.user?.role as Role | undefined;

  const rule = ROUTE_RULES.find((r) => r.pattern.test(pathname));

  if (!rule || rule.allowedRoles === "PUBLIC") {
    // Redirect logged-in users away from login/register
    if (session && /^\/auth\/(login|register)/.test(pathname)) {
      const dest = getDashboardUrl(role);
      return NextResponse.redirect(new URL(dest, req.url));
    }
    return NextResponse.next();
  }

  if (!session) {
    const loginUrl = new URL("/auth/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (rule.allowedRoles === "AUTHENTICATED") {
    return NextResponse.next();
  }

  if (!(rule.allowedRoles as Role[]).includes(role!)) {
    if (role === "VISITOR" && pathname.startsWith("/booking")) {
      return NextResponse.redirect(new URL("/auth/register?reason=booking", req.url));
    }
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
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons|images|fonts).*)",
  ],
};
