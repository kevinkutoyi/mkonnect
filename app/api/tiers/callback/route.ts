// app/api/tiers/callback/route.ts
// Pesapal IPN (POST) + browser redirect (GET) handler for tier subscription payments
//
// Pesapal status_code → subscription status → profile listingActive:
//   1 (Invalid/Pending) → no change (stay PENDING)   → no change
//   2 (Completed)       → ACTIVE                      → listingActive = true  (if also APPROVED)
//   3 (Failed)          → FAILED                      → listingActive = false (if no other sub)
//   4 (Reversed)        → CANCELLED                   → listingActive = false (if no other sub)

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTransactionStatus, PesapalError } from "@/lib/pesapal";
import { activateProfile, deactivateProfile } from "@/lib/profile-activation";
import type { PesapalStatusCode } from "@/lib/pesapal";

// ── IPN (server-to-server POST from Pesapal) ───────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderTrackingId, orderMerchantReference } = body;

    if (!orderTrackingId || !orderMerchantReference) {
      return NextResponse.json({ error: "Missing params" }, { status: 400 });
    }

    await processPayment(orderMerchantReference, orderTrackingId);

    // Pesapal expects this exact shape in response to IPN notifications
    return NextResponse.json({
      orderNotificationType:  "IPNCHANGE",
      orderTrackingId,
      orderMerchantReference,
      status:                 "200",
    });
  } catch (err) {
    console.error("[Tier IPN POST]", err);
    // Still return 200 — Pesapal retries on non-200; we don't want infinite retries
    return NextResponse.json({ status: "200", note: "processed with error" });
  }
}

// ── Redirect (browser GET after Pesapal payment page) ─────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const orderTrackingId   = searchParams.get("OrderTrackingId");
  const merchantReference = searchParams.get("OrderMerchantReference");

  if (!orderTrackingId || !merchantReference) {
    return NextResponse.redirect(
      new URL("/dashboard/listing?status=failed&reason=missing_params", req.url)
    );
  }

  try {
    const result = await processPayment(merchantReference, orderTrackingId);

    switch (result.outcome) {
      case "ACTIVATED":
        return NextResponse.redirect(
          new URL(`/dashboard/listing?status=success&ref=${merchantReference}`, req.url)
        );
      case "PENDING":
        return NextResponse.redirect(
          new URL(
            `/dashboard/listing?status=pending&trackingId=${orderTrackingId}`,
            req.url
          )
        );
      case "FAILED":
        return NextResponse.redirect(
          new URL("/dashboard/listing?status=failed&reason=payment_failed", req.url)
        );
      case "REVERSED":
        return NextResponse.redirect(
          new URL("/dashboard/listing?status=failed&reason=reversed", req.url)
        );
      case "ALREADY_ACTIVE":
        return NextResponse.redirect(
          new URL(`/dashboard/listing?status=success&ref=${merchantReference}`, req.url)
        );
      default:
        return NextResponse.redirect(
          new URL("/dashboard/listing?status=failed", req.url)
        );
    }
  } catch (err) {
    console.error("[Tier Callback GET]", err);
    return NextResponse.redirect(
      new URL("/dashboard/listing?status=failed&reason=server_error", req.url)
    );
  }
}

// ─── Outcome types ────────────────────────────────────────────────────────────
type ProcessOutcome =
  | "ACTIVATED"
  | "PENDING"
  | "FAILED"
  | "REVERSED"
  | "ALREADY_ACTIVE"
  | "NOT_FOUND";

// ─── Core payment processor ───────────────────────────────────────────────────
async function processPayment(
  merchantReference: string,
  orderTrackingId:   string
): Promise<{ outcome: ProcessOutcome; statusCode: PesapalStatusCode | null }> {

  // ── Load subscription ───────────────────────────────────────────────────────
  const sub = await prisma.profileSubscription.findUnique({
    where:   { merchantReference },
    include: { tier: true },
  });

  if (!sub) {
    console.warn(`[Pesapal] Subscription not found for ref: ${merchantReference}`);
    return { outcome: "NOT_FOUND", statusCode: null };
  }

  // ── Idempotency: already in a terminal state ────────────────────────────────
  if (sub.status === "ACTIVE") {
    return { outcome: "ALREADY_ACTIVE", statusCode: 2 };
  }
  if (sub.status === "FAILED") {
    return { outcome: "FAILED", statusCode: null };
  }
  if (sub.status === "CANCELLED") {
    return { outcome: "REVERSED", statusCode: null };
  }

  // ── Verify with Pesapal ─────────────────────────────────────────────────────
  let txStatus;
  try {
    txStatus = await getTransactionStatus(orderTrackingId);
  } catch (err) {
    if (err instanceof PesapalError) {
      console.error("[Pesapal] GetTransactionStatus failed:", err.message);
    }
    throw err;
  }

  const code = txStatus.status_code as PesapalStatusCode;

  // ── State machine ───────────────────────────────────────────────────────────
  switch (code) {
    // 2 = Completed — activate subscription and profile
    case 2: {
      const now       = new Date();
      const expiresAt = new Date(now.getTime() + sub.tier.durationDays * 86_400_000);

      // Mark subscription ACTIVE and expire any other active subs for this profile
      await prisma.$transaction([
        prisma.profileSubscription.update({
          where: { merchantReference },
          data: {
            status:         "ACTIVE",
            startsAt:       now,
            expiresAt,
            paidAt:         now,
            orderTrackingId,
          },
        }),
        prisma.profileSubscription.updateMany({
          where: {
            profileId: sub.profileId,
            id:        { not: sub.id },
            status:    "ACTIVE",
          },
          data: { status: "EXPIRED" },
        }),
      ]);

      // Activate profile — sets tier fields + evaluates listingActive
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
        `[Pesapal] ACTIVATED — profile ${sub.profileId}, tier ${sub.tier.name}, ` +
        `listingActive=${activation.listingActive}, expires ${expiresAt.toISOString()}`
      );

      return { outcome: "ACTIVATED", statusCode: code };
    }

    // 3 = Failed — mark subscription FAILED, deactivate profile if no other sub
    case 3: {
      await prisma.profileSubscription.update({
        where: { merchantReference },
        data:  { status: "FAILED", orderTrackingId },
      });

      await deactivateProfile(sub.profileId, "SUBSCRIPTION_FAILED");

      console.warn(`[Pesapal] FAILED — ref ${merchantReference}, profile ${sub.profileId}`);
      return { outcome: "FAILED", statusCode: code };
    }

    // 4 = Reversed (chargeback / refund after completion)
    case 4: {
      await prisma.profileSubscription.update({
        where: { merchantReference },
        data:  { status: "CANCELLED", orderTrackingId },
      });

      await deactivateProfile(sub.profileId, "SUBSCRIPTION_CANCELLED");

      console.warn(`[Pesapal] REVERSED — ref ${merchantReference}, profile ${sub.profileId}`);
      return { outcome: "REVERSED", statusCode: code };
    }

    // 1 = Invalid / still processing — store tracking ID, leave PENDING
    case 1:
    default: {
      await prisma.profileSubscription.update({
        where: { merchantReference },
        data:  { orderTrackingId },
      });
      return { outcome: "PENDING", statusCode: code };
    }
  }
}
