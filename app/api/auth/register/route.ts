// app/api/auth/register/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { RegisterSchema } from "@/lib/validations/auth";
import { createEmailVerificationToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = RegisterSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "VALIDATION_ERROR", fields: parsed.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const { name, email, password, role } = parsed.data;

    // Check duplicate email
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "EMAIL_ALREADY_EXISTS", message: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user (role is VISITOR or MASSEUSE from the form)
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role as any,
      },
      select: { id: true, name: true, email: true, role: true },
    });

    // Generate email verification token and send email
    const rawToken = await createEmailVerificationToken(user.id);
    await sendVerificationEmail({ to: email, name, token: rawToken });

    return NextResponse.json(
      {
        message: "Account created. Please check your email to verify your address.",
        userId: user.id,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[Register]", err);
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
