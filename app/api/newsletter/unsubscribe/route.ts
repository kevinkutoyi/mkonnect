// app/api/newsletter/unsubscribe/route.ts
// GET /api/newsletter/unsubscribe?token=<base64url(userId)>
// Marks the user as newsletterSubscribed=false and redirects to a confirmation page.
import { NextRequest, NextResponse } from "next/server";
import { prisma }                    from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return new NextResponse("Invalid unsubscribe link.", { status: 400 });
  }

  let userId: string;
  try {
    userId = Buffer.from(token, "base64url").toString("utf8");
  } catch {
    return new NextResponse("Invalid unsubscribe token.", { status: 400 });
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data:  { newsletterSubscribed: false },
    });
  } catch {
    // User not found or already deleted — still show success to avoid leaking info
  }

  // Redirect to a simple confirmation page
  return NextResponse.redirect(
    new URL("/newsletter/unsubscribed", req.nextUrl.origin)
  );
}
