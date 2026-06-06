// app/api/admin/payments/[id]/verify/route.ts
// POST — admin triggers a live Pesapal status check for a PENDING subscription.
// If Pesapal reports Completed, activates the subscription automatically.
// If Pesapal reports Failed/Reversed, marks it accordingly.
// Safe to call on already-terminal subscriptions (idempotent).

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getTransactionStatus,
  PesapalError,
  pesapalCodeToSubscriptionStatus,
} from "@/lib/pesapal";
import { activateProfile, deactivateProfile } from "@/lib/profile-activation";

interface RouteParams {
  params: { id: string };
}

export async function POST(_req: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  // ── Load subscription ─────────────────────────────────────────────────────
  const sub = await prisma.profileSubscription.findUnique({
    where:   { id: params.id },
    include: {
      tier:    true,
      profile: { select: { id: true, status: true, listingActive: true } },
    },
  });

  if (!sub) {
    return NextResponse.json({ error: "Subscription not found." }, { status: 404 });
  }

  // ── Already terminal — return current state without hitting Pesapal ───────
  if (sub.status === "ACTIVE") {
    return NextResponse.json({
      subscriptionId: sub.id,
      outcome:        "ALREADY_ACTIVE",
      status:         sub.status,
      listingActive:  sub.profile?.listingActive ?? false,
    });
  }

  if (!sub.orderTrackingId) {
    return NextResponse.json(
      {
        error: "No Pesapal orderTrackingId on this subscription. Use manual confirm instead.",
        subscriptionId: sub.id,
      },
      { status: 422 }
    );
  }

  // ── Call Pesapal ──────────────────────────────────────────────────────────
  let txStatus;
  try {
    txStatus = await getTransactionStatus(sub.orderTrackingId);
  } catch (err) {
    const msg = err instanceof PesapalError ? err.message : "Pesapal unreachable";
    console.error("[AdminVerify] Pesapal error:", msg);
    return NextResponse.json({ error: `Pesapal check failed: ${msg}` }, { status: 502 });
  }

  const code       = txStatus.status_code;
  const appStatus  = pesapalCodeToSubscriptionStatus(code);

  // ── Act on the result ─────────────────────────────────────────────────────
  let outcome: string;
  let listingActive = sub.profile?.listingActive ?? false;

  if (code === 2) {
    // Completed → activate
    const now       = new Date();
    const expiresAt = new Date(now.getTime() + sub.tier.durationDays * 86_400_000);

    await prisma.$transaction([
      prisma.profileSubscription.update({
        where: { id: sub.id },
        data: {
          status:    "ACTIVE",
          startsAt:  now,
          expiresAt,
          paidAt:    now,
        },
      }),
      prisma.profileSubscription.updateMany({
        where: { profileId: sub.profileId, id: { not: sub.id }, status: "ACTIVE" },
        data:  { status: "EXPIRED" },
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

    listingActive = activation.listingActive;
    outcome       = "ACTIVATED";

    // Log admin action
    await prisma.adminAction.create({
      data: {
        adminId:         session.user.id,
        targetProfileId: sub.profileId,
        actionType:      "PROFILE_REINSTATED",
        reason:          `Admin triggered Pesapal verify — subscription activated (code ${code})`,
        metadata:        { subscriptionId: sub.id, pesapalCode: code },
      },
    });
  } else if (code === 3) {
    // Failed
    await prisma.profileSubscription.update({
      where: { id: sub.id },
      data:  { status: "FAILED" },
    });
    const act = await deactivateProfile(sub.profileId, "SUBSCRIPTION_FAILED");
    listingActive = act.listingActive;
    outcome       = "FAILED";
  } else if (code === 4) {
    // Reversed
    await prisma.profileSubscription.update({
      where: { id: sub.id },
      data:  { status: "CANCELLED" },
    });
    const act = await deactivateProfile(sub.profileId, "SUBSCRIPTION_CANCELLED");
    listingActive = act.listingActive;
    outcome       = "REVERSED";
  } else {
    // code 1 — still pending
    outcome = "STILL_PENDING";
  }

  return NextResponse.json({
    subscriptionId:           sub.id,
    outcome,
    pesapalStatusCode:        code,
    pesapalStatusDescription: txStatus.payment_status_description,
    confirmationCode:         txStatus.confirmation_code ?? null,
    paymentMethod:            txStatus.payment_method ?? null,
    status:                   appStatus ?? sub.status,
    listingActive,
  });
}
