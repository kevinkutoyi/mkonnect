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

const COMMISSION_RATE =
  Number(process.env.PLATFORM_COMMISSION_PERCENT ?? "10") / 100;

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

  const [payouts, total, summary, noPhoneModels] = await Promise.all([
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
  ]);

  return NextResponse.json({ payouts, total, page, perPage, summary, noPhoneModels });
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

  // Find unpaid completed bookings
  const bookings = await prisma.booking.findMany({
    where: {
      profileId,
      status:   "COMPLETED",
      payoutId: null,
      payment:  { status: "COMPLETED" },
    },
  });

  if (bookings.length === 0) {
    return NextResponse.json({ error: "No unpaid completed bookings" }, { status: 422 });
  }

  const grossAmount = bookings.reduce((s, b) => s + Number(b.totalAmount), 0);
  const commission  = Math.round(grossAmount * COMMISSION_RATE * 100) / 100;
  const netAmount   = Math.round((grossAmount - commission) * 100) / 100;

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

  await prisma.booking.updateMany({
    where: { id: { in: bookings.map((b) => b.id) } },
    data:  { payoutId: payout.id },
  });

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
