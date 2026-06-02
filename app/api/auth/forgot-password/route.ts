// app/api/auth/forgot-password/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ForgotPasswordSchema } from "@/lib/validations/auth";
import { createPasswordResetToken } from "@/lib/tokens";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = ForgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "VALIDATION_ERROR", fields: parsed.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    // ⚠️  ALWAYS return the same response whether the email exists or not.
    //     This prevents email enumeration attacks.
    const SAFE_RESPONSE = NextResponse.json({
      message: "If an account with that email exists, you'll receive a reset link shortly.",
    });

    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email },
      select: { id: true, name: true, email: true, password: true, isBanned: true },
    });

    // No user or OAuth-only account (no password) → silently succeed
    if (!user || !user.password || user.isBanned) {
      return SAFE_RESPONSE;
    }

    const rawToken = await createPasswordResetToken(user.id);
    await sendPasswordResetEmail({ to: user.email, name: user.name, token: rawToken });

    return SAFE_RESPONSE;
  } catch (err) {
    console.error("[ForgotPassword]", err);
    // Still return safe response to avoid leaking info
    return NextResponse.json({
      message: "If an account with that email exists, you'll receive a reset link shortly.",
    });
  }
}
