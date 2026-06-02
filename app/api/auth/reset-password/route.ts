// app/api/auth/reset-password/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { ResetPasswordSchema } from "@/lib/validations/auth";
import { validatePasswordResetToken, consumePasswordResetToken } from "@/lib/tokens";
import { sendPasswordChangedEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = ResetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "VALIDATION_ERROR", fields: parsed.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const { token, password } = parsed.data;

    // Validate token — throws with a code if invalid/expired/used
    let userId: string;
    try {
      userId = await validatePasswordResetToken(token);
    } catch (err: any) {
      const code = err.message as string;
      const messages: Record<string, string> = {
        TOKEN_INVALID: "This reset link is invalid.",
        TOKEN_EXPIRED: "This reset link has expired. Please request a new one.",
        TOKEN_ALREADY_USED: "This reset link has already been used.",
      };
      return NextResponse.json(
        { error: code, message: messages[code] ?? "Invalid reset link." },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
      select: { name: true, email: true },
    });

    // Consume token (mark used) — do this AFTER the password update
    await consumePasswordResetToken(token);

    // Send confirmation email (best-effort)
    await sendPasswordChangedEmail({ to: user.email, name: user.name }).catch(
      (e) => console.error("[ResetPassword] email send error", e)
    );

    return NextResponse.json({ message: "Password reset successfully. You can now log in." });
  } catch (err) {
    console.error("[ResetPassword]", err);
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
