// app/api/admin/payments/[id]/confirm/route.ts
// POST — admin manually force-confirms a subscription WITHOUT a Pesapal check.
// Use when: Pesapal IPN was missed, M-Pesa payment confirmed offline, admin waiver.
//
// Body: { reason?: string }
// This bypasses Pesapal entirely and goes straight to activation.
// The action is logged to AdminAction with grantedByAdmin=true.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { activateProfile } from "@/lib/profile-activation";
import { z } from "zod";

const BodySchema = z.object({
  reason: z.string().max(500).optional().default("Admin manual confirmation"),
});

interface RouteParams {
  params: { id: string };
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const body   = await req.json().catch(() => ({}));
  const parsed = BodySchema.safeParse(body);
  const reason = parsed.success ? parsed.data.reason : "Admin manual confirmation";

  // ── Load subscription ─────────────────────────────────────────────────────
  const sub = await prisma.profileSubscription.findUnique({
    where:   { id: params.id },
    include: {
      tier:    true,
      profile: {
        select: {
          id:            true,
          status:        true,
          listingActive: true,
          user:          { select: { id: true, name: true, email: true } },
        },
      },
    },
  });

  if (!sub) {
    return NextResponse.json({ error: "Subscription not found." }, { status: 404 });
  }

  if (sub.status === "ACTIVE") {
    return NextResponse.json({
      subscriptionId: sub.id,
      outcome:        "ALREADY_ACTIVE",
      status:         "ACTIVE",
      listingActive:  sub.profile?.listingActive ?? false,
    });
  }

  // ── Activate ──────────────────────────────────────────────────────────────
  const now       = new Date();
  const expiresAt = new Date(now.getTime() + sub.tier.durationDays * 86_400_000);

  await prisma.$transaction([
    // Activate this subscription, mark as admin-granted
    prisma.profileSubscription.update({
      where: { id: sub.id },
      data: {
        status:         "ACTIVE",
        startsAt:       now,
        expiresAt,
        paidAt:         now,
        grantedByAdmin: true,
        grantedReason:  reason,
      },
    }),
    // Expire any other active subs
    prisma.profileSubscription.updateMany({
      where: { profileId: sub.profileId, id: { not: sub.id }, status: "ACTIVE" },
      data:  { status: "EXPIRED" },
    }),
  ]);

  // Activate profile listing
  const activation = await activateProfile({
    profileId:     sub.profileId,
    tierId:        sub.tierId,
    tierName:      sub.tier.name,
    searchBoost:   sub.tier.searchBoost,
    featuredSlots: sub.tier.featuredSlots,
    expiresAt,
    reason:        "ADMIN_OVERRIDE",
  });

  // ── Audit log ─────────────────────────────────────────────────────────────
  await prisma.adminAction.create({
    data: {
      adminId:         session.user.id,
      targetUserId:    sub.profile?.user?.id,
      targetProfileId: sub.profileId,
      actionType:      "PROFILE_REINSTATED",
      reason,
      notes: `Manually confirmed subscription ${sub.id} — ${sub.tier.displayName} tier, expires ${expiresAt.toLocaleDateString("en-KE")}`,
      metadata: {
        subscriptionId:  sub.id,
        tierId:          sub.tierId,
        tierName:        sub.tier.name,
        amountPaid:      sub.amountPaid ? Number(sub.amountPaid) : null,
        grantedByAdmin:  true,
        listingActive:   activation.listingActive,
      },
    },
  });

  console.info(
    `[AdminConfirm] Subscription ${sub.id} manually confirmed by admin ${session.user.id}. ` +
    `Profile ${sub.profileId} listingActive=${activation.listingActive}`
  );

  return NextResponse.json({
    subscriptionId: sub.id,
    outcome:        "CONFIRMED",
    status:         "ACTIVE",
    expiresAt:      expiresAt.toISOString(),
    grantedByAdmin: true,
    listingActive:  activation.listingActive,
    masseuseName:   sub.profile?.user?.name,
    tier:           sub.tier.displayName,
  });
}
