// app/api/masseuse/payout-phone/route.ts
// GET  — return current payout phone
// PATCH — update payout phone for the logged-in masseuse

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normaliseMpesaPhone, MpesaError } from "@/lib/mpesa";
import { z } from "zod";

const PatchSchema = z.object({
  payoutPhone: z.string().min(9).max(15),
});

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "MASSEUSE") {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const profile = await prisma.masseuseProfile.findUnique({
    where:  { userId: session.user.id },
    select: { payoutPhone: true },
  });

  return NextResponse.json({ payoutPhone: profile?.payoutPhone ?? null });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "MASSEUSE") {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const body   = await req.json().catch(() => ({}));
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
  }

  let normalised: string;
  try {
    normalised = normaliseMpesaPhone(parsed.data.payoutPhone);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof MpesaError ? e.message : "Invalid M-Pesa number" },
      { status: 422 }
    );
  }

  const profile = await prisma.masseuseProfile.update({
    where: { userId: session.user.id },
    data:  { payoutPhone: normalised },
    select: { payoutPhone: true },
  });

  return NextResponse.json({ ok: true, payoutPhone: profile.payoutPhone });
}
