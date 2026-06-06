// app/api/cron/expire-subscriptions/route.ts
// Cron job — runs on a schedule to expire stale subscriptions and deactivate profiles.
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

export const runtime = "nodejs"; // needs Prisma — can't run on Edge

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

  // ── Find subscriptions that have expired but are still marked ACTIVE ─────────
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

  if (expired.length === 0) {
    return NextResponse.json({
      ok:       true,
      expired:  0,
      duration: Date.now() - start,
    });
  }

  console.info(`[Cron/ExpireSubs] Found ${expired.length} expired subscription(s) to process`);

  // ── Process in batches of 10 to avoid long Prisma transactions ───────────────
  const results: Array<{
    subscriptionId: string;
    profileId:      string;
    listingActive:  boolean;
    error?:         string;
  }> = [];

  for (const sub of expired) {
    try {
      // Mark subscription as EXPIRED
      await prisma.profileSubscription.update({
        where: { id: sub.id },
        data:  { status: "EXPIRED" },
      });

      // Deactivate profile if no other active subscription remains
      const activation = await deactivateProfile(sub.profileId, "SUBSCRIPTION_EXPIRED");

      results.push({
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
      results.push({
        subscriptionId: sub.id,
        profileId:      sub.profileId,
        listingActive:  false,
        error:          msg,
      });
    }
  }

  const deactivated = results.filter((r) => !r.listingActive && !r.error).length;
  const errors      = results.filter((r) => r.error).length;

  return NextResponse.json({
    ok:          errors === 0,
    expired:     expired.length,
    deactivated,
    errors,
    duration:    Date.now() - start,
    results,
  });
}
