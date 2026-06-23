// app/api/tiers/callback/route.ts
// Paystack webhook (POST) + browser redirect (GET) handler for tier subscription payments
//
// Paystack status → subscription status → profile listingActive:
//   "success"   → ACTIVE    → listingActive = true  (if also APPROVED)
//   "failed"    → FAILED    → listingActive = false
//   "abandoned" → FAILED    → listingActive = false
//   "pending"   → PENDING   → no change

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyTransaction, verifyWebhookSignature, PaystackError } from "@/lib/paystack";
import { activateProfile, deactivateProfile } from "@/lib/profile-activation";
import { notifyPaymentConfirmed, notifyListingActivated } from "@/lib/notifications";
import type { PaystackStatus } from "@/lib/paystack";

// ── Webhook (server-to-server POST from Paystack) ─────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const rawBody  = await req.text();
    const signature = req.headers.get("x-paystack-signature") ?? "";

    // Verify webhook authenticity
    if (!verifyWebhookSignature(rawBody, signature)) {
      console.warn("[Paystack Webhook] Invalid signature — rejected");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(rawBody);

    // Only process charge.success events
    if (event.event !== "charge.success") {
      return NextResponse.json({ received: true });
    }

    const reference = event.data?.reference;
    if (!reference) {
      return NextResponse.json({ error: "Missing reference" }, { status: 400 });
    }

    await processPayment(reference);
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[Paystack Webhook POST]", err);
    // Return 200 so Paystack doesn't retry indefinitely
    return NextResponse.json({ received: true, note: "processed with error" });
  }
}

// ── Redirect (browser GET after Paystack payment page) ───────────────────────
export async function GET(req: NextRequest) {
  const base = process.env.NEXTAUTH_URL ?? `https://${req.headers.get("host")}`;
  const { searchParams } = req.nextUrl;

  // Paystack sends ?reference=xxx&trxref=xxx
  const reference = searchParams.get("reference") ?? searchParams.get("trxref");

  if (!reference) {
    return NextResponse.redirect(
      new URL("/dashboard/listing?status=failed&reason=missing_params", base)
    );
  }

  try {
    const result = await processPayment(reference);

    switch (result.outcome) {
      case "ACTIVATED":
        return NextResponse.redirect(
          new URL(`/dashboard/listing?status=success&ref=${reference}`, base)
        );
      case "PENDING":
        return NextResponse.redirect(
          new URL(`/dashboard/listing?status=pending`, base)
        );
      case "FAILED":
        return NextResponse.redirect(
          new URL("/dashboard/listing?status=failed&reason=payment_failed", base)
        );
      case "ALREADY_ACTIVE":
        return NextResponse.redirect(
          new URL(`/dashboard/listing?status=success&ref=${reference}`, base)
        );
      default:
        return NextResponse.redirect(
          new URL("/dashboard/listing?status=failed", base)
        );
    }
  } catch (err) {
    console.error("[Paystack Callback GET]", err);
    return NextResponse.redirect(
      new URL("/dashboard/listing?status=failed&reason=server_error", base)
    );
  }
}

// ─── Outcome types ────────────────────────────────────────────────────────────
type ProcessOutcome = "ACTIVATED" | "PENDING" | "FAILED" | "ALREADY_ACTIVE" | "NOT_FOUND";

// ─── Core payment processor ───────────────────────────────────────────────────
async function processPayment(
  reference: string
): Promise<{ outcome: ProcessOutcome }> {

  // ── Load subscription by merchantReference ───────────────────────────────────
  const sub = await prisma.profileSubscription.findUnique({
    where:   { merchantReference: reference },
    include: {
      tier:    true,
      profile: { select: { slug: true, user: { select: { id: true, name: true, email: true } } } },
    },
  });

  if (!sub) {
    console.warn(`[Paystack] Subscription not found for ref: ${reference}`);
    return { outcome: "NOT_FOUND" };
  }

  // ── Idempotency: already terminal ───────────────────────────────────────────
  if (sub.status === "ACTIVE")    return { outcome: "ALREADY_ACTIVE" };
  if (sub.status === "FAILED")    return { outcome: "FAILED" };
  if (sub.status === "CANCELLED") return { outcome: "FAILED" };

  // ── Verify with Paystack ─────────────────────────────────────────────────────
  let tx;
  try {
    tx = await verifyTransaction(reference);
  } catch (err) {
    if (err instanceof PaystackError) {
      console.error("[Paystack] verifyTransaction failed:", err.message);
      return { outcome: "PENDING" };
    }
    throw err;
  }

  // ── State machine ────────────────────────────────────────────────────────────
  const status = tx.status as PaystackStatus;

  if (status === "success") {
    const now       = new Date();
    const expiresAt = new Date(now.getTime() + sub.tier.durationDays * 86_400_000);

    await prisma.$transaction([
      prisma.profileSubscription.update({
        where: { merchantReference: reference },
        data: {
          status:   "ACTIVE",
          startsAt: now,
          expiresAt,
          paidAt:   now,
        },
      }),
      // Expire any other active subs for this profile
      prisma.profileSubscription.updateMany({
        where: {
          profileId: sub.profileId,
          id:        { not: sub.id },
          status:    "ACTIVE",
        },
        data: { status: "EXPIRED" },
      }),
    ]);

    const activation = await activateProfile({
      profileId:     sub.profileId,
      tierId:        sub.tierId,
      tierName:      sub.tier.name,
      searchBoost:   sub.tier.searchBoost,
      featuredSlots: sub.tier.featuredSlots,
      expiresAt,
      reason:        "SUBSCRIPTION_ACTIVATED",
    });

    console.info(
      `[Paystack] ACTIVATED — profile ${sub.profileId}, tier ${sub.tier.name}, ` +
      `listingActive=${activation.listingActive}, expires ${expiresAt.toISOString()}`
    );

    const user = sub.profile?.user;
    const slug = sub.profile?.slug ?? "";
    if (user?.email) {
      Promise.allSettled([
        notifyPaymentConfirmed({
          userId:   user.id,
          email:    user.email,
          name:     user.name ?? "there",
          tierName: sub.tier.displayName ?? sub.tier.name,
          amount:   sub.amountPaid ? Number(sub.amountPaid) : 0,
          expiresAt,
        }),
        notifyListingActivated({
          userId:   user.id,
          email:    user.email,
          name:     user.name ?? "there",
          slug,
          tierName: sub.tier.displayName ?? sub.tier.name,
        }),
      ]).catch(console.error);
    }

    return { outcome: "ACTIVATED" };
  }

  if (status === "failed" || status === "abandoned") {
    await prisma.profileSubscription.update({
      where: { merchantReference: reference },
      data:  { status: "FAILED" },
    });
    await deactivateProfile(sub.profileId, "SUBSCRIPTION_FAILED");
    console.warn(`[Paystack] ${status.toUpperCase()} — ref ${reference}, profile ${sub.profileId}`);
    return { outcome: "FAILED" };
  }

  // pending or unknown — leave PENDING
  return { outcome: "PENDING" };
}
