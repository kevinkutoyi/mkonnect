// middleware.ts
import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { Role } from "@prisma/client";

const { auth } = NextAuth(authConfig);

const ROUTE_RULES: Array<{
  pattern: RegExp;
  allowedRoles: Role[] | "PUBLIC" | "AUTHENTICATED";
}> = [
  { pattern: /^\/auth\/(login|register)/, allowedRoles: "PUBLIC" },
  { pattern: /^\/auth\//, allowedRoles: "PUBLIC" },
  { pattern: /^\/admin/, allowedRoles: ["ADMIN"] },
  { pattern: /^\/dashboard/, allowedRoles: ["MASSEUSE"] },
  { pattern: /^\/booking/, allowedRoles: ["CLIENT", "MASSEUSE", "ADMIN"] },
  { pattern: /^\/$/, allowedRoles: "PUBLIC" },
  { pattern: /^\/search/, allowedRoles: "PUBLIC" },
  { pattern: /^\/masseuse\//, allowedRoles: "PUBLIC" },
  { pattern: /^\/favorites/, allowedRoles: "PUBLIC" },
];

export default auth(async (req: any) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const role = session?.user?.role as Role | undefined;

  const rule = ROUTE_RULES.find((r) => r.pattern.test(pathname));

  if (!rule || rule.allowedRoles === "PUBLIC") {
    if (session && /^\/auth\/(login|register)/.test(pathname)) {
      const dest = role === "ADMIN" ? "/admin" : role === "MASSEUSE" ? "/dashboard" : "/";
      return NextResponse.redirect(new URL(dest, req.url));
    }
    return NextResponse.next();
  }

  if (!session) {
    const loginUrl = new URL("/auth/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (rule.allowedRoles === "AUTHENTICATED") return NextResponse.next();

  if (!rule.allowedRoles.includes(role!)) {
    if (role === "VISITOR" && pathname.startsWith("/booking")) {
      return NextResponse.redirect(new URL("/auth/register?reason=booking", req.url));
    }
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons|images|fonts).*)" ],
};
