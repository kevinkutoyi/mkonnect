// app/api/cron/weekly-payouts/route.ts
// Weekly cron — calculates masseuse earnings, deducts platform commission,
// creates Payout records, and fires Daraja B2C for each.
//
// Runs every Monday at 08:00 EAT. Set up in vercel.json:
//   { "crons": [{ "path": "/api/cron/weekly-payouts", "schedule": "0 5 * * 1" }] }
//   (5:00 UTC = 8:00 EAT)
//
// Protected by CRON_SECRET header.
// Platform commission rate: PLATFORM_COMMISSION_PERCENT env var (default: 10)

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  sendB2CPayment,
  normaliseMpesaPhone,
  isDarajaConfigured,
  MpesaError,
} from "@/lib/mpesa";

export const runtime = "nodejs";

const COMMISSION_RATE =
  Number(process.env.PLATFORM_COMMISSION_PERCENT ?? "10") / 100;

export async function GET(req: NextRequest) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const secret = process.env.CRON_SECRET;
  if (secret) {
    if (req.headers.get("Authorization") !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }
  }

  if (!isDarajaConfigured()) {
    return NextResponse.json({
      ok: false,
      error: "Daraja B2C not configured. Set MPESA_* env vars.",
    }, { status: 503 });
  }

  const now   = new Date();
  const start = Date.now();

  // Period: last 7 days
  const periodEnd   = now;
  const periodStart = new Date(now.getTime() - 7 * 86_400_000);

  // ── Find completed bookings not yet in a payout ───────────────────────────
  const bookings = await prisma.booking.findMany({
    where: {
      status:    "COMPLETED",
      payoutId:  null,
      completedAt: { gte: periodStart, lt: periodEnd },
      payment: { status: "COMPLETED" },
    },
    include: {
      profile: {
        select: {
          id:          true,
          payoutPhone: true,
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      },
    },
  });

  if (bookings.length === 0) {
    return NextResponse.json({
      ok:       true,
      payouts:  0,
      message:  "No completed bookings to pay out",
      duration: Date.now() - start,
    });
  }

  // ── Group by profile ──────────────────────────────────────────────────────
  const byProfile = new Map<
    string,
    {
      profileId:   string;
      userId:      string;
      name:        string;
      email:       string;
      payoutPhone: string | null;
      bookingIds:  string[];
      grossAmount: number;
    }
  >();

  for (const b of bookings) {
    const { profile } = b;
    if (!byProfile.has(profile.id)) {
      byProfile.set(profile.id, {
        profileId:   profile.id,
        userId:      profile.user.id,
        name:        profile.user.name,
        email:       profile.user.email,
        payoutPhone: profile.payoutPhone,
        bookingIds:  [],
        grossAmount: 0,
      });
    }
    const entry = byProfile.get(profile.id)!;
    entry.bookingIds.push(b.id);
    entry.grossAmount += Number(b.totalAmount);
  }

  // ── Process each masseuse ─────────────────────────────────────────────────
  const results: Array<{
    profileId:  string;
    name:       string;
    netAmount:  number;
    status:     string;
    payoutId?:  string;
    error?:     string;
  }> = [];

  for (const entry of byProfile.values()) {
    // Skip if no payout phone registered
    if (!entry.payoutPhone) {
      results.push({
        profileId: entry.profileId,
        name:      entry.name,
        netAmount: 0,
        status:    "SKIPPED_NO_PHONE",
        error:     "No payout phone registered",
      });
      continue;
    }

    const grossAmount = entry.grossAmount;
    const commission  = Math.round(grossAmount * COMMISSION_RATE * 100) / 100;
    const netAmount   = Math.round((grossAmount - commission) * 100) / 100;

    if (netAmount < 1) {
      results.push({
        profileId: entry.profileId,
        name:      entry.name,
        netAmount,
        status:    "SKIPPED_BELOW_MINIMUM",
        error:     "Net amount below KES 1",
      });
      continue;
    }

    // Normalise phone
    let phone: string;
    try {
      phone = normaliseMpesaPhone(entry.payoutPhone);
    } catch {
      results.push({
        profileId: entry.profileId,
        name:      entry.name,
        netAmount,
        status:    "SKIPPED_INVALID_PHONE",
        error:     `Invalid phone: ${entry.payoutPhone}`,
      });
      continue;
    }

    // Create payout record
    const payout = await prisma.payout.create({
      data: {
        profileId:   entry.profileId,
        userId:      entry.userId,
        grossAmount,
        commission,
        netAmount,
        mpesaPhone:  phone,
        status:      "PENDING",
        periodStart,
        periodEnd,
      },
    });

    // Tag bookings with this payout
    await prisma.booking.updateMany({
      where: { id: { in: entry.bookingIds } },
      data:  { payoutId: payout.id },
    });

    // Send B2C
    try {
      const b2c = await sendB2CPayment({
        phone,
        amount:    netAmount,
        reference: `PAYOUT-${payout.id.slice(-8).toUpperCase()}`,
        remarks:   `mconnect weekly payout – ${entry.name}`,
      });

      await prisma.payout.update({
        where: { id: payout.id },
        data:  {
          status:                  "PROCESSING",
          darajaConversationId:    b2c.conversationId,
          darajaOriginatorId:      b2c.originatorConversationId,
          processedAt:             new Date(),
        },
      });

      results.push({
        profileId: entry.profileId,
        name:      entry.name,
        netAmount,
        status:    "PROCESSING",
        payoutId:  payout.id,
      });

      console.info(
        `[WeeklyPayout] ${entry.name} — KES ${netAmount} → ${phone} ` +
        `(conv=${b2c.conversationId})`
      );
    } catch (err) {
      const msg = err instanceof MpesaError ? err.message : String(err);
      await prisma.payout.update({
        where: { id: payout.id },
        data:  { status: "FAILED", failureReason: msg },
      });

      results.push({
        profileId: entry.profileId,
        name:      entry.name,
        netAmount,
        status:    "FAILED",
        payoutId:  payout.id,
        error:     msg,
      });

      console.error(`[WeeklyPayout] Failed for ${entry.name}:`, msg);
    }
  }

  const processing = results.filter((r) => r.status === "PROCESSING").length;
  const failed     = results.filter((r) => r.status === "FAILED").length;
  const skipped    = results.filter((r) => r.status.startsWith("SKIPPED")).length;

  return NextResponse.json({
    ok:          failed === 0,
    periodStart: periodStart.toISOString(),
    periodEnd:   periodEnd.toISOString(),
    bookings:    bookings.length,
    masseuses:   byProfile.size,
    processing,
    failed,
    skipped,
    duration:    Date.now() - start,
    results,
  });
}
