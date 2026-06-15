// app/api/cron/expire-subscriptions/route.ts
// Cron job — runs on a schedule to:
//   1. Expire stale subscriptions and deactivate profiles
//   2. Send expiry-warning notifications at 7 / 3 / 1 day thresholds
//
// Set up in vercel.json:
//   { "crons": [{ "path": "/api/cron/expire-subscriptions", "schedule": "0 * * * *" }] }
//   (runs every hour)
//
// The endpoint is protected by a shared secret (CRON_SECRET env var).
// Vercel automatically injects Authorization: Bearer <CRON_SECRET> for cron invocations.
// For other schedulers, pass the same header manually.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deactivateProfile } from "@/lib/profile-activation";
import { notifyListingExpiring } from "@/lib/notifications";

export const runtime = "nodejs"; // needs Prisma — can't run on Edge

// Days before expiry at which we send a warning notification.
// We fire once per window (checked hourly) — guard with a DB flag if you need strict once-per-day.
const EXPIRY_WARNING_DAYS = [7, 3, 1] as const;

export async function GET(req: NextRequest) {
  // ── Auth ─────────────────────────────────────────────────────────────────────
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const authHeader = req.headers.get("Authorization");
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }
  }

  const now   = new Date();
  const start = Date.now();

  // ── 1. Expire subscriptions that have passed their end date ─────────────────
  const expired = await prisma.profileSubscription.findMany({
    where: {
      status:    "ACTIVE",
      expiresAt: { lt: now },
    },
    select: {
      id:        true,
      profileId: true,
      tierId:    true,
      expiresAt: true,
      profile:   { select: { user: { select: { email: true } } } },
    },
  });

  const expiryResults: Array<{
    subscriptionId: string;
    profileId:      string;
    listingActive:  boolean;
    error?:         string;
  }> = [];

  if (expired.length > 0) {
    console.info(`[Cron/ExpireSubs] Found ${expired.length} expired subscription(s) to process`);

    for (const sub of expired) {
      try {
        await prisma.profileSubscription.update({
          where: { id: sub.id },
          data:  { status: "EXPIRED" },
        });

        const activation = await deactivateProfile(sub.profileId, "SUBSCRIPTION_EXPIRED");

        expiryResults.push({
          subscriptionId: sub.id,
          profileId:      sub.profileId,
          listingActive:  activation.listingActive,
        });

        console.info(
          `[Cron/ExpireSubs] Expired sub ${sub.id} — profile ${sub.profileId}, ` +
          `listingActive=${activation.listingActive}`
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[Cron/ExpireSubs] Failed to expire sub ${sub.id}:`, msg);
        expiryResults.push({
          subscriptionId: sub.id,
          profileId:      sub.profileId,
          listingActive:  false,
          error:          msg,
        });
      }
    }
  }

  // ── 2. Send expiry-warning notifications at 7 / 3 / 1 day thresholds ────────
  // For each threshold, find subscriptions that expire within a 1-hour window
  // centred on exactly N days from now. The hourly cron means we'll hit each
  // threshold once (±30 min). This avoids duplicate notifications without needing
  // an extra DB flag.

  const warningResults: Array<{ subscriptionId: string; daysLeft: number; error?: string }> = [];

  for (const daysLeft of EXPIRY_WARNING_DAYS) {
    const windowStart = new Date(now.getTime() + daysLeft * 86_400_000 - 30 * 60_000);
    const windowEnd   = new Date(now.getTime() + daysLeft * 86_400_000 + 30 * 60_000);

    const expiringSoon = await prisma.profileSubscription.findMany({
      where: {
        status:    "ACTIVE",
        expiresAt: { gte: windowStart, lt: windowEnd },
      },
      select: {
        id:        true,
        expiresAt: true,
        tier:      { select: { name: true, displayName: true } },
        profile:   {
          select: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    for (const sub of expiringSoon) {
      const user = sub.profile?.user;
      if (!user?.email) continue;

      try {
        await notifyListingExpiring({
          userId:    user.id,
          email:     user.email,
          name:      user.name ?? "there",
          tierName:  sub.tier.displayName ?? sub.tier.name,
          daysLeft,
          expiresAt: sub.expiresAt ?? new Date(),
        });

        warningResults.push({ subscriptionId: sub.id, daysLeft });
        console.info(`[Cron/ExpireSubs] Sent ${daysLeft}-day warning for sub ${sub.id}`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[Cron/ExpireSubs] Warning notification failed for sub ${sub.id}:`, msg);
        warningResults.push({ subscriptionId: sub.id, daysLeft, error: msg });
      }
    }
  }

  // ── Response ─────────────────────────────────────────────────────────────────
  const deactivated    = expiryResults.filter((r) => !r.listingActive && !r.error).length;
  const expiryErrors   = expiryResults.filter((r) => r.error).length;
  const warningErrors  = warningResults.filter((r) => r.error).length;

  return NextResponse.json({
    ok:              expiryErrors === 0 && warningErrors === 0,
    expired:         expired.length,
    deactivated,
    expiryErrors,
    warningsSent:    warningResults.filter((r) => !r.error).length,
    warningErrors,
    duration:        Date.now() - start,
    expiryResults,
    warningResults,
  });
}
