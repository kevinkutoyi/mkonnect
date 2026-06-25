// app/api/admin/payments/route.ts
// GET — paginated, filterable list of ProfileSubscriptions for the admin payments dashboard.
//
// Query params:
//   status  — "ALL" | "PENDING" | "ACTIVE" | "EXPIRED" | "FAILED" | "CANCELLED"  (default ALL)
//   page    — page number (default 1)
//   perPage — results per page (default 20, max 100)
//   q       — search by masseuse name or email

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const VALID_STATUSES = ["ALL", "PENDING", "ACTIVE", "EXPIRED", "FAILED", "CANCELLED"] as const;
type StatusFilter = (typeof VALID_STATUSES)[number];

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const sp      = req.nextUrl.searchParams;
  const rawStatus = (sp.get("status") ?? "ALL").toUpperCase() as StatusFilter;
  const status    = VALID_STATUSES.includes(rawStatus) ? rawStatus : "ALL";
  const page      = Math.max(1, Number(sp.get("page") ?? 1));
  const perPage   = Math.min(100, Math.max(1, Number(sp.get("perPage") ?? 20)));
  const q         = sp.get("q")?.trim() ?? "";

  // ── Where clause ─────────────────────────────────────────────────────────────
  const where: any = {};
  if (status !== "ALL") where.status = status;
  if (q) {
    where.profile = {
      user: {
        OR: [
          { name:  { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
        ],
      },
    };
  }

  // ── Query ─────────────────────────────────────────────────────────────────────
  const [subscriptions, total] = await Promise.all([
    prisma.profileSubscription.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip:    (page - 1) * perPage,
      take:    perPage,
      include: {
        tier: {
          select: { name: true, displayName: true, badge: true, color: true },
        },
        profile: {
          select: {
            id:            true,
            slug:          true,
            status:        true,
            listingActive: true,
            user: {
              select: { id: true, name: true, email: true, phone: true },
            },
          },
        },
      },
    }),
    prisma.profileSubscription.count({ where }),
  ]);

  // ── Summary stats (counts across ALL, revenue from paid only) ───────────────
  const paidFilter = { grantedByAdmin: false };
  const [stats, paidRevenue, unlockRevenue, directRevenue] = await Promise.all([
    prisma.profileSubscription.groupBy({
      by:     ["status"],
      _count: { _all: true },
      _sum:   { amountPaid: true },
    }),
    prisma.profileSubscription.aggregate({
      where: { status: { in: ["ACTIVE", "EXPIRED"] }, ...paidFilter },
      _sum:  { amountPaid: true },
    }),
    prisma.videoUnlock.aggregate({
      where: { status: "COMPLETED" },
      _sum:  { amountPaid: true },
    }),
    prisma.directPayment.aggregate({
      where: { status: "COMPLETED" },
      _sum:  { amount: true },
    }),
  ]);

  const statsByStatus = Object.fromEntries(
    stats.map((s) => [
      s.status,
      { count: s._count._all, revenue: Number(s._sum.amountPaid ?? 0) },
    ])
  );

  const subscriptionRevenue = Number(paidRevenue._sum.amountPaid ?? 0);
  const videoRevenue        = Number(unlockRevenue._sum.amountPaid ?? 0);
  const directRevenue_      = Number(directRevenue._sum.amount ?? 0);

  return NextResponse.json({
    subscriptions,
    pagination: {
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    },
    stats: {
      pending:             statsByStatus["PENDING"]   ?? { count: 0, revenue: 0 },
      active:              statsByStatus["ACTIVE"]    ?? { count: 0, revenue: 0 },
      expired:             statsByStatus["EXPIRED"]   ?? { count: 0, revenue: 0 },
      failed:              statsByStatus["FAILED"]    ?? { count: 0, revenue: 0 },
      cancelled:           statsByStatus["CANCELLED"] ?? { count: 0, revenue: 0 },
      subscriptionRevenue,
      videoRevenue,
      directRevenue:       directRevenue_,
      totalRevenue:        subscriptionRevenue + videoRevenue + directRevenue_,
    },
  });
}
