// app/api/admin/tiers/route.ts — ADMIN: list all tiers with subscription stats
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const tiers = await prisma.listingTier.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      _count: {
        select: {
          subscriptions: true,
        },
      },
    },
  });

  // Add active count per tier
  const activeCountsByTier = await prisma.profileSubscription.groupBy({
    by: ["tierId"],
    where: { status: "ACTIVE", expiresAt: { gt: new Date() } },
    _count: { tierId: true },
  });
  const activeMap = Object.fromEntries(
    activeCountsByTier.map((r) => [r.tierId, r._count.tierId])
  );

  // Revenue per tier (completed subscriptions)
  const revenueByTier = await prisma.profileSubscription.groupBy({
    by: ["tierId"],
    where: { status: "ACTIVE" },
    _sum: { amountPaid: true },
  });
  const revenueMap = Object.fromEntries(
    revenueByTier.map((r) => [r.tierId, Number(r._sum.amountPaid ?? 0)])
  );

  const enriched = tiers.map((t) => ({
    ...t,
    activeSubscriptions: activeMap[t.id] ?? 0,
    totalRevenue:        revenueMap[t.id] ?? 0,
    totalSubscriptions:  t._count.subscriptions,
  }));

  return NextResponse.json(enriched);
}
