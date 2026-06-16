// app/(admin)/admin/payments/page.tsx
// Admin payment dashboard — server component loads initial stats, client component handles UX.

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PaymentsDashboard } from "@/components/admin/payments/PaymentsDashboard";
import { DollarSign, Clock, CheckCircle2, XCircle, TrendingUp, AlertTriangle } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Payments — Admin | mconnect" };

// Revalidate every 60s so stats are fresh on page load without a full re-deploy
export const revalidate = 60;

async function getPaymentStats() {
  const [byStatus, recentRevenue] = await Promise.all([
    // Group subscriptions by status
    prisma.profileSubscription.groupBy({
      by:     ["status"],
      _count: { _all: true },
      _sum:   { amountPaid: true },
    }),
    // Revenue in last 30 days
    prisma.profileSubscription.aggregate({
      where: {
        status:  "ACTIVE",
        paidAt:  { gte: new Date(Date.now() - 30 * 86_400_000) },
      },
      _sum: { amountPaid: true },
    }),
  ]);

  const map = Object.fromEntries(
    byStatus.map((s) => [
      s.status,
      { count: s._count._all, revenue: Number(s._sum.amountPaid ?? 0) },
    ])
  );

  const zero = { count: 0, revenue: 0 };

  return {
    pending:      map["PENDING"]   ?? zero,
    active:       map["ACTIVE"]    ?? zero,
    expired:      map["EXPIRED"]   ?? zero,
    failed:       map["FAILED"]    ?? zero,
    cancelled:    map["CANCELLED"] ?? zero,
    totalRevenue: byStatus.reduce((s, r) => s + Number(r._sum.amountPaid ?? 0), 0),
    last30Days:   Number(recentRevenue._sum.amountPaid ?? 0),
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
    },
    {
      label:  "Active Subscriptions",
      value:  stats.active.count,
      sub:    `${fmt(stats.active.revenue)} collected`,
      icon:   CheckCircle2,
      color:  "text-blue-600 dark:text-blue-400",
      bg:     "bg-blue-50 dark:bg-blue-950/30",
      border: "border-blue-200 dark:border-blue-800",
    },
    {
      label:  "Pending Payments",
      value:  stats.pending.count,
      sub:    stats.pending.count > 0 ? "Requires attention" : "All clear",
      icon:   stats.pending.count > 0 ? AlertTriangle : Clock,
      color:  stats.pending.count > 0 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground",
      bg:     stats.pending.count > 0 ? "bg-amber-50 dark:bg-amber-950/30" : "bg-card",
      border: stats.pending.count > 0 ? "border-amber-300 dark:border-amber-700" : "border",
    },
    {
      label:  "Failed Payments",
      value:  stats.failed.count,
      sub:    `${stats.expired.count} expired, ${stats.cancelled.count} cancelled`,
      icon:   XCircle,
      color:  stats.failed.count > 0 ? "text-red-600 dark:text-red-400" : "text-muted-foreground",
      bg:     "bg-card",
      border: "border",
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
        {summaryCards.map(({ label, value, sub, icon: Icon, color, bg, border }) => (
          <div key={label} className={`rounded-xl border ${border} ${bg} p-5`}>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{label}</p>
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
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
