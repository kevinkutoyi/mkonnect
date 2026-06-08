// app/(admin)/admin/page.tsx
import { prisma }    from "@/lib/prisma";
import { formatKES } from "@/lib/utils";
import Link          from "next/link";
import {
  Users, ShieldCheck, Clock, Ban,
  CreditCard, Star, AlertTriangle, TrendingUp,
} from "lucide-react";

export default async function AdminOverviewPage() {
  const [
    totalUsers,
    pendingProfiles,
    approvedProfiles,
    suspendedProfiles,
    bannedProfiles,
    pendingReviews,
    totalBookings,
    revenue,
    recentPending,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.masseuseProfile.count({ where: { status: "PENDING" } }),
    prisma.masseuseProfile.count({ where: { status: "APPROVED" } }),
    prisma.masseuseProfile.count({ where: { status: "SUSPENDED" } }),
    prisma.masseuseProfile.count({ where: { status: "BANNED" } }),
    prisma.review.count({ where: { status: "HIDDEN" } }),
    prisma.booking.count(),
    prisma.payment.aggregate({ where: { status: "COMPLETED" }, _sum: { amount: true } }),
    prisma.masseuseProfile.findMany({
      where:   { status: "PENDING" },
      include: { user: { select: { name: true, email: true } }, city: { select: { name: true } } },
      orderBy: { createdAt: "asc" },
      take:    5,
    }),
  ]);

  const stats = [
    { label: "Total Users",       value: totalUsers,        icon: Users,        href: "/admin/users",     color: "text-sky-500"     },
    { label: "Active Profiles",   value: approvedProfiles,  icon: ShieldCheck,  href: "/admin/masseuses?status=APPROVED",  color: "text-emerald-500" },
    { label: "Pending Approval",  value: pendingProfiles,   icon: Clock,        href: "/admin/masseuses?status=PENDING",  color: "text-amber-500",  alert: pendingProfiles > 0 },
    { label: "Suspended",         value: suspendedProfiles, icon: Ban,          href: "/admin/masseuses?status=SUSPENDED", color: "text-rose-500"    },
    { label: "Pending Reviews",   value: pendingReviews,    icon: Star,         href: "/admin/reviews",   color: "text-violet-500", alert: pendingReviews > 0 },
    { label: "Total Bookings",    value: totalBookings,     icon: TrendingUp,   href: "#",                color: "text-primary"     },
    { label: "Revenue",           value: formatKES(Number(revenue._sum.amount ?? 0)), icon: CreditCard, href: "/admin/payments", color: "text-emerald-600" },
    { label: "Banned",            value: bannedProfiles,    icon: AlertTriangle,href: "/admin/masseuses?status=BANNED",   color: "text-red-600"     },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Moderation Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">Platform health at a glance</p>
      </div>

      {/* Alert banner */}
      {(pendingProfiles > 0 || pendingReviews > 0) && (
        <div className="flex flex-wrap gap-3">
          {pendingProfiles > 0 && (
            <Link
              href="/admin/masseuses?status=PENDING"
              className="flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
            >
              <Clock className="h-4 w-4" />
              {pendingProfiles} profile{pendingProfiles !== 1 ? "s" : ""} awaiting approval →
            </Link>
          )}
          {pendingReviews > 0 && (
            <Link
              href="/admin/reviews"
              className="flex items-center gap-2 rounded-xl border border-violet-300 bg-violet-50 px-4 py-2.5 text-sm font-medium text-violet-800 hover:bg-violet-100 dark:border-violet-700 dark:bg-violet-950/40 dark:text-violet-300"
            >
              <Star className="h-4 w-4" />
              {pendingReviews} review{pendingReviews !== 1 ? "s" : ""} awaiting moderation →
            </Link>
          )}
        </div>
      )}

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, href, color, alert }) => (
          <Link
            key={label}
            href={href}
            className={`group relative overflow-hidden rounded-2xl border bg-card p-5 transition-all hover:shadow-md ${
              alert ? "border-amber-300 dark:border-amber-700" : ""
            }`}
          >
            {alert && (
              <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            )}
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
                <p className="mt-2 text-3xl font-extrabold">{value}</p>
              </div>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
          </Link>
        ))}
      </div>

      {/* Recent pending queue */}
      {recentPending.length > 0 && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Pending Approvals</h2>
            <Link href="/admin/masseuses?status=PENDING" className="text-xs text-primary hover:underline">
              View all →
            </Link>
          </div>
          <div className="overflow-hidden rounded-2xl border bg-card">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">City</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Applied</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {recentPending.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-semibold">{p.user.name}</p>
                      <p className="text-xs text-muted-foreground">{p.user.email}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{p.city?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(p.createdAt).toLocaleDateString("en-KE", { day: "numeric", month: "short" })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/masseuses?status=PENDING&focus=${p.id}`}
                        className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                      >
                        Review
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
