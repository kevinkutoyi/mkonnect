"use client";
// components/admin/payments/PaymentsDashboard.tsx
// Interactive admin payments dashboard — tab filtering, search, verify, confirm.

import { useState, useEffect, useCallback, useTransition } from "react";
import {
  Search, RefreshCw, CheckCircle2, XCircle, Clock,
  AlertTriangle, ExternalLink, ShieldCheck, Loader2, TrendingUp, TrendingDown,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type SubStatus = "ALL" | "PENDING" | "ACTIVE" | "EXPIRED" | "FAILED" | "CANCELLED";

interface Subscription {
  id:                string;
  status:            string;
  merchantReference: string;
  orderTrackingId:   string | null;
  amountPaid:        string | null;
  paidAt:            string | null;
  expiresAt:         string | null;
  grantedByAdmin:    boolean;
  createdAt:         string;
  tier: {
    name:        string;
    displayName: string;
    badge:       string | null;
    color:       string | null;
  };
  profile: {
    id:            string;
    slug:          string;
    status:        string;
    listingActive: boolean;
    user: {
      id:    string;
      name:  string;
      email: string;
      phone: string | null;
    };
  };
}

interface Stats {
  pending:      { count: number; revenue: number };
  active:       { count: number; revenue: number };
  expired:      { count: number; revenue: number };
  failed:       { count: number; revenue: number };
  cancelled:    { count: number; revenue: number };
  totalRevenue: number;
}

interface ApiResponse {
  subscriptions: Subscription[];
  pagination:    { total: number; page: number; perPage: number; totalPages: number };
  stats:         Stats;
}

interface ActionState {
  id:      string | null;
  type:    "verify" | "confirm" | null;
  loading: boolean;
  result:  { outcome: string; error?: string } | null;
}

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; classes: string; icon: React.ReactNode }> = {
  PENDING:   { label: "Pending",   classes: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300", icon: <Clock className="h-3 w-3" /> },
  ACTIVE:    { label: "Active",    classes: "bg-green-100  text-green-800  dark:bg-green-900/30  dark:text-green-300",  icon: <CheckCircle2 className="h-3 w-3" /> },
  EXPIRED:   { label: "Expired",   classes: "bg-muted text-muted-foreground",                                            icon: <AlertTriangle className="h-3 w-3" /> },
  FAILED:    { label: "Failed",    classes: "bg-red-100    text-red-800    dark:bg-red-900/30    dark:text-red-300",    icon: <XCircle className="h-3 w-3" /> },
  CANCELLED: { label: "Cancelled", classes: "bg-muted text-muted-foreground",                                            icon: <XCircle className="h-3 w-3" /> },
};

const TABS: { key: SubStatus; label: string }[] = [
  { key: "ALL",       label: "All"       },
  { key: "PENDING",   label: "Pending"   },
  { key: "ACTIVE",    label: "Active"    },
  { key: "FAILED",    label: "Failed"    },
  { key: "EXPIRED",   label: "Expired"   },
  { key: "CANCELLED", label: "Cancelled" },
];

function fmt(n: number) {
  return `KES ${n.toLocaleString("en-KE")}`;
}
function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-KE", { day: "2-digit", month: "short", year: "numeric" });
}

// ─── Main component ───────────────────────────────────────────────────────────
interface Props {
  initialStats: Stats;
}

export function PaymentsDashboard({ initialStats }: Props) {
  const [tab,     setTab]     = useState<SubStatus>("ALL");
  const [q,       setQ]       = useState("");
  const [page,    setPage]    = useState(1);
  const [data,    setData]    = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [action,  setAction]  = useState<ActionState>({ id: null, type: null, loading: false, result: null });
  const [confirmModal, setConfirmModal] = useState<Subscription | null>(null);
  const [confirmReason, setConfirmReason] = useState("");
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchData = useCallback(async (overrides?: Partial<{ tab: SubStatus; q: string; page: number }>) => {
    const t = overrides?.tab  ?? tab;
    const s = overrides?.q    ?? q;
    const p = overrides?.page ?? page;

    setLoading(true);
    try {
      const url = `/api/admin/payments?status=${t}&q=${encodeURIComponent(s)}&page=${p}&perPage=20`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch");
      const json: ApiResponse = await res.json();
      setData(json);
    } catch {
      // keep stale data visible
    } finally {
      setLoading(false);
    }
  }, [tab, q, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Tab change ────────────────────────────────────────────────────────────
  function handleTab(t: SubStatus) {
    startTransition(() => {
      setTab(t);
      setPage(1);
      fetchData({ tab: t, page: 1 });
    });
  }

  // ── Search ────────────────────────────────────────────────────────────────
  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    fetchData({ page: 1 });
  }

  // ── Verify (Pesapal live check) ───────────────────────────────────────────
  async function handleVerify(sub: Subscription) {
    setAction({ id: sub.id, type: "verify", loading: true, result: null });
    try {
      const res  = await fetch(`/api/admin/payments/${sub.id}/verify`, { method: "POST" });
      const json = await res.json();
      setAction({ id: sub.id, type: "verify", loading: false, result: json });
      if (json.outcome === "ACTIVATED" || json.outcome === "FAILED" || json.outcome === "REVERSED") {
        fetchData(); // refresh list
      }
    } catch {
      setAction({ id: sub.id, type: "verify", loading: false, result: { outcome: "ERROR", error: "Network error" } });
    }
  }

  // ── Toggle revenue inclusion ──────────────────────────────────────────────
  async function handleToggleRevenue(sub: Subscription) {
    setTogglingId(sub.id);
    try {
      const res  = await fetch(`/api/admin/payments/${sub.id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ grantedByAdmin: !sub.grantedByAdmin }),
      });
      if (res.ok) fetchData();
    } finally {
      setTogglingId(null);
    }
  }

  // ── Confirm (admin force-grant) ───────────────────────────────────────────
  async function handleConfirm() {
    if (!confirmModal) return;
    setAction({ id: confirmModal.id, type: "confirm", loading: true, result: null });
    setConfirmModal(null);
    try {
      const res  = await fetch(`/api/admin/payments/${confirmModal.id}/confirm`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ reason: confirmReason || "Admin manual confirmation" }),
      });
      const json = await res.json();
      setAction({ id: confirmModal.id, type: "confirm", loading: false, result: json });
      setConfirmReason("");
      fetchData();
    } catch {
      setAction({ id: confirmModal.id, type: "confirm", loading: false, result: { outcome: "ERROR", error: "Network error" } });
    }
  }

  const stats   = data?.stats ?? initialStats;
  const subs    = data?.subscriptions ?? [];
  const pag     = data?.pagination;
  const isLoading = loading || isPending;

  return (
    <div className="space-y-6">
      {/* ── Stats strip ───────────────────────────────────────────────────── */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Revenue",       value: fmt(stats.totalRevenue),            highlight: true  },
          { label: "Active Subscriptions",value: stats.active.count,                 highlight: false },
          { label: "Pending Payments",    value: stats.pending.count,                highlight: stats.pending.count > 0 },
          { label: "Failed Payments",     value: stats.failed.count,                 highlight: stats.failed.count > 0  },
        ].map(({ label, value, highlight }) => (
          <div
            key={label}
            className={`rounded-xl border p-4 ${highlight && typeof value === "number" && value > 0 ? "border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/30" : "bg-card"}`}
          >
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 text-xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      {/* ── Tabs + search ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto rounded-lg border bg-muted/40 p-1">
          {TABS.map(({ key, label }) => {
            const count =
              key === "ALL"
                ? (pag?.total ?? 0)
                : (stats as any)[key.toLowerCase()]?.count ?? 0;
            return (
              <button
                key={key}
                onClick={() => handleTab(key)}
                className={`flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  tab === key
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
                {count > 0 && (
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                    tab === key ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search + refresh */}
        <div className="flex items-center gap-2">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name or email…"
              className="h-9 rounded-lg border bg-background pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 w-48"
            />
          </form>
          <button
            onClick={() => fetchData()}
            disabled={isLoading}
            className="flex h-9 w-9 items-center justify-center rounded-lg border bg-background hover:bg-muted transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* ── Table ─────────────────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-xl border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Model</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Plan</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Amount</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Profile</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Paid / Created</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Expires</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading && subs.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                  </td>
                </tr>
              )}
              {!isLoading && subs.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground text-sm">
                    No payments found.
                  </td>
                </tr>
              )}
              {subs.map((sub) => {
                const cfg         = STATUS_CONFIG[sub.status] ?? STATUS_CONFIG["EXPIRED"];
                const isActing    = action.id === sub.id && action.loading;
                const lastResult  = action.id === sub.id ? action.result : null;
                const canVerify   = sub.status === "PENDING" && !!sub.orderTrackingId;
                const canConfirm  = sub.status === "PENDING" || sub.status === "FAILED";
                const canToggleRevenue = sub.status === "ACTIVE" || sub.status === "EXPIRED";
                const isToggling  = togglingId === sub.id;

                return (
                  <tr key={sub.id} className="bg-card transition-colors hover:bg-muted/20">
                    {/* Masseuse */}
                    <td className="px-4 py-3">
                      <p className="font-medium leading-tight">{sub.profile.user.name}</p>
                      <p className="text-xs text-muted-foreground">{sub.profile.user.email}</p>
                      {sub.profile.user.phone && (
                        <p className="text-xs text-muted-foreground">{sub.profile.user.phone}</p>
                      )}
                    </td>

                    {/* Plan */}
                    <td className="px-4 py-3 font-medium">
                      {sub.tier.badge} {sub.tier.displayName}
                      {sub.grantedByAdmin && (
                        <span className="ml-1.5 inline-flex items-center gap-0.5 rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                          <ShieldCheck className="h-2.5 w-2.5" /> Admin
                        </span>
                      )}
                    </td>

                    {/* Amount */}
                    <td className="px-4 py-3">
                      {sub.amountPaid
                        ? fmt(Number(sub.amountPaid))
                        : <span className="text-muted-foreground">—</span>}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${cfg.classes}`}>
                        {cfg.icon} {cfg.label}
                      </span>
                      {lastResult && (
                        <p className={`mt-1 text-[10px] ${lastResult.error ? "text-red-500" : "text-green-600 dark:text-green-400"}`}>
                          {lastResult.error ?? lastResult.outcome}
                        </p>
                      )}
                    </td>

                    {/* Profile */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className={`h-2 w-2 rounded-full ${sub.profile.listingActive ? "bg-green-500" : "bg-muted-foreground"}`} />
                        <span className="text-xs text-muted-foreground">
                          {sub.profile.listingActive ? "Listed" : "Hidden"}
                        </span>
                      </div>
                      <a
                        href={`/model/${sub.profile.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-0.5 flex items-center gap-0.5 text-[10px] text-primary hover:underline"
                      >
                        View profile <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    </td>

                    {/* Paid date */}
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {fmtDate(sub.paidAt ?? sub.createdAt)}
                    </td>

                    {/* Expires */}
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {fmtDate(sub.expiresAt)}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        {canVerify && (
                          <button
                            onClick={() => handleVerify(sub)}
                            disabled={isActing}
                            className="flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50 transition-colors"
                            title="Check Pesapal for payment status"
                          >
                            {isActing && action.type === "verify"
                              ? <Loader2 className="h-3 w-3 animate-spin" />
                              : <RefreshCw className="h-3 w-3" />}
                            Verify
                          </button>
                        )}
                        {canConfirm && (
                          <button
                            onClick={() => setConfirmModal(sub)}
                            disabled={isActing}
                            className="flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                            title="Force-confirm without Pesapal check"
                          >
                            {isActing && action.type === "confirm"
                              ? <Loader2 className="h-3 w-3 animate-spin" />
                              : <CheckCircle2 className="h-3 w-3" />}
                            Confirm
                          </button>
                        )}
                        {canToggleRevenue && (
                          <button
                            onClick={() => handleToggleRevenue(sub)}
                            disabled={isToggling}
                            title={sub.grantedByAdmin ? "Currently excluded from revenue — click to include" : "Currently included in revenue — click to exclude"}
                            className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
                              sub.grantedByAdmin
                                ? "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-300"
                                : "border-green-300 bg-green-50 text-green-700 hover:bg-green-100 dark:border-green-700 dark:bg-green-950/30 dark:text-green-300"
                            }`}
                          >
                            {isToggling
                              ? <Loader2 className="h-3 w-3 animate-spin" />
                              : sub.grantedByAdmin
                                ? <><TrendingUp className="h-3 w-3" /> Include</>
                                : <><TrendingDown className="h-3 w-3" /> Exclude</>
                            }
                          </button>
                        )}
                        {!canVerify && !canConfirm && !canToggleRevenue && (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Pagination ────────────────────────────────────────────────────── */}
      {pag && pag.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-muted-foreground">
            Showing {(pag.page - 1) * pag.perPage + 1}–{Math.min(pag.page * pag.perPage, pag.total)} of {pag.total}
          </p>
          <div className="flex gap-2">
            <button
              disabled={pag.page <= 1}
              onClick={() => { setPage(p => p - 1); fetchData({ page: page - 1 }); }}
              className="rounded-lg border px-3 py-1.5 hover:bg-muted disabled:opacity-40 transition-colors"
            >
              ← Prev
            </button>
            <button
              disabled={pag.page >= pag.totalPages}
              onClick={() => { setPage(p => p + 1); fetchData({ page: page + 1 }); }}
              className="rounded-lg border px-3 py-1.5 hover:bg-muted disabled:opacity-40 transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* ── Manual confirm modal ──────────────────────────────────────────── */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border bg-background p-6 shadow-2xl">
            <h3 className="text-lg font-semibold">Manually confirm payment?</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              This will activate the <strong>{confirmModal.tier.displayName}</strong> subscription for{" "}
              <strong>{confirmModal.profile.user.name}</strong> without checking Pesapal. The profile
              will become publicly listed if also admin-approved.
            </p>

            <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2.5 text-xs text-amber-800 dark:bg-amber-950/30 dark:border-amber-700 dark:text-amber-300">
              ⚠ Use only when you have confirmed payment through another channel (e.g. M-Pesa statement, bank record).
              This action is logged to the audit trail.
            </div>

            <div className="mt-4">
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Reason (optional)
              </label>
              <textarea
                value={confirmReason}
                onChange={(e) => setConfirmReason(e.target.value)}
                placeholder="e.g. M-Pesa confirmed via SMS — ref ABC123"
                rows={2}
                className="w-full rounded-lg border bg-muted px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              />
            </div>

            <div className="mt-4 flex gap-2 justify-end">
              <button
                onClick={() => { setConfirmModal(null); setConfirmReason(""); }}
                className="rounded-lg border px-4 py-2 text-sm hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <CheckCircle2 className="h-4 w-4" />
                Confirm payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
