// app/api/tiers/subscribe/route.ts
// POST — masseuse initiates a tier subscription payment via Paystack

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SubscribeTierSchema } from "@/lib/validations/tier";
import { initializeTransaction, PaystackError } from "@/lib/paystack";
import { generateMerchantRef } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "MASSEUSE") {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }

  const body   = await req.json();
  const parsed = SubscribeTierSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "VALIDATION_ERROR", fields: parsed.error.flatten() },
      { status: 422 }
    );
  }

  // ── Load profile ─────────────────────────────────────────────────────────────
  const profile = await prisma.masseuseProfile.findUnique({
    where:  { userId: session.user.id },
    select: { id: true },
  });
  if (!profile) {
    return NextResponse.json(
      { error: "Complete your profile before subscribing." },
      { status: 404 }
    );
  }

  // ── Load tier ────────────────────────────────────────────────────────────────
  const tier = await prisma.listingTier.findUnique({
    where: { id: parsed.data.tierId, isActive: true },
  });
  if (!tier) {
    return NextResponse.json({ error: "Tier not found or inactive." }, { status: 404 });
  }

  // ── Guard: already has an active subscription on THIS tier ──────────────────
  const existing = await prisma.profileSubscription.findFirst({
    where: {
      profileId: profile.id,
      tierId:    tier.id,
      status:    "ACTIVE",
      expiresAt: { gt: new Date() },
    },
  });
  if (existing) {
    return NextResponse.json(
      {
        error: `You already have an active ${tier.displayName} plan until ${
          existing.expiresAt!.toLocaleDateString("en-KE")
        }.`,
      },
      { status: 409 }
    );
  }

  // ── Guard: pending payment in the last 10 minutes ───────────────────────────
  const pendingRecent = await prisma.profileSubscription.findFirst({
    where: {
      profileId: profile.id,
      tierId:    tier.id,
      status:    "PENDING",
      createdAt: { gt: new Date(Date.now() - 10 * 60_000) },
    },
  });
  if (pendingRecent) {
    if (!pendingRecent.orderTrackingId) {
      await prisma.profileSubscription.update({
        where: { id: pendingRecent.id },
        data:  { status: "FAILED" },
      });
    } else {
      return NextResponse.json(
        { error: "A payment for this plan is already in progress. Please complete it or wait a few minutes." },
        { status: 409 }
      );
    }
  }

  // ── Load user billing info ───────────────────────────────────────────────────
  const user = await prisma.user.findUnique({
    where:  { id: session.user.id },
    select: { name: true, email: true },
  });
  if (!user?.email) {
    return NextResponse.json({ error: "Account email is required." }, { status: 400 });
  }

  // ── Create PENDING subscription record ──────────────────────────────────────
  const merchantReference = generateMerchantRef();
  const pendingSub = await prisma.profileSubscription.create({
    data: {
      profileId:        profile.id,
      tierId:           tier.id,
      status:           "PENDING",
      merchantReference,
      amountPaid:       tier.price,
    },
  });

  // ── Initialize Paystack transaction ─────────────────────────────────────────
  const callbackUrl = `${process.env.NEXTAUTH_URL}/api/tiers/callback`;

  try {
    const result = await initializeTransaction({
      email:       user.email,
      amountKES:   Number(tier.price),
      reference:   merchantReference,
      callbackUrl,
      metadata: {
        profileId:    profile.id,
        tierId:       tier.id,
        tierName:     tier.name,
        customerName: user.name,
      },
    });

    // Store Paystack access code as orderTrackingId
    await prisma.profileSubscription.update({
      where: { id: pendingSub.id },
      data:  { orderTrackingId: result.access_code },
    });

    return NextResponse.json({
      redirectUrl:      result.authorization_url,
      reference:        merchantReference,
    });
  } catch (err) {
    await prisma.profileSubscription.update({
      where: { id: pendingSub.id },
      data:  { status: "FAILED" },
    });

    if (err instanceof PaystackError) {
      console.error("[Subscribe] Paystack error:", err.message, err.code);
      return NextResponse.json(
        { error: `Payment initiation failed: ${err.message}` },
        { status: 502 }
      );
    }

    console.error("[Subscribe] Unexpected error:", err);
    return NextResponse.json({ error: "Unexpected error. Please try again." }, { status: 500 });
  }
}
