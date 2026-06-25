// app/api/admin/payouts/route.ts
// GET  — list all payouts with filters
// POST — trigger a manual payout for a specific profile (admin-initiated)

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  sendB2CPayment,
  normaliseMpesaPhone,
  isDarajaConfigured,
  MpesaError,
} from "@/lib/mpesa";
import { z } from "zod";

const COMMISSION_RATE   = Number(process.env.PLATFORM_COMMISSION_PERCENT ?? "10") / 100;
const UNLOCK_COMMISSION = 0.25; // 25% platform cut on video unlocks
const DIRECT_COMMISSION = 0.10; // 10% platform cut on direct payments

// ── GET /api/admin/payouts ───────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const status  = searchParams.get("status") ?? undefined;
  const page    = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const perPage = 20;

  const [payouts, total, summary, noPhoneModels, unpaidBookings, unpaidUnlocks, unpaidDirect] = await Promise.all([
    prisma.payout.findMany({
      where:   status ? { status: status as any } : {},
      orderBy: { createdAt: "desc" },
      skip:    (page - 1) * perPage,
      take:    perPage,
      include: {
        profile: {
          select: {
            id:          true,
            slug:        true,
            payoutPhone: true,
            user:        { select: { name: true, email: true } },
          },
        },
      },
    }),
    prisma.payout.count({ where: status ? { status: status as any } : {} }),
    // Payout totals summary
    prisma.payout.groupBy({
      by:     ["status"],
      _sum:   { netAmount: true },
      _count: { id: true },
    }),
    // APPROVED models with no payout phone — can't receive payouts
    prisma.masseuseProfile.findMany({
      where:  { status: "APPROVED", listingActive: true, payoutPhone: null },
      select: {
        id:   true,
        slug: true,
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    // Unpaid completed bookings per profile
    prisma.booking.groupBy({
      by:    ["profileId"],
      where: { status: "COMPLETED", payoutId: null, payment: { status: "COMPLETED" } },
      _sum:  { totalAmount: true },
      _count: { id: true },
    }),
    // Unpaid video unlocks (profileId is on the video relation — fetch flat)
    prisma.videoUnlock.findMany({
      where:  { status: "COMPLETED", payoutId: null },
      select: { amountPaid: true, video: { select: { profileId: true } } },
    }),
    // Unpaid direct payments per profile
    prisma.directPayment.groupBy({
      by:    ["profileId"],
      where: { status: "COMPLETED", payoutId: null },
      _sum:  { amount: true },
      _count: { id: true },
    }),
  ]);

  // ── Merge pending earnings by profileId ───────────────────────────────────
  const pendingMap = new Map<string, {
    bookingsGross: number;
    unlocksGross:  number;
    directGross:   number;
  }>();

  const ensure = (pid: string) => {
    if (!pendingMap.has(pid)) pendingMap.set(pid, { bookingsGross: 0, unlocksGross: 0, directGross: 0 });
    return pendingMap.get(pid)!;
  };

  for (const b of unpaidBookings)  ensure(b.profileId).bookingsGross += Number(b._sum.totalAmount ?? 0);
  for (const u of unpaidUnlocks)   ensure(u.video.profileId).unlocksGross  += Number(u.amountPaid ?? 0);
  for (const d of unpaidDirect)    ensure(d.profileId).directGross  += Number(d._sum.amount ?? 0);

  // Fetch profile info for models with pending earnings
  const pendingProfileIds = Array.from(pendingMap.keys());
  const pendingProfiles   = pendingProfileIds.length > 0
    ? await prisma.masseuseProfile.findMany({
        where:  { id: { in: pendingProfileIds } },
        select: {
          id:          true,
          slug:        true,
          payoutPhone: true,
          user:        { select: { name: true, email: true } },
        },
      })
    : [];

  const profileById = Object.fromEntries(pendingProfiles.map((p) => [p.id, p]));

  const pendingEarnings = pendingProfileIds
    .map((pid) => {
      const e             = pendingMap.get(pid)!;
      const bookingsNet   = e.bookingsGross * (1 - COMMISSION_RATE);
      const unlocksNet    = e.unlocksGross  * (1 - UNLOCK_COMMISSION);
      const directNet     = e.directGross   * (1 - DIRECT_COMMISSION);
      const totalGross    = e.bookingsGross + e.unlocksGross + e.directGross;
      const totalNet      = bookingsNet + unlocksNet + directNet;
      const commission    = totalGross - totalNet;
      return {
        profileId:     pid,
        profile:       profileById[pid] ?? null,
        bookingsGross: Math.round(e.bookingsGross * 100) / 100,
        unlocksGross:  Math.round(e.unlocksGross  * 100) / 100,
        directGross:   Math.round(e.directGross   * 100) / 100,
        totalGross:    Math.round(totalGross    * 100) / 100,
        commission:    Math.round(commission    * 100) / 100,
        netAmount:     Math.round(totalNet      * 100) / 100,
      };
    })
    .filter((e) => e.profile !== null)
    .sort((a, b) => b.netAmount - a.netAmount);

  return NextResponse.json({ payouts, total, page, perPage, summary, noPhoneModels, pendingEarnings });
}

// ── POST /api/admin/payouts — trigger manual payout ──────────────────────────
const ManualPayoutSchema = z.object({
  profileId: z.string(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  if (!isDarajaConfigured()) {
    return NextResponse.json({ error: "Daraja B2C not configured" }, { status: 503 });
  }

  const body   = await req.json().catch(() => ({}));
  const parsed = ManualPayoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "profileId required" }, { status: 400 });
  }

  const { profileId } = parsed.data;

  const profile = await prisma.masseuseProfile.findUnique({
    where:  { id: profileId },
    select: {
      id:          true,
      payoutPhone: true,
      user:        { select: { id: true, name: true } },
    },
  });

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }
  if (!profile.payoutPhone) {
    return NextResponse.json({ error: "No payout phone registered for this profile" }, { status: 422 });
  }

  // Find all unpaid completed earnings for this profile
  const [bookings, videoUnlocks, directPayments] = await Promise.all([
    prisma.booking.findMany({
      where: { profileId, status: "COMPLETED", payoutId: null, payment: { status: "COMPLETED" } },
    }),
    prisma.videoUnlock.findMany({
      where: { status: "COMPLETED", payoutId: null, video: { profileId } },
    }),
    prisma.directPayment.findMany({
      where: { profileId, status: "COMPLETED", payoutId: null },
    }),
  ]);

  if (bookings.length === 0 && videoUnlocks.length === 0 && directPayments.length === 0) {
    return NextResponse.json({ error: "No unpaid completed earnings for this profile" }, { status: 422 });
  }

  const bookingsGross = bookings.reduce((s, b) => s + Number(b.totalAmount), 0);
  const unlocksGross  = videoUnlocks.reduce((s, u) => s + Number(u.amountPaid), 0);
  const directGross   = directPayments.reduce((s, d) => s + Number(d.amount), 0);

  const bookingsNet   = bookingsGross * (1 - COMMISSION_RATE);
  const unlocksNet    = unlocksGross  * (1 - UNLOCK_COMMISSION);
  const directNet     = directGross   * (1 - DIRECT_COMMISSION);

  const grossAmount   = Math.round((bookingsGross + unlocksGross + directGross) * 100) / 100;
  const netAmount     = Math.round((bookingsNet   + unlocksNet   + directNet)   * 100) / 100;
  const commission    = Math.round((grossAmount   - netAmount)                  * 100) / 100;

  let phone: string;
  try {
    phone = normaliseMpesaPhone(profile.payoutPhone);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 422 });
  }

  // Create payout record
  const now    = new Date();
  const payout = await prisma.payout.create({
    data: {
      profileId,
      userId:      profile.user.id,
      grossAmount,
      commission,
      netAmount,
      mpesaPhone:  phone,
      status:      "PENDING",
      periodStart: new Date(now.getTime() - 7 * 86_400_000),
      periodEnd:   now,
      notes:       `Manual payout triggered by admin ${session.user.email}`,
    },
  });

  await Promise.all([
    bookings.length > 0
      ? prisma.booking.updateMany({
          where: { id: { in: bookings.map((b) => b.id) } },
          data:  { payoutId: payout.id },
        })
      : Promise.resolve(),
    videoUnlocks.length > 0
      ? prisma.videoUnlock.updateMany({
          where: { id: { in: videoUnlocks.map((u) => u.id) } },
          data:  { payoutId: payout.id },
        })
      : Promise.resolve(),
    directPayments.length > 0
      ? prisma.directPayment.updateMany({
          where: { id: { in: directPayments.map((d) => d.id) } },
          data:  { payoutId: payout.id },
        })
      : Promise.resolve(),
  ]);

  // Send B2C
  try {
    const b2c = await sendB2CPayment({
      phone,
      amount:    netAmount,
      reference: `PAYOUT-${payout.id.slice(-8).toUpperCase()}`,
      remarks:   `mconnect payout – ${profile.user.name}`,
    });

    await prisma.payout.update({
      where: { id: payout.id },
      data:  {
        status:               "PROCESSING",
        darajaConversationId: b2c.conversationId,
        darajaOriginatorId:   b2c.originatorConversationId,
        processedAt:          new Date(),
      },
    });

    return NextResponse.json({
      ok:        true,
      payoutId:  payout.id,
      netAmount,
      status:    "PROCESSING",
      convId:    b2c.conversationId,
    });
  } catch (err) {
    const msg = err instanceof MpesaError ? err.message : String(err);
    await prisma.payout.update({
      where: { id: payout.id },
      data:  { status: "FAILED", failureReason: msg },
    });
    return NextResponse.json({ error: msg, payoutId: payout.id }, { status: 502 });
  }
}
