// app/api/admin/profiles/[id]/activation/route.ts
// PATCH — admin manually force-activates or deactivates a masseuse profile listing.
// Used to: preview an unlisted profile, grant a free listing, or suspend a paid listing.
//
// Body: { active: boolean, reason?: string }

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const BodySchema = z.object({
  active: z.boolean(),
  reason: z.string().max(500).optional(),
});

interface RouteParams {
  params: { id: string };
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  // ── Auth ─────────────────────────────────────────────────────────────────────
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  // ── Validate body ─────────────────────────────────────────────────────────────
  const body   = await req.json();
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "VALIDATION_ERROR", fields: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const { active, reason } = parsed.data;
  const profileId = params.id;

  // ── Load profile ──────────────────────────────────────────────────────────────
  const profile = await prisma.masseuseProfile.findUnique({
    where:  { id: profileId },
    select: {
      id:            true,
      listingActive: true,
      status:        true,
      user:          { select: { id: true, name: true } },
    },
  });

  if (!profile) {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }

  // ── Apply override ────────────────────────────────────────────────────────────
  // Admin can set listingActive independently of the payment gate.
  // This is recorded as an AdminAction for audit purposes.
  await prisma.$transaction([
    prisma.masseuseProfile.update({
      where: { id: profileId },
      data:  { listingActive: active },
    }),
    prisma.adminAction.create({
      data: {
        adminId:         session.user.id,
        targetUserId:    profile.user.id,
        targetProfileId: profileId,
        actionType:      active ? "PROFILE_REINSTATED" : "PROFILE_SUSPENDED",
        reason:          reason ?? (active ? "Admin manually activated listing" : "Admin manually deactivated listing"),
        notes:           `listingActive set to ${active} by admin override`,
        metadata: {
          previousListingActive: profile.listingActive,
          overrideBy:            session.user.id,
        },
      },
    }),
  ]);

  return NextResponse.json({
    ok:            true,
    profileId,
    listingActive: active,
    changedFrom:   profile.listingActive,
    actionType:    active ? "PROFILE_REINSTATED" : "PROFILE_SUSPENDED",
  });
}

// GET — return the current activation state and what's blocking it
export async function GET(_req: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const profile = await prisma.masseuseProfile.findUnique({
    where:  { id: params.id },
    select: {
      id:             true,
      status:         true,
      listingActive:  true,
      activeTierName: true,
      user:           { select: { name: true, email: true } },
      subscriptions: {
        where: {
          status:    "ACTIVE",
          expiresAt: { gt: new Date() },
        },
        orderBy: { expiresAt: "desc" },
        take:    1,
        include: { tier: { select: { displayName: true } } },
      },
    },
  });

  if (!profile) {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }

  const activeSub          = profile.subscriptions[0] ?? null;
  const isAdminApproved    = profile.status === "APPROVED";
  const hasActivePayment   = !!activeSub;
  const blockingReasons: string[] = [];

  if (!isAdminApproved) {
    blockingReasons.push(`Profile status is ${profile.status} (must be APPROVED)`);
  }
  if (!hasActivePayment) {
    blockingReasons.push("No active paid subscription");
  }

  return NextResponse.json({
    profileId:       profile.id,
    masseuseName:    profile.user.name,
    masseuseEmail:   profile.user.email,
    status:          profile.status,
    listingActive:   profile.listingActive,
    isAdminApproved,
    hasActivePayment,
    activeTier:      profile.activeTierName,
    activeSubExpiry: activeSub?.expiresAt ?? null,
    blockingReasons,
    canBeActivated:  isAdminApproved && hasActivePayment,
  });
}
