// app/(dashboard)/dashboard/page.tsx
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatKES } from "@/lib/utils";
import { CalendarDays, DollarSign, Star, Users } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();

  const profile = await prisma.masseuseProfile.findUnique({
    where: { userId: session!.user.id },
    include: {
      bookings: {
        include: { payment: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });

  if (!profile) {
    return (
      <div className="rounded-xl border bg-card p-8 text-center">
        <p className="font-semibold">Complete your profile to get started</p>
        <a
          href="/dashboard/profile"
          className="mt-4 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Set Up Profile
        </a>
      </div>
    );
  }

  const totalEarnings = profile.bookings
    .filter((b) => b.payment?.status === "COMPLETED")
    .reduce((sum, b) => sum + Number(b.totalAmount), 0);

  const stats = [
    { label: "Total Bookings", value: profile.bookings.length, icon: CalendarDays },
    { label: "Total Earnings", value: formatKES(totalEarnings), icon: DollarSign },
    { label: "Average Rating", value: profile.avgRating.toFixed(1), icon: Star },
    { label: "Total Reviews", value: profile.totalReviews, icon: Users },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {session!.user.name}</p>
      </div>

      {profile.status === "PENDING" && (
        <div className="rounded-xl bg-yellow-500/10 border border-yellow-500/20 px-4 py-3 text-sm text-yellow-700 dark:text-yellow-400">
          Your profile is pending admin approval. You'll be notified once approved.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-xl border bg-card p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">{label}</p>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      <div>
        <h2 className="mb-4 font-semibold">Recent Bookings</h2>
        <div className="rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {profile.bookings.map((b) => (
                <tr key={b.id} className="bg-card">
                  <td className="px-4 py-3">{new Date(b.scheduledAt).toLocaleDateString("en-KE")}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      b.status === "CONFIRMED" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : b.status === "COMPLETED" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                      : b.status === "CANCELLED" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      : "bg-muted text-muted-foreground"
                    }`}>{b.status}</span>
                  </td>
                  <td className="px-4 py-3 text-right">{formatKES(b.totalAmount.toString())}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
