// app/api/admin/approve/route.ts
// Admin approves, suspends, or re-pends a masseuse profile.
// After any status change, syncProfileActivation() re-evaluates listingActive:
//   APPROVE  → listingActive becomes true IF a valid subscription also exists
//   SUSPEND  → listingActive becomes false immediately
//   PENDING  → listingActive becomes false immediately

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { syncProfileActivation } from "@/lib/profile-activation";

const ApproveSchema = z.object({
  profileId: z.string(),
  action:    z.enum(["APPROVE", "SUSPEND", "BAN", "PENDING"]),
  reason:    z.string().max(500).optional(),
});

const STATUS_MAP = {
  APPROVE: "APPROVED",
  SUSPEND: "SUSPENDED",
  BAN:     "BANNED",
  PENDING: "PENDING",
} as const;

const ACTION_MAP = {
  APPROVE: "PROFILE_APPROVED",
  SUSPEND: "PROFILE_SUSPENDED",
  BAN:     "PROFILE_BANNED",
  PENDING: "PROFILE_REINSTATED", // re-pend = undo approval for re-review
} as const;

const ACTIVATION_REASON_MAP = {
  APPROVE: "ADMIN_APPROVED",
  SUSPEND: "ADMIN_SUSPENDED",
  BAN:     "ADMIN_BANNED",
  PENDING: "ADMIN_SUSPENDED",
} as const;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body   = await req.json();
  const parsed = ApproveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { profileId, action, reason } = parsed.data;
  const newStatus = STATUS_MAP[action];

  // ── Update profile status + log AdminAction ───────────────────────────────
  const profile = await prisma.masseuseProfile.update({
    where:   { id: profileId },
    data: {
      status:     newStatus,
      approvedAt: action === "APPROVE" ? new Date() : undefined,
    },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  await prisma.adminAction.create({
    data: {
      adminId:         session.user.id,
      targetUserId:    profile.user.id,
      targetProfileId: profileId,
      actionType:      ACTION_MAP[action],
      reason:          reason ?? `Admin action: ${action}`,
    },
  });

  // ── Re-evaluate listingActive based on new status + existing subscriptions ──
  const activation = await syncProfileActivation(
    profileId,
    ACTIVATION_REASON_MAP[action] as any
  );

  return NextResponse.json({
    profileId,
    status:        profile.status,
    listingActive: activation.listingActive,
    user:          profile.user,
  });
}
