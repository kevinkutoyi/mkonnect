// app/api/auth/post-google/route.ts
// Called after Google OAuth completes (via callbackUrl from the register page).
// Updates the DB role, then re-authenticates via auto-login token so the new
// JWT is created fresh from the DB — avoids any session.update() cookie-timing
// issues.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAutoLoginToken } from "@/lib/tokens";

export async function GET(req: NextRequest) {
  const role = req.nextUrl.searchParams.get("role");
  const base = process.env.NEXTAUTH_URL ?? `https://${req.headers.get("host")}`;

  const session = await auth();

  console.log("[post-google] role:", role, "| userId:", session?.user?.id ?? "NO SESSION");

  if (session?.user?.id && role === "MASSEUSE") {
    // Ensure DB has MASSEUSE (only upgrade from VISITOR to preserve ADMINs)
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (dbUser?.role === "VISITOR") {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { role: "MASSEUSE" },
      });
      console.log("[post-google] DB updated to MASSEUSE for", session.user.id);
    } else {
      console.log("[post-google] DB role already:", dbUser?.role);
    }

    // Create a fresh auto-login token — /auth/verified will call
    // signIn("credentials", { autoLoginToken }) which creates a brand-new
    // JWT reading MASSEUSE directly from the DB.
    const autoToken = createAutoLoginToken(session.user.id, "MASSEUSE");
    return NextResponse.redirect(new URL(`/auth/verified?t=${autoToken}`, base));
  }

  // No session (JWT cookie missing) → send to login
  if (!session) {
    console.log("[post-google] No session — redirecting to login");
    return NextResponse.redirect(new URL("/auth/login", base));
  }

  // VISITOR role (Client flow) → go straight to search
  return NextResponse.redirect(new URL("/search", base));
}
