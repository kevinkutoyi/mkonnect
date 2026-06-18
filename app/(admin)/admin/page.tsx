// app/(admin)/admin/page.tsx
import { prisma }    from "@/lib/prisma";
import { formatKES } from "@/lib/utils";
import Link          from "next/link";
import {
  Users, ShieldCheck, Ban,
  CreditCard, Star, AlertTriangle, TrendingUp,
} from "lucide-react";

export default async function AdminOverviewPage() {
  const [
    totalUsers,
    approvedProfiles,
    suspendedProfiles,
    bannedProfiles,
    pendingReviews,
    totalBookings,
    revenue,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.masseuseProfile.count({ where: { status: "APPROVED" } }),
    prisma.masseuseProfile.count({ where: { status: "SUSPENDED" } }),
    prisma.masseuseProfile.count({ where: { status: "BANNED" } }),
    prisma.review.count({ where: { status: "HIDDEN" } }),
    prisma.booking.count(),
    prisma.payment.aggregate({ where: { status: "COMPLETED" }, _sum: { amount: true } }),
  ]);

  const stats = [
    { label: "Total Users",     value: totalUsers,        icon: Users,        href: "/admin/users",                      color: "text-sky-500"     },
    { label: "Active Profiles", value: approvedProfiles,  icon: ShieldCheck,  href: "/admin/masseuses?status=APPROVED",  color: "text-emerald-500" },
    { label: "Suspended",       value: suspendedProfiles, icon: Ban,          href: "/admin/masseuses?status=SUSPENDED", color: "text-rose-500"    },
    { label: "Pending Reviews", value: pendingReviews,    icon: Star,         href: "/admin/reviews",                    color: "text-violet-500", alert: pendingReviews > 0 },
    { label: "Total Bookings",  value: totalBookings,     icon: TrendingUp,   href: "#",                                 color: "text-primary"     },
    { label: "Revenue",         value: formatKES(Number(revenue._sum.amount ?? 0)), icon: CreditCard, href: "/admin/payments", color: "text-emerald-600" },
    { label: "Banned",          value: bannedProfiles,    icon: AlertTriangle,href: "/admin/masseuses?status=BANNED",    color: "text-red-600"     },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Moderation Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">Platform health at a glance</p>
      </div>

      {/* Alert banner — only reviews now */}
      {pendingReviews > 0 && (
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/reviews"
            className="flex items-center gap-2 rounded-xl border border-violet-300 bg-violet-50 px-4 py-2.5 text-sm font-medium text-violet-800 hover:bg-violet-100 dark:border-violet-700 dark:bg-violet-950/40 dark:text-violet-300"
          >
            <Star className="h-4 w-4" />
            {pendingReviews} review{pendingReviews !== 1 ? "s" : ""} awaiting moderation →
          </Link>
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
    </div>
  );
}
