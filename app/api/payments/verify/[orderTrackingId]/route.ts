// app/api/payments/verify/[orderTrackingId]/route.ts
// GET — poll this endpoint to check the live status of a payment.
// Used by the frontend when the user is on the pending screen.
// Returns a normalized status + subscription details without exposing raw Pesapal data.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTransactionStatus, PesapalError } from "@/lib/pesapal";

interface RouteParams {
  params: { orderTrackingId: string };
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }

  const { orderTrackingId } = params;
  if (!orderTrackingId) {
    return NextResponse.json({ error: "Missing orderTrackingId" }, { status: 400 });
  }

  // ── Load subscription from DB ───────────────────────────────────────────────
  const sub = await prisma.profileSubscription.findFirst({
    where: { orderTrackingId },
    include: {
      tier:    { select: { name: true, displayName: true, badge: true } },
      profile: { select: { userId: true } },
    },
  });

  if (!sub) {
    return NextResponse.json({ error: "Transaction not found." }, { status: 404 });
  }

  // ── Authorization: only the owning masseuse or an admin ────────────────────
  const isOwner = sub.profile?.userId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  // ── If already in a terminal state, return from DB (no Pesapal call) ───────
  if (sub.status === "ACTIVE" || sub.status === "FAILED" || sub.status === "CANCELLED") {
    return NextResponse.json({
      status:            sub.status,
      tierName:          sub.tier.name,
      tierDisplayName:   sub.tier.displayName,
      tierBadge:         sub.tier.badge,
      expiresAt:         sub.expiresAt?.toISOString() ?? null,
      paidAt:            sub.paidAt?.toISOString() ?? null,
      merchantReference: sub.merchantReference,
      orderTrackingId,
    });
  }

  // ── Still PENDING — check live with Pesapal ─────────────────────────────────
  try {
    const txStatus = await getTransactionStatus(orderTrackingId);

    // Map Pesapal status_code → app status
    let appStatus: string;
    switch (txStatus.status_code) {
      case 2:  appStatus = "ACTIVE";    break;
      case 3:  appStatus = "FAILED";    break;
      case 4:  appStatus = "CANCELLED"; break;
      case 1:
      default: appStatus = "PENDING";   break;
    }

    // If Pesapal says completed/failed, trigger activation in the background
    // (the IPN should have done this already, but this is a safety net)
    if (txStatus.status_code === 2 && sub.status === "PENDING") {
      // Fire and forget — the full activation logic lives in the callback route
      fetch(
        `${process.env.NEXTAUTH_URL}/api/tiers/callback?OrderTrackingId=${orderTrackingId}&OrderMerchantReference=${sub.merchantReference}`
      ).catch(() => {});
    }

    return NextResponse.json({
      status:                    appStatus,
      pesapalStatus:             txStatus.payment_status_description,
      pesapalStatusCode:         txStatus.status_code,
      tierName:                  sub.tier.name,
      tierDisplayName:           sub.tier.displayName,
      tierBadge:                 sub.tier.badge,
      confirmationCode:          txStatus.confirmation_code ?? null,
      paymentMethod:             txStatus.payment_method ?? null,
      amount:                    txStatus.amount,
      expiresAt:                 sub.expiresAt?.toISOString() ?? null,
      paidAt:                    sub.paidAt?.toISOString() ?? null,
      merchantReference:         sub.merchantReference,
      orderTrackingId,
    });
  } catch (err) {
    if (err instanceof PesapalError) {
      console.error("[Verify] Pesapal error:", err.message);
      return NextResponse.json(
        { error: `Could not verify payment: ${err.message}`, status: sub.status },
        { status: 502 }
      );
    }
    console.error("[Verify] Unexpected error:", err);
    return NextResponse.json({ error: "Verification failed.", status: sub.status }, { status: 500 });
  }
}
