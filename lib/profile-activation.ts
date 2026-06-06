// lib/profile-activation.ts
// Single source of truth for profile public-listing eligibility.
//
// A masseuse profile is publicly listed ONLY when BOTH conditions are true:
//   1. MasseuseProfile.status === "APPROVED"  (admin reviewed and approved)
//   2. At least one ProfileSubscription with status="ACTIVE" and expiresAt > now
//
// The result is denormalized into MasseuseProfile.listingActive (Boolean) so that
// every public query is a simple indexed WHERE clause — no subquery joins at read time.
//
// All writes that can affect either condition must call one of these functions:
//   activateProfile()    — subscription confirmed as ACTIVE
//   deactivateProfile()  — subscription expired / failed / reversed
//   syncProfileActivation() — re-evaluate both conditions (admin status change, etc.)

import { prisma } from "@/lib/prisma";
import type { AdminActionType } from "@prisma/client";

// ─── Types ────────────────────────────────────────────────────────────────────
export type ActivationReason =
  | "SUBSCRIPTION_ACTIVATED"
  | "SUBSCRIPTION_EXPIRED"
  | "SUBSCRIPTION_FAILED"
  | "SUBSCRIPTION_CANCELLED"
  | "ADMIN_APPROVED"
  | "ADMIN_SUSPENDED"
  | "ADMIN_BANNED"
  | "ADMIN_REINSTATED"
  | "ADMIN_OVERRIDE";

export interface ActivationResult {
  profileId:     string;
  listingActive: boolean;
  reason:        ActivationReason;
  /** True if listingActive actually changed (was different before) */
  changed:       boolean;
}

// ─── Core: evaluate both conditions and write listingActive ───────────────────
/**
 * Re-evaluates both conditions (admin approval + active subscription) and
 * updates MasseuseProfile.listingActive accordingly.
 *
 * Safe to call multiple times — idempotent.
 */
export async function syncProfileActivation(
  profileId: string,
  reason: ActivationReason
): Promise<ActivationResult> {
  const profile = await prisma.masseuseProfile.findUnique({
    where:  { id: profileId },
    select: {
      status:        true,
      listingActive: true,
      subscriptions: {
        where: {
          status:    "ACTIVE",
          expiresAt: { gt: new Date() },
        },
        take: 1,
        select: { id: true },
      },
    },
  });

  if (!profile) {
    throw new Error(`[ProfileActivation] Profile not found: ${profileId}`);
  }

  const isAdminApproved   = profile.status === "APPROVED";
  const hasActiveSub      = profile.subscriptions.length > 0;
  const shouldBeActive    = isAdminApproved && hasActiveSub;
  const alreadyCorrect    = profile.listingActive === shouldBeActive;

  if (!alreadyCorrect) {
    await prisma.masseuseProfile.update({
      where: { id: profileId },
      data:  { listingActive: shouldBeActive },
    });
  }

  return {
    profileId,
    listingActive: shouldBeActive,
    reason,
    changed: !alreadyCorrect,
  };
}

// ─── Convenience: called after subscription activates ────────────────────────
/**
 * Call this after a ProfileSubscription transitions to ACTIVE.
 * Sets listing tier denormalized fields AND evaluates listingActive.
 */
export async function activateProfile(opts: {
  profileId:      string;
  tierId:         number;
  tierName:       string;
  searchBoost:    number;
  featuredSlots:  number;
  expiresAt:      Date;
  reason?:        ActivationReason;
}): Promise<ActivationResult> {
  const {
    profileId, tierId, tierName, searchBoost, featuredSlots, expiresAt,
    reason = "SUBSCRIPTION_ACTIVATED",
  } = opts;

  await prisma.masseuseProfile.update({
    where: { id: profileId },
    data: {
      activeTierId:   tierId,
      activeTierName: tierName as any,
      profileScore:   searchBoost,
      isFeatured:     featuredSlots > 0,
      featuredUntil:  featuredSlots > 0 ? expiresAt : null,
    },
  });

  return syncProfileActivation(profileId, reason);
}

// ─── Convenience: called when subscription expires / fails / reverses ─────────
/**
 * Call this after a ProfileSubscription transitions away from ACTIVE.
 * Clears tier denormalized fields if no other active subscription remains.
 */
export async function deactivateProfile(
  profileId: string,
  reason: ActivationReason = "SUBSCRIPTION_EXPIRED"
): Promise<ActivationResult> {
  // Check if any OTHER active subscription remains (e.g. admin granted one while another expired)
  const otherActiveSub = await prisma.profileSubscription.findFirst({
    where: {
      profileId,
      status:    "ACTIVE",
      expiresAt: { gt: new Date() },
    },
    include: { tier: true },
  });

  if (!otherActiveSub) {
    // No active sub at all — clear tier fields
    await prisma.masseuseProfile.update({
      where: { id: profileId },
      data: {
        activeTierId:   null,
        activeTierName: "REGULAR",
        profileScore:   0,
        isFeatured:     false,
        featuredUntil:  null,
      },
    });
  } else {
    // Promote the next active sub's tier
    await prisma.masseuseProfile.update({
      where: { id: profileId },
      data: {
        activeTierId:   otherActiveSub.tierId,
        activeTierName: otherActiveSub.tier.name,
        profileScore:   otherActiveSub.tier.searchBoost,
        isFeatured:     otherActiveSub.tier.featuredSlots > 0,
        featuredUntil:  otherActiveSub.tier.featuredSlots > 0
          ? otherActiveSub.expiresAt
          : null,
      },
    });
  }

  return syncProfileActivation(profileId, reason);
}

// ─── Check visibility without modifying state ─────────────────────────────────
/**
 * Returns true if the profile should be publicly visible right now.
 * Does NOT write to the DB — use for read-time checks only.
 */
export async function isProfilePubliclyVisible(profileId: string): Promise<boolean> {
  const profile = await prisma.masseuseProfile.findUnique({
    where:  { id: profileId },
    select: { listingActive: true },
  });
  return profile?.listingActive ?? false;
}

/**
 * Same check by slug (used in public profile page).
 */
export async function isSlugPubliclyVisible(slug: string): Promise<boolean> {
  const profile = await prisma.masseuseProfile.findUnique({
    where:  { slug },
    select: { listingActive: true },
  });
  return profile?.listingActive ?? false;
}

// ─── The public-listing WHERE clause — used in every public Prisma query ──────
/**
 * Import this constant and spread it into your Prisma `where` clause.
 *
 * Usage:
 *   where: { ...PUBLIC_PROFILE_FILTER, cityId: 5 }
 *
 * Equivalent to:
 *   WHERE status = 'APPROVED' AND listing_active = true
 */
export const PUBLIC_PROFILE_FILTER = {
  status:        "APPROVED" as const,
  listingActive: true,
} satisfies { status: "APPROVED"; listingActive: true };
