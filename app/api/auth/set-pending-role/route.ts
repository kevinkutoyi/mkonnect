// app/api/auth/set-pending-role/route.ts
// Sets a short-lived httpOnly cookie with the role the user selected before
// starting Google OAuth. The signIn callback reads this cookie to assign the
// correct role at JWT creation time.

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { role } = await req.json();
  const res = NextResponse.json({ ok: true });

  if (role === "MASSEUSE" || role === "VISITOR") {
    res.cookies.set("pending_google_role", role, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 300, // 5 minutes — enough to complete OAuth flow
      path: "/",
    });
  }

  return res;
}
