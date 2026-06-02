// app/(admin)/admin/page.tsx
import { prisma } from "@/lib/prisma";
import { formatKES } from "@/lib/utils";
import { Users, CheckSquare, CalendarDays, DollarSign } from "lucide-react";

export default async function AdminOverviewPage() {
  const [totalUsers, totalMasseuses, pendingApprovals, totalBookings, payments] =
    await Promise.all([
      prisma.user.count(),
      prisma.masseuseProfile.count({ where: { status: "APPROVED" } }),
      prisma.masseuseProfile.count({ where: { status: "PENDING" } }),
      prisma.booking.count(),
      prisma.payment.aggregate({ where: { status: "COMPLETED" }, _sum: { amount: true } }),
    ]);

  const revenue = Number(payments._sum.amount ?? 0);

  const stats = [
    { label: "Total Users", value: totalUsers, icon: Users },
    { label: "Active Masseuses", value: totalMasseuses, icon: CheckSquare },
    { label: "Total Bookings", value: totalBookings, icon: CalendarDays },
    { label: "Total Revenue", value: formatKES(revenue), icon: DollarSign },
  ];

  const pending = await prisma.masseuseProfile.findMany({
    where: { status: "PENDING" },
    include: { user: { select: { name: true, email: true } }, location: true },
    orderBy: { createdAt: "asc" },
    take: 10,
  });

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Admin Overview</h1>

      {pendingApprovals > 0 && (
        <div className="rounded-xl bg-yellow-500/10 border border-yellow-500/20 px-4 py-3 text-sm">
          <span className="font-semibold">{pendingApprovals}</span> masseuse profile(s) awaiting approval.{" "}
          <a href="/admin/masseuses" className="underline">Review now →</a>
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

      {pending.length > 0 && (
        <div>
          <h2 className="mb-4 font-semibold">Pending Approvals</h2>
          <AdminApprovalTable profiles={pending} />
        </div>
      )}
    </div>
  );
}

function AdminApprovalTable({ profiles }: { profiles: any[] }) {
  return (
    <div className="rounded-xl border overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Location</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Applied</th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {profiles.map((p) => (
            <tr key={p.id} className="bg-card">
              <td className="px-4 py-3">
                <p className="font-medium">{p.user.name}</p>
                <p className="text-xs text-muted-foreground">{p.user.email}</p>
              </td>
              <td className="px-4 py-3">{p.location.town}</td>
              <td className="px-4 py-3 text-muted-foreground">
                {new Date(p.createdAt).toLocaleDateString("en-KE")}
              </td>
              <td className="px-4 py-3 text-right">
                <a
                  href={`/admin/masseuses?id=${p.id}`}
                  className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  Review
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
