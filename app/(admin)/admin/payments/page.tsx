// app/(admin)/admin/payments/page.tsx
import { prisma }           from "@/lib/prisma";
import { auth }             from "@/lib/auth";
import { redirect }         from "next/navigation";
import { PaymentsDashboard } from "@/components/admin/payments/PaymentsDashboard";
import type { Metadata }    from "next";

export const metadata: Metadata = { title: "Payments — Admin" };
export const revalidate = 60;

const PAID_FILTER = { grantedByAdmin: false } as const;

async function getStats() {
  const ago30 = new Date(Date.now() - 30 * 86_400_000);

  const [
    byStatus,
    subAll, sub30,
    unlockAll, unlock30,
    directAll, direct30,
  ] = await Promise.all([
    prisma.profileSubscription.groupBy({ by: ["status"], _count: { _all: true }, _sum: { amountPaid: true } }),
    prisma.profileSubscription.aggregate({ where: { status: { in: ["ACTIVE","EXPIRED"] }, ...PAID_FILTER }, _sum: { amountPaid: true } }),
    prisma.profileSubscription.aggregate({ where: { status: "ACTIVE", paidAt: { gte: ago30 }, ...PAID_FILTER }, _sum: { amountPaid: true } }),
    prisma.videoUnlock.aggregate({ where: { status: "COMPLETED" }, _sum: { amountPaid: true } }),
    prisma.videoUnlock.aggregate({ where: { status: "COMPLETED", paidAt: { gte: ago30 } }, _sum: { amountPaid: true } }),
    prisma.directPayment.aggregate({ where: { status: "COMPLETED" }, _sum: { amount: true } }),
    prisma.directPayment.aggregate({ where: { status: "COMPLETED", paidAt: { gte: ago30 } }, _sum: { amount: true } }),
  ]);

  const map  = Object.fromEntries(byStatus.map((s) => [s.status, { count: s._count._all, revenue: Number(s._sum.amountPaid ?? 0) }]));
  const zero = { count: 0, revenue: 0 };

  const subscriptionRevenue = Number(subAll._sum.amountPaid   ?? 0);
  const videoRevenue        = Number(unlockAll._sum.amountPaid ?? 0);
  const directRevenue       = Number(directAll._sum.amount     ?? 0);

  return {
    pending:   map["PENDING"]   ?? zero,
    active:    map["ACTIVE"]    ?? zero,
    expired:   map["EXPIRED"]   ?? zero,
    failed:    map["FAILED"]    ?? zero,
    cancelled: map["CANCELLED"] ?? zero,
    subscriptionRevenue,
    videoRevenue,
    directRevenue,
    totalRevenue: subscriptionRevenue + videoRevenue + directRevenue,
    last30Days:   Number(sub30._sum.amountPaid ?? 0) + Number(unlock30._sum.amountPaid ?? 0) + Number(direct30._sum.amount ?? 0),
  };
}

export default async function AdminPaymentsPage() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/");
  const stats = await getStats();
  return <PaymentsDashboard initialStats={stats} />;
}
