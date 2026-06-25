// app/(admin)/admin/payments/page.tsx
// Admin payment dashboard — server component loads initial stats, client component handles UX.

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PaymentsDashboard } from "@/components/admin/payments/PaymentsDashboard";
import { DollarSign, Clock, CheckCircle2, XCircle, TrendingUp, AlertTriangle, Video } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Payments — Admin | modelsraha" };

// Revalidate every 60s so stats are fresh on page load without a full re-deploy
export const revalidate = 60;

// Exclude admin-granted (free) subscriptions from revenue figures
const PAID_FILTER = { grantedByAdmin: false } as const;

async function getPaymentStats() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000);

  const [byStatus, paidRevenue, recentSubRevenue, unlockRevenue, recentUnlockRevenue, directRevenue, recentDirectRevenue] = await Promise.all([
    prisma.profileSubscription.groupBy({
      by:     ["status"],
      _count: { _all: true },
      _sum:   { amountPaid: true },
    }),
    // Subscription revenue — excludes admin-granted free subs
    prisma.profileSubscription.aggregate({
      where: { status: { in: ["ACTIVE", "EXPIRED"] }, ...PAID_FILTER },
      _sum:  { amountPaid: true },
    }),
    // Subscription revenue last 30 days
    prisma.profileSubscription.aggregate({
      where: { status: "ACTIVE", paidAt: { gte: thirtyDaysAgo }, ...PAID_FILTER },
      _sum:  { amountPaid: true },
    }),
    // Video unlock revenue — all time
    prisma.videoUnlock.aggregate({
      where: { status: "COMPLETED" },
      _sum:  { amountPaid: true },
    }),
    // Video unlock revenue last 30 days
    prisma.videoUnlock.aggregate({
      where: { status: "COMPLETED", paidAt: { gte: thirtyDaysAgo } },
      _sum:  { amountPaid: true },
    }),
    // Direct payment revenue — all time
    prisma.directPayment.aggregate({
      where: { status: "COMPLETED" },
      _sum:  { amount: true },
    }),
    // Direct payment revenue last 30 days
    prisma.directPayment.aggregate({
      where: { status: "COMPLETED", paidAt: { gte: thirtyDaysAgo } },
      _sum:  { amount: true },
    }),
  ]);

  const map = Object.fromEntries(
    byStatus.map((s) => [
      s.status,
      { count: s._count._all, revenue: Number(s._sum.amountPaid ?? 0) },
    ])
  );

  const zero = { count: 0, revenue: 0 };

  const subscriptionRevenue = Number(paidRevenue._sum.amountPaid ?? 0);
  const videoRevenue        = Number(unlockRevenue._sum.amountPaid ?? 0);
  const directRevenue_      = Number(directRevenue._sum.amount ?? 0);

  return {
    pending:             map["PENDING"]   ?? zero,
    active:              map["ACTIVE"]    ?? zero,
    expired:             map["EXPIRED"]   ?? zero,
    failed:              map["FAILED"]    ?? zero,
    cancelled:           map["CANCELLED"] ?? zero,
    subscriptionRevenue,
    videoRevenue,
    directRevenue:       directRevenue_,
    totalRevenue:        subscriptionRevenue + videoRevenue + directRevenue_,
    last30Days:          Number(recentSubRevenue._sum.amountPaid ?? 0)
                       + Number(recentUnlockRevenue._sum.amountPaid ?? 0)
                       + Number(recentDirectRevenue._sum.amount ?? 0),
  };
}

function fmt(n: number) {
  return `KES ${n.toLocaleString("en-KE")}`;
}

export default async function AdminPaymentsPage() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/");

  const stats = await getPaymentStats();

  const summaryCards = [
    {
      label:  "Total Revenue",
      value:  fmt(stats.totalRevenue),
      sub:    `${fmt(stats.last30Days)} last 30 days`,
      icon:   DollarSign,
      color:  "text-green-600 dark:text-green-400",
      bg:     "bg-green-50 dark:bg-green-950/30",
      border: "border-green-200 dark:border-green-800",
      breakdown: [
        { label: "Subscriptions",    value: fmt(stats.subscriptionRevenue) },
        { label: "Video unlocks",    value: fmt(stats.videoRevenue) },
        { label: "Direct payments",  value: fmt(stats.directRevenue) },
      ],
    },
    {
      label:  "Active Subscriptions",
      value:  stats.active.count,
      sub:    `${fmt(stats.active.revenue)} collected`,
      icon:   CheckCircle2,
      color:  "text-blue-600 dark:text-blue-400",
      bg:     "bg-blue-50 dark:bg-blue-950/30",
      border: "border-blue-200 dark:border-blue-800",
      breakdown: null,
    },
    {
      label:  "Pending Payments",
      value:  stats.pending.count,
      sub:    stats.pending.count > 0 ? "Requires attention" : "All clear",
      icon:   stats.pending.count > 0 ? AlertTriangle : Clock,
      color:  stats.pending.count > 0 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground",
      bg:     stats.pending.count > 0 ? "bg-amber-50 dark:bg-amber-950/30" : "bg-card",
      border: stats.pending.count > 0 ? "border-amber-300 dark:border-amber-700" : "border",
      breakdown: null,
    },
    {
      label:  "Failed Payments",
      value:  stats.failed.count,
      sub:    `${stats.expired.count} expired, ${stats.cancelled.count} cancelled`,
      icon:   XCircle,
      color:  stats.failed.count > 0 ? "text-red-600 dark:text-red-400" : "text-muted-foreground",
      bg:     "bg-card",
      border: "border",
      breakdown: null,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Payments</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage listing subscriptions and manually confirm payments when needed.
          </p>
        </div>
        {stats.pending.count > 0 && (
          <div className="flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
            <AlertTriangle className="h-3.5 w-3.5" />
            {stats.pending.count} pending
          </div>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map(({ label, value, sub, icon: Icon, color, bg, border, breakdown }) => (
          <div key={label} className={`rounded-xl border ${border} ${bg} p-5`}>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{label}</p>
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
            {breakdown && (
              <div className="mt-3 space-y-1 border-t pt-3">
                {breakdown.map((b) => (
                  <div key={b.label} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{b.label}</span>
                    <span className="font-medium">{b.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Revenue trend (simple text callout) */}
      {stats.last30Days > 0 && (
        <div className="flex items-center gap-2 rounded-xl border bg-card px-4 py-3 text-sm">
          <TrendingUp className="h-4 w-4 text-green-500 shrink-0" />
          <span>
            <strong>{fmt(stats.last30Days)}</strong> collected in the last 30 days from{" "}
            <strong>{stats.active.count}</strong> active subscription{stats.active.count !== 1 ? "s" : ""}.
          </span>
        </div>
      )}

      {/* Interactive dashboard */}
      <PaymentsDashboard initialStats={stats} />
    </div>
  );
}
