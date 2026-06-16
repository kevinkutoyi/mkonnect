// app/(admin)/admin/payouts/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { formatKES } from "@/lib/utils";
import {
  CheckCircle2, Clock, XCircle, Loader2, RefreshCw,
  BanknoteIcon, TrendingUp, AlertTriangle, Send,
} from "lucide-react";

type PayoutStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "CANCELLED";

interface Payout {
  id:                 string;
  grossAmount:        string;
  commission:         string;
  netAmount:          string;
  mpesaPhone:         string;
  status:             PayoutStatus;
  mpesaReceiptNumber: string | null;
  darajaResultCode:   number | null;
  darajaResultDesc:   string | null;
  failureReason:      string | null;
  periodStart:        string;
  periodEnd:          string;
  processedAt:        string | null;
  createdAt:          string;
  profile: {
    id:   string;
    slug: string;
    user: { name: string; email: string };
  };
}

interface Summary {
  status:   PayoutStatus;
  _sum:     { netAmount: string | null };
  _count:   { id: number };
}

const STATUS_CONFIG: Record<PayoutStatus, { label: string; color: string; icon: React.ElementType }> = {
  COMPLETED:  { label: "Paid",       color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", icon: CheckCircle2 },
  PROCESSING: { label: "Processing", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",             icon: Loader2 },
  PENDING:    { label: "Pending",    color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",      icon: Clock },
  FAILED:     { label: "Failed",     color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",                  icon: XCircle },
  CANCELLED:  { label: "Cancelled",  color: "bg-muted text-muted-foreground",                                                 icon: XCircle },
};

const TABS: { label: string; value: string }[] = [
  { label: "All",        value: "" },
  { label: "Pending",    value: "PENDING" },
  { label: "Processing", value: "PROCESSING" },
  { label: "Completed",  value: "COMPLETED" },
  { label: "Failed",     value: "FAILED" },
];

export default function AdminPayoutsPage() {
  const [tab,      setTab]      = useState("");
  const [payouts,  setPayouts]  = useState<Payout[]>([]);
  const [summary,  setSummary]  = useState<Summary[]>([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [retrying, setRetrying] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const url = `/api/admin/payouts${tab ? `?status=${tab}` : ""}`;
    const res  = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      setPayouts(data.payouts);
      setSummary(data.summary);
      setTotal(data.total);
    }
    setLoading(false);
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  // Retry a failed payout by triggering a manual payout for the same profile
  async function retryPayout(profileId: string) {
    setRetrying(profileId);
    const res = await fetch("/api/admin/payouts", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ profileId }),
    });
    const json = await res.json();
    setRetrying(null);
    if (res.ok) {
      load();
    } else {
      alert(json.error ?? "Retry failed");
    }
  }

  // Summary stats
  const totalPaid    = summary.find((s) => s.status === "COMPLETED")?._sum.netAmount ?? "0";
  const pendingCount = summary.find((s) => s.status === "PENDING")?._count.id ?? 0;
  const failedCount  = summary.find((s) => s.status === "FAILED")?._count.id ?? 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Payouts</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Weekly M-Pesa disbursements to models via Safaricom Daraja B2C.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Total disbursed</p>
          </div>
          <p className="text-2xl font-bold">{formatKES(totalPaid)}</p>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-yellow-500" />
            <p className="text-sm text-muted-foreground">Pending payouts</p>
          </div>
          <p className="text-2xl font-bold">{pendingCount}</p>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <p className="text-sm text-muted-foreground">Failed payouts</p>
          </div>
          <p className="text-2xl font-bold">{failedCount}</p>
        </div>
      </div>

      {/* Tabs + refresh */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-1 rounded-xl border bg-muted/40 p-1">
          {TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                tab === t.value
                  ? "bg-background shadow text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm hover:bg-muted transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : payouts.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">
          <BanknoteIcon className="mx-auto mb-3 h-8 w-8 opacity-30" />
          No payouts found
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Model</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Period</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Gross</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Fee</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Net</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Phone / Receipt</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {payouts.map((p) => {
                  const cfg  = STATUS_CONFIG[p.status] ?? STATUS_CONFIG.PENDING;
                  const Icon = cfg.icon;
                  return (
                    <tr key={p.id} className="bg-card hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium">{p.profile.user.name}</p>
                        <p className="text-xs text-muted-foreground">{p.profile.user.email}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        <div>{new Date(p.periodStart).toLocaleDateString("en-KE", { day: "numeric", month: "short" })}</div>
                        <div>→ {new Date(p.periodEnd).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${cfg.color}`}>
                          <Icon className="h-3 w-3" />
                          {cfg.label}
                        </span>
                        {p.failureReason && (
                          <p className="mt-1 text-[11px] text-red-500 max-w-[160px] truncate" title={p.failureReason}>
                            {p.failureReason}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">{formatKES(p.grossAmount)}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground">-{formatKES(p.commission)}</td>
                      <td className="px-4 py-3 text-right font-semibold">{formatKES(p.netAmount)}</td>
                      <td className="px-4 py-3 text-xs">
                        <div className="font-mono">{p.mpesaPhone}</div>
                        {p.mpesaReceiptNumber && (
                          <div className="font-mono text-emerald-600 dark:text-emerald-400">
                            {p.mpesaReceiptNumber}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {p.status === "FAILED" && (
                          <button
                            onClick={() => retryPayout(p.profile.id)}
                            disabled={retrying === p.profile.id}
                            className="flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                          >
                            {retrying === p.profile.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Send className="h-3 w-3" />
                            )}
                            Retry
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground text-right">
            Showing {payouts.length} of {total}
          </p>
        </>
      )}
    </div>
  );
}
