// app/api/auth/verify-email/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyEmailToken } from "@/lib/tokens";
import { prisma } from "@/lib/prisma";
import { sendWelcomeEmail } from "@/lib/email";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(
      new URL("/auth/verify-email?error=TOKEN_MISSING", req.url)
    );
  }

  try {
    const userId = await verifyEmailToken(token);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, role: true },
    });

    if (user) {
      // Best-effort welcome email
      await sendWelcomeEmail({
        to: user.email,
        name: user.name,
        role: user.role === "MASSEUSE" ? "MASSEUSE" : "VISITOR",
      }).catch((e) => console.error("[VerifyEmail] welcome email error", e));
    }

    return NextResponse.redirect(new URL("/auth/verify-email?success=1", req.url));
  } catch (err: any) {
    const code = err.message ?? "UNKNOWN";
    return NextResponse.redirect(
      new URL(`/auth/verify-email?error=${code}`, req.url)
    );
  }
}

// POST version — allows re-sending verification email
export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email) {
    return NextResponse.json({ error: "EMAIL_REQUIRED" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, emailVerified: true },
  });

  // Silently succeed if user not found or already verified
  if (!user || user.emailVerified) {
    return NextResponse.json({ message: "Verification email sent if applicable." });
  }

  const { createEmailVerificationToken } = await import("@/lib/tokens");
  const { sendVerificationEmail } = await import("@/lib/email");

  const rawToken = await createEmailVerificationToken(user.id);
  await sendVerificationEmail({ to: email, name: user.name, token: rawToken });

  return NextResponse.json({ message: "Verification email sent." });
}
