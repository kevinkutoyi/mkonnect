// app/(admin)/admin/payouts/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { formatKES } from "@/lib/utils";
import {
  CheckCircle2, Clock, XCircle, Loader2, RefreshCw,
  BanknoteIcon, TrendingUp, AlertTriangle, Send, PhoneMissed,
} from "lucide-react";

type PayoutStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "CANCELLED";

interface PendingEarning {
  profileId:     string;
  bookingsGross: number;
  unlocksGross:  number;
  directGross:   number;
  totalGross:    number;
  commission:    number;
  netAmount:     number;
  profile: {
    id:          string;
    slug:        string;
    payoutPhone: string | null;
    user:        { name: string; email: string };
  };
}

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
    id:          string;
    slug:        string;
    payoutPhone: string | null;
    user:        { name: string; email: string };
  };
}

interface NoPhoneModel {
  id:   string;
  slug: string;
  user: { name: string; email: string };
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
  const [tab,             setTab]             = useState("");
  const [payouts,         setPayouts]         = useState<Payout[]>([]);
  const [summary,         setSummary]         = useState<Summary[]>([]);
  const [total,           setTotal]           = useState(0);
  const [loading,         setLoading]         = useState(true);
  const [retrying,        setRetrying]        = useState<string | null>(null);
  const [paying,          setPaying]          = useState<string | null>(null);
  const [noPhoneModels,   setNoPhoneModels]   = useState<NoPhoneModel[]>([]);
  const [pendingEarnings, setPendingEarnings] = useState<PendingEarning[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    const url = `/api/admin/payouts${tab ? `?status=${tab}` : ""}`;
    const res  = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      setPayouts(data.payouts);
      setSummary(data.summary);
      setTotal(data.total);
      setNoPhoneModels(data.noPhoneModels ?? []);
      setPendingEarnings(data.pendingEarnings ?? []);
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

  async function payNow(profileId: string) {
    setPaying(profileId);
    const res  = await fetch("/api/admin/payouts", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ profileId }),
    });
    const json = await res.json();
    setPaying(null);
    if (res.ok) {
      load();
    } else {
      alert(json.error ?? "Payout failed");
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

      {/* No payout phone warning */}
      {noPhoneModels.length > 0 && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/30 p-4">
          <div className="flex items-center gap-2 mb-3">
            <PhoneMissed className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
              {noPhoneModels.length} active model{noPhoneModels.length !== 1 ? "s" : ""} with no payout number
            </p>
          </div>
          <div className="space-y-1.5">
            {noPhoneModels.map((m) => (
              <div key={m.id} className="flex items-center justify-between rounded-lg bg-white/60 dark:bg-black/20 px-3 py-2 text-sm">
                <div>
                  <span className="font-medium">{m.user.name}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{m.user.email}</span>
                </div>
                <a
                  href={`/model/${m.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline"
                >
                  View profile →
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Models awaiting payout */}
      {pendingEarnings.length > 0 && (
        <div>
          <h2 className="mb-3 text-base font-semibold">
            Models Awaiting Payout
            <span className="ml-2 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
              {pendingEarnings.length}
            </span>
          </h2>
          <div className="overflow-hidden rounded-xl border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Model</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Bookings</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Unlocks (−25%)</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Direct (−10%)</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Platform fee</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Net pay</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {pendingEarnings.map((e) => (
                  <tr key={e.profileId} className="bg-card hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium">{e.profile.user.name}</p>
                      <p className="text-xs text-muted-foreground">{e.profile.user.email}</p>
                      {e.profile.payoutPhone ? (
                        <p className="mt-0.5 font-mono text-xs text-muted-foreground">{e.profile.payoutPhone}</p>
                      ) : (
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                          <PhoneMissed className="h-3 w-3" /> No payout number
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {e.bookingsGross > 0 ? formatKES(e.bookingsGross) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {e.unlocksGross > 0 ? formatKES(e.unlocksGross) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {e.directGross > 0 ? formatKES(e.directGross) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-red-500 text-xs">
                      −{formatKES(e.commission)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-lg font-bold text-green-600 dark:text-green-400">
                        {formatKES(e.netAmount)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {e.profile.payoutPhone ? (
                        <button
                          onClick={() => payNow(e.profileId)}
                          disabled={paying === e.profileId}
                          className="flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                        >
                          {paying === e.profileId ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Send className="h-3 w-3" />
                          )}
                          Pay {formatKES(e.netAmount)}
                        </button>
                      ) : (
                        <span className="text-xs text-muted-foreground">No phone</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
                        {p.profile.payoutPhone ? (
                          <p className="text-xs font-mono text-muted-foreground mt-0.5">{p.profile.payoutPhone}</p>
                        ) : (
                          <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5 flex items-center gap-0.5">
                            <PhoneMissed className="h-3 w-3" /> No payout number
                          </p>
                        )}
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
