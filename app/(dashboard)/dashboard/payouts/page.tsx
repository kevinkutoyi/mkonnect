// app/(dashboard)/dashboard/payouts/page.tsx
// Masseuse payout history + payout phone setup

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { PayoutPhoneForm } from "@/components/dashboard/PayoutPhoneForm";
import { formatKES } from "@/lib/utils";
import { CheckCircle2, Clock, XCircle, Loader2, BanknoteIcon } from "lucide-react";

export const metadata: Metadata = { title: "Payouts — mconnect" };

const STATUS_CONFIG = {
  COMPLETED:  { label: "Paid",       color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", icon: CheckCircle2 },
  PROCESSING: { label: "Processing", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",             icon: Loader2 },
  PENDING:    { label: "Pending",    color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",      icon: Clock },
  FAILED:     { label: "Failed",     color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",                  icon: XCircle },
  CANCELLED:  { label: "Cancelled",  color: "bg-muted text-muted-foreground",                                                 icon: XCircle },
};

export default async function PayoutsPage() {
  const session = await auth();
  if (!session || session.user.role !== "MASSEUSE") redirect("/");

  const profile = await prisma.masseuseProfile.findUnique({
    where:  { userId: session.user.id },
    select: { id: true, payoutPhone: true },
  });

  if (!profile) redirect("/dashboard/profile");

  const payouts = await prisma.payout.findMany({
    where:   { profileId: profile.id },
    orderBy: { createdAt: "desc" },
    take:    30,
  });

  // Summary stats
  const totalPaid  = payouts
    .filter((p) => p.status === "COMPLETED")
    .reduce((s, p) => s + Number(p.netAmount), 0);
  const totalGross = payouts
    .filter((p) => p.status === "COMPLETED")
    .reduce((s, p) => s + Number(p.grossAmount), 0);
  const pending    = payouts.filter((p) => p.status === "PENDING" || p.status === "PROCESSING");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Payouts</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your weekly M-Pesa earnings from completed sessions.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total paid out" value={formatKES(totalPaid)} sub="net (after commission)" />
        <StatCard label="Gross earnings" value={formatKES(totalGross)} sub="before platform fee" />
        <StatCard label="Pending" value={pending.length.toString()} sub="payouts in progress" />
      </div>

      {/* Payout phone setup */}
      <PayoutPhoneForm current={profile.payoutPhone} />

      {/* Payout history */}
      <div>
        <h2 className="mb-4 font-semibold">Payout History</h2>

        {payouts.length === 0 ? (
          <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
            <BanknoteIcon className="mx-auto mb-3 h-8 w-8 opacity-30" />
            No payouts yet. Complete sessions to start earning.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Period</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Gross</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Fee</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Net</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {payouts.map((p) => {
                  const cfg = STATUS_CONFIG[p.status] ?? STATUS_CONFIG.PENDING;
                  const Icon = cfg.icon;
                  return (
                    <tr key={p.id} className="bg-card hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        <div>{new Date(p.periodStart).toLocaleDateString("en-KE", { day: "numeric", month: "short" })}</div>
                        <div className="text-[11px]">→ {new Date(p.periodEnd).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${cfg.color}`}>
                          <Icon className="h-3 w-3" />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">{formatKES(p.grossAmount.toString())}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground">
                        -{formatKES(p.commission.toString())}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">
                        {formatKES(p.netAmount.toString())}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground font-mono">
                        {p.mpesaReceiptNumber ?? "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}
