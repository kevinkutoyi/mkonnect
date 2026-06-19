// app/api/tiers/subscribe/route.ts
// POST — masseuse initiates a tier subscription payment via Pesapal

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SubscribeTierSchema } from "@/lib/validations/tier";
import { getOrRegisterIPN, submitOrder, PesapalError } from "@/lib/pesapal";
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

  // ── Load profile ────────────────────────────────────────────────────────────
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

  // ── Load tier ───────────────────────────────────────────────────────────────
  const tier = await prisma.listingTier.findUnique({
    where: { id: parsed.data.tierId, isActive: true },
  });
  if (!tier) {
    return NextResponse.json({ error: "Tier not found or inactive." }, { status: 404 });
  }

  // ── Guard: already has an active subscription on THIS tier ─────────────────
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

  // ── Guard: already has a PENDING payment in-flight ──────────────────────────
  // Allow retry if:
  //   • No orderTrackingId — payment never reached PesaPal (abandoned) → expire immediately
  //   • Older than 10 minutes — something went wrong → expire and allow retry
  const pendingRecent = await prisma.profileSubscription.findFirst({
    where: {
      profileId: profile.id,
      tierId:    tier.id,
      status:    "PENDING",
      createdAt: { gt: new Date(Date.now() - 10 * 60_000) }, // 10-min window (down from 30)
    },
  });
  if (pendingRecent) {
    // If it never reached PesaPal (no tracking ID), expire it now so we can retry
    if (!pendingRecent.orderTrackingId) {
      await prisma.profileSubscription.update({
        where: { id: pendingRecent.id },
        data:  { status: "FAILED" },
      });
      // Fall through to create a fresh subscription below
    } else {
      return NextResponse.json(
        { error: "A payment for this plan is already in progress. Please complete it or wait a few minutes." },
        { status: 409 }
      );
    }
  }

  // ── Create PENDING subscription record ─────────────────────────────────────
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

  // ── Load user billing info ──────────────────────────────────────────────────
  const user = await prisma.user.findUnique({
    where:  { id: session.user.id },
    select: { name: true, email: true, phone: true },
  });

  // ── Get (or register) IPN ID — cached after first call ─────────────────────
  let ipnId: string;
  try {
    ipnId = await getOrRegisterIPN();
  } catch (err) {
    // Roll back pending record so the user can try again
    await prisma.profileSubscription.update({
      where: { id: pendingSub.id },
      data:  { status: "FAILED" },
    });
    console.error("[Subscribe] IPN registration failed:", err);
    return NextResponse.json(
      { error: "Payment gateway configuration error. Please try again later." },
      { status: 502 }
    );
  }

  // ── Submit order to Pesapal ─────────────────────────────────────────────────
  const nameParts = (user?.name ?? "User").split(" ");
  const callbackUrl = `${process.env.NEXTAUTH_URL}/api/tiers/callback`;
  const cancellationUrl = `${process.env.NEXTAUTH_URL}/dashboard/listing?status=cancelled`;

  try {
    const result = await submitOrder({
      merchantReference,
      amount:           Number(tier.price),
      currency:         "KES",
      description:      `mconnect ${tier.displayName} Listing — ${tier.durationDays} days`,
      callbackUrl,
      cancellationUrl,
      ipnId,
      billingEmail:     user?.email ?? "",
      billingPhone:     user?.phone ?? undefined,
      billingFirstName: nameParts[0],
      billingLastName:  nameParts.slice(1).join(" ") || nameParts[0],
    });

    // Persist Pesapal tracking ID
    await prisma.profileSubscription.update({
      where: { id: pendingSub.id },
      data:  { orderTrackingId: result.order_tracking_id },
    });

    return NextResponse.json({
      redirectUrl:      result.redirect_url,
      orderTrackingId:  result.order_tracking_id,
      merchantReference,
    });
  } catch (err) {
    // Mark subscription as FAILED so it doesn't block future attempts
    await prisma.profileSubscription.update({
      where: { id: pendingSub.id },
      data:  { status: "FAILED" },
    });

    if (err instanceof PesapalError) {
      console.error("[Subscribe] Pesapal error:", err.message, err.code);
      return NextResponse.json(
        { error: `Payment initiation failed: ${err.message}` },
        { status: 502 }
      );
    }

    console.error("[Subscribe] Unexpected error:", err);
    return NextResponse.json({ error: "Unexpected error. Please try again." }, { status: 500 });
  }
}
