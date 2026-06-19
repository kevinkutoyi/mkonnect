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
import { notifyPaymentConfirmed, notifyListingActivated } from "@/lib/notifications";
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
  // Use NEXTAUTH_URL as the base so redirects go to the public domain,
  // not the internal localhost port that Next.js sees behind a reverse proxy.
  const base = process.env.NEXTAUTH_URL ?? `https://${req.headers.get("host")}`;

  const { searchParams } = req.nextUrl;
  const orderTrackingId   = searchParams.get("OrderTrackingId");
  const merchantReference = searchParams.get("OrderMerchantReference");

  if (!orderTrackingId || !merchantReference) {
    return NextResponse.redirect(
      new URL("/dashboard/listing?status=failed&reason=missing_params", base)
    );
  }

  try {
    const result = await processPayment(merchantReference, orderTrackingId);

    switch (result.outcome) {
      case "ACTIVATED":
        return NextResponse.redirect(
          new URL(`/dashboard/listing?status=success&ref=${merchantReference}`, base)
        );
      case "PENDING":
        return NextResponse.redirect(
          new URL(`/dashboard/listing?status=pending&trackingId=${orderTrackingId}`, base)
        );
      case "FAILED":
        return NextResponse.redirect(
          new URL("/dashboard/listing?status=failed&reason=payment_failed", base)
        );
      case "REVERSED":
        return NextResponse.redirect(
          new URL("/dashboard/listing?status=failed&reason=reversed", base)
        );
      case "ALREADY_ACTIVE":
        return NextResponse.redirect(
          new URL(`/dashboard/listing?status=success&ref=${merchantReference}`, base)
        );
      default:
        return NextResponse.redirect(
          new URL("/dashboard/listing?status=failed", base)
        );
    }
  } catch (err) {
    console.error("[Tier Callback GET]", err);
    return NextResponse.redirect(
      new URL("/dashboard/listing?status=failed&reason=server_error", base)
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
    include: {
      tier:    true,
      profile: { select: { slug: true, user: { select: { id: true, name: true, email: true } } } },
    },
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
      console.error("[Pesapal] GetTransactionStatus failed:", err.message, "| code:", err.code);
      // PesaPal returned an error (e.g. order not found, API issue).
      // Treat as PENDING so the user isn't shown a failure for a payment that may have succeeded.
      // The IPN POST (server-to-server) will update the subscription when PesaPal processes it.
      return { outcome: "PENDING", statusCode: null };
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

      // ── Notify user (fire-and-forget — never block the IPN response) ────────
      const user = sub.profile?.user;
      const slug = sub.profile?.slug ?? "";
      if (user?.email) {
        Promise.allSettled([
          notifyPaymentConfirmed({
            userId:    user.id,
            email:     user.email,
            name:      user.name ?? "there",
            tierName:  sub.tier.displayName ?? sub.tier.name,
            amount:    sub.amountPaid ? Number(sub.amountPaid) : 0,
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
