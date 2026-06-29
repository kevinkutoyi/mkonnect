// app/(admin)/admin/page.tsx
import { prisma }    from "@/lib/prisma";
import { formatKES } from "@/lib/utils";
import Link          from "next/link";
import {
  Users, ShieldCheck, CreditCard, Star, AlertTriangle,
  TrendingUp, Clock, CheckCircle2, Video, Banknote, ArrowRight,
} from "lucide-react";

export const revalidate = 60;

export default async function AdminOverviewPage() {
  const now         = new Date();
  const last30      = new Date(now.getTime() - 30 * 86_400_000);
  const last7       = new Date(now.getTime() -  7 * 86_400_000);

  const [
    totalUsers, newUsers7d,
    totalProfiles, pendingProfiles, approvedProfiles,
    pendingReviews,
    pendingPayments, activePayments,
    subRevenue, unlockRevenue, directRevenue,
    subRevenue30d,
    pendingPayouts,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: last7 } } }),
    prisma.masseuseProfile.count(),
    prisma.masseuseProfile.count({ where: { status: "PENDING" } }),
    prisma.masseuseProfile.count({ where: { status: "APPROVED", listingActive: true } }),
    prisma.review.count({ where: { status: "HIDDEN" } }),
    prisma.profileSubscription.count({ where: { status: "PENDING" } }),
    prisma.profileSubscription.count({ where: { status: "ACTIVE" } }),
    prisma.profileSubscription.aggregate({
      where: { status: { in: ["ACTIVE", "EXPIRED"] }, grantedByAdmin: false },
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
    prisma.profileSubscription.aggregate({
      where: { status: "ACTIVE", paidAt: { gte: last30 }, grantedByAdmin: false },
      _sum:  { amountPaid: true },
    }),
    prisma.payout.count({ where: { status: "PENDING" } }),
  ]);

  const totalRevenue = Number(subRevenue._sum.amountPaid ?? 0)
                     + Number(unlockRevenue._sum.amountPaid ?? 0)
                     + Number(directRevenue._sum.amount ?? 0);
  const revenue30d   = Number(subRevenue30d._sum.amountPaid ?? 0);

  // Recent signups
  const recentUsers = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  // Recent profiles pending approval
  const pendingProfileList = await prisma.masseuseProfile.findMany({
    where:   { status: "PENDING" },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id:   true,
      slug: true,
      user: { select: { name: true, email: true } },
      city: { select: { name: true } },
      createdAt: true,
    },
  });

  const ROLE_COLOR: Record<string, string> = {
    VISITOR:  "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
    MASSEUSE: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
    ADMIN:    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">Platform health at a glance</p>
      </div>

      {/* Alert banners */}
      {(pendingProfiles > 0 || pendingReviews > 0 || pendingPayments > 0) && (
        <div className="flex flex-wrap gap-2">
          {pendingProfiles > 0 && (
            <Link href="/admin/masseuses?status=PENDING"
              className="flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-100 transition-colors dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
              <Clock className="h-3.5 w-3.5" />
              {pendingProfiles} profile{pendingProfiles !== 1 ? "s" : ""} awaiting approval
              <ArrowRight className="h-3 w-3" />
            </Link>
          )}
          {pendingReviews > 0 && (
            <Link href="/admin/reviews"
              className="flex items-center gap-2 rounded-xl border border-violet-300 bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-800 hover:bg-violet-100 transition-colors dark:border-violet-700 dark:bg-violet-950/30 dark:text-violet-300">
              <Star className="h-3.5 w-3.5" />
              {pendingReviews} review{pendingReviews !== 1 ? "s" : ""} to moderate
              <ArrowRight className="h-3 w-3" />
            </Link>
          )}
          {pendingPayments > 0 && (
            <Link href="/admin/payments?status=PENDING"
              className="flex items-center gap-2 rounded-xl border border-blue-300 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-800 hover:bg-blue-100 transition-colors dark:border-blue-700 dark:bg-blue-950/30 dark:text-blue-300">
              <CreditCard className="h-3.5 w-3.5" />
              {pendingPayments} payment{pendingPayments !== 1 ? "s" : ""} pending
              <ArrowRight className="h-3 w-3" />
            </Link>
          )}
        </div>
      )}

      {/* Primary stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Revenue */}
        <Link href="/admin/payments"
          className="group rounded-2xl border bg-card p-5 transition-all hover:shadow-md hover:border-green-300 dark:hover:border-green-700">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Revenue</p>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </div>
          <p className="text-2xl font-extrabold text-green-600 dark:text-green-400">{formatKES(totalRevenue)}</p>
          <p className="mt-1 text-xs text-muted-foreground">{formatKES(revenue30d)} last 30 days</p>
        </Link>

        {/* Users */}
        <Link href="/admin/users"
          className="group rounded-2xl border bg-card p-5 transition-all hover:shadow-md">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Users</p>
            <Users className="h-4 w-4 text-sky-500" />
          </div>
          <p className="text-2xl font-extrabold">{totalUsers.toLocaleString()}</p>
          <p className="mt-1 text-xs text-muted-foreground">+{newUsers7d} this week</p>
        </Link>

        {/* Active profiles */}
        <Link href="/admin/masseuses"
          className="group rounded-2xl border bg-card p-5 transition-all hover:shadow-md">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Live Profiles</p>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-extrabold">{approvedProfiles}</p>
          <p className="mt-1 text-xs text-muted-foreground">{totalProfiles} total · {pendingProfiles} pending</p>
        </Link>

        {/* Active subscriptions */}
        <Link href="/admin/payments?status=ACTIVE"
          className="group rounded-2xl border bg-card p-5 transition-all hover:shadow-md">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Active Subs</p>
            <CreditCard className="h-4 w-4 text-primary" />
          </div>
          <p className="text-2xl font-extrabold">{activePayments}</p>
          <p className="mt-1 text-xs text-muted-foreground">{pendingPayments} pending payment{pendingPayments !== 1 ? "s" : ""}</p>
        </Link>
      </div>

      {/* Revenue breakdown */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Subscriptions", value: Number(subRevenue._sum.amountPaid ?? 0),    icon: CreditCard, color: "text-primary"       },
          { label: "Video Unlocks", value: Number(unlockRevenue._sum.amountPaid ?? 0), icon: Video,      color: "text-purple-500"     },
          { label: "Direct Pays",   value: Number(directRevenue._sum.amount ?? 0),     icon: Banknote,   color: "text-blue-500"       },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="flex items-center gap-4 rounded-xl border bg-card px-5 py-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted">
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-lg font-bold">{formatKES(value)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Two-column section: pending profiles + recent users */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* Pending approvals */}
        <div className="rounded-2xl border bg-card">
          <div className="flex items-center justify-between border-b px-5 py-3.5">
            <h2 className="text-sm font-semibold">Pending Approvals</h2>
            <Link href="/admin/masseuses?status=PENDING"
              className="text-xs text-primary hover:underline">
              View all →
            </Link>
          </div>
          {pendingProfileList.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
              <CheckCircle2 className="h-7 w-7 text-green-500" />
              <p className="text-sm">All clear — no pending profiles</p>
            </div>
          ) : (
            <ul className="divide-y">
              {pendingProfileList.map((p) => (
                <li key={p.id} className="flex items-center justify-between px-5 py-3 hover:bg-muted/30 transition-colors">
                  <div>
                    <p className="text-sm font-medium">{p.user.name}</p>
                    <p className="text-xs text-muted-foreground">{p.city?.name ?? "—"} · {p.user.email}</p>
                  </div>
                  <Link href="/admin/masseuses"
                    className="rounded-lg border px-2.5 py-1 text-xs font-medium hover:bg-muted transition-colors">
                    Review
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent signups */}
        <div className="rounded-2xl border bg-card">
          <div className="flex items-center justify-between border-b px-5 py-3.5">
            <h2 className="text-sm font-semibold">Recent Signups</h2>
            <Link href="/admin/users" className="text-xs text-primary hover:underline">
              View all →
            </Link>
          </div>
          {recentUsers.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">No users yet</p>
          ) : (
            <ul className="divide-y">
              {recentUsers.map((u) => (
                <li key={u.id} className="flex items-center justify-between px-5 py-3 hover:bg-muted/30 transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{u.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                  </div>
                  <span className={`ml-3 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${ROLE_COLOR[u.role] ?? ""}`}>
                    {u.role}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Quick links */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Quick Actions</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { href: "/admin/masseuses", label: "Moderate Profiles",  icon: ShieldCheck,  desc: "Approve or suspend"         },
            { href: "/admin/reviews",   label: "Moderate Reviews",   icon: Star,         desc: "Hide or approve reviews"    },
            { href: "/admin/payouts",   label: "Run Payouts",        icon: Banknote,     desc: "Pay models via M-Pesa"      },
            { href: "/admin/users",     label: "Manage Users",       icon: Users,        desc: "Edit roles & passwords"     },
          ].map(({ href, label, icon: Icon, desc }) => (
            <Link key={href} href={href}
              className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3.5 hover:bg-muted/40 hover:shadow-sm transition-all group">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold group-hover:text-primary transition-colors">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
