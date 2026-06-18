// app/api/auth/post-google/route.ts
// Called after Google OAuth completes (via callbackUrl).
// Sets the role the user selected on the register page, then redirects.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  const role = req.nextUrl.searchParams.get("role");

  if (session?.user?.id && (role === "MASSEUSE" || role === "VISITOR")) {
    // Only update if still on the default VISITOR role
    // (preserves ADMIN or manually-set roles)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });
    if (user?.role === "VISITOR" && role === "MASSEUSE") {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { role: "MASSEUSE" },
      });
    }
  }

  const dest = role === "MASSEUSE" ? "/dashboard/onboarding" : "/search";
  const base = process.env.NEXTAUTH_URL ?? `https://${req.headers.get("host")}`;
  return NextResponse.redirect(new URL(dest, base));
}
