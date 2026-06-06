// app/(admin)/admin/tiers/page.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AdminTiersManager } from "@/components/tiers/AdminTiersManager";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Listing Tiers — Admin" };

export default async function AdminTiersPage() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/unauthorized");

  // Load tiers with live stats
  const tiers = await prisma.listingTier.findMany({
    orderBy: { sortOrder: "asc" },
  });

  const activeCountsByTier = await prisma.profileSubscription.groupBy({
    by: ["tierId"],
    where: { status: "ACTIVE", expiresAt: { gt: new Date() } },
    _count: { tierId: true },
  });
  const activeMap = Object.fromEntries(
    activeCountsByTier.map((r) => [r.tierId, r._count.tierId])
  );

  const revenueByTier = await prisma.profileSubscription.groupBy({
    by: ["tierId"],
    where: { status: "ACTIVE" },
    _sum:  { amountPaid: true },
    _count:{ tierId: true },
  });
  const revenueMap = Object.fromEntries(
    revenueByTier.map((r) => [r.tierId, {
      revenue: Number(r._sum.amountPaid ?? 0),
      total:   r._count.tierId,
    }])
  );

  const enriched = tiers.map((t) => ({
    ...t,
    price:               Number(t.price),
    activeSubscriptions: activeMap[t.id] ?? 0,
    totalRevenue:        revenueMap[t.id]?.revenue ?? 0,
    totalSubscriptions:  revenueMap[t.id]?.total ?? 0,
  }));

  // Recent subscriptions
  const recentSubs = await prisma.profileSubscription.findMany({
    orderBy: { createdAt: "desc" },
    take: 15,
    include: {
      tier:    { select: { displayName: true, badge: true } },
      profile: { select: { slug: true, user: { select: { name: true, email: true } } } },
    },
  });

  return (
    <AdminTiersManager
      initialTiers={enriched as any}
      recentSubs={recentSubs as any}
    />
  );
}
