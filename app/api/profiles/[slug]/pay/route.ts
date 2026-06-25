// app/api/profiles/[slug]/pay/route.ts
// POST — client initiates a direct payment to a model via Paystack

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { initializeTransaction } from "@/lib/paystack";
import { z } from "zod";
import { randomBytes } from "crypto";

const BodySchema = z.object({
  amount:  z.number().min(50).max(100_000),
  message: z.string().max(300).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Login required to make a payment." }, { status: 401 });
  }

  const body   = await req.json().catch(() => ({}));
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Amount must be between KSH 50 and KSH 100,000." }, { status: 400 });
  }

  const profile = await prisma.masseuseProfile.findUnique({
    where:  { slug: params.slug, status: "APPROVED", listingActive: true },
    select: { id: true, user: { select: { name: true } } },
  });
  if (!profile) {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }

  const reference   = `dp_${randomBytes(12).toString("hex")}`;
  const base        = process.env.NEXTAUTH_URL ?? `https://${req.headers.get("host")}`;
  const callbackUrl = `${base}/api/payments/direct/callback?reference=${reference}`;

  const result = await initializeTransaction({
    email:       session.user.email!,
    amountKES:   parsed.data.amount,
    reference,
    callbackUrl,
    metadata: {
      type:        "direct_payment",
      profileId:   profile.id,
      profileName: profile.user.name,
      payerName:   session.user.name,
      message:     parsed.data.message ?? "",
    },
  });

  await prisma.directPayment.create({
    data: {
      profileId:  profile.id,
      userId:     session.user.id,
      reference,
      amount:     parsed.data.amount,
      status:     "PENDING",
      payerEmail: session.user.email!,
      payerName:  session.user.name ?? null,
      message:    parsed.data.message ?? null,
    },
  });

  return NextResponse.json({ redirectUrl: result.authorization_url, reference });
}
