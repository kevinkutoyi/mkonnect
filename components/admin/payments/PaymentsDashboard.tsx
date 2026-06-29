"use client";
// components/admin/payments/PaymentsDashboard.tsx
// Interactive admin payments dashboard — tab filtering, search, verify, confirm.

import { useState, useEffect, useCallback, useTransition } from "react";
import {
  Search, RefreshCw, CheckCircle2, XCircle, Clock,
  AlertTriangle, ExternalLink, ShieldCheck, Loader2,
  TrendingUp, TrendingDown, CreditCard, Video, Banknote,
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
  pending:             { count: number; revenue: number };
  active:              { count: number; revenue: number };
  expired:             { count: number; revenue: number };
  failed:              { count: number; revenue: number };
  cancelled:           { count: number; revenue: number };
  subscriptionRevenue: number;
  videoRevenue:        number;
  directRevenue:       number;
  totalRevenue:        number;
  last30Days?:         number;
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
function initials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
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
  const [toggleModal, setToggleModal] = useState<Subscription | null>(null);

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

  function handleTab(t: SubStatus) {
    startTransition(() => {
      setTab(t);
      setPage(1);
      fetchData({ tab: t, page: 1 });
    });
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    fetchData({ page: 1 });
  }

  async function handleVerify(sub: Subscription) {
    setAction({ id: sub.id, type: "verify", loading: true, result: null });
    try {
      const res  = await fetch(`/api/admin/payments/${sub.id}/verify`, { method: "POST" });
      const json = await res.json();
      setAction({ id: sub.id, type: "verify", loading: false, result: json });
      if (json.outcome === "ACTIVATED" || json.outcome === "FAILED" || json.outcome === "REVERSED") {
        fetchData();
      }
    } catch {
      setAction({ id: sub.id, type: "verify", loading: false, result: { outcome: "ERROR", error: "Network error" } });
    }
  }

  async function confirmToggleRevenue() {
    if (!toggleModal) return;
    const sub = toggleModal;
    setToggleModal(null);
    setTogglingId(sub.id);
    try {
      const res = await fetch(`/api/admin/payments/${sub.id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ grantedByAdmin: !sub.grantedByAdmin }),
      });
      if (res.ok) fetchData();
    } finally {
      setTogglingId(null);
    }
  }

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

  const stats     = data?.stats ?? initialStats;
  const subs      = data?.subscriptions ?? [];
  const pag       = data?.pagination;
  const isLoading = loading || isPending;

  return (
    <div className="space-y-6">

      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Payments</h1>
          <p className="mt-1 text-sm text-muted-foreground">All subscription transactions across the platform</p>
        </div>
        <button
          onClick={() => fetchData()}
          disabled={isLoading}
          className="flex items-center gap-2 rounded-xl border bg-card px-3 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* ── Revenue overview ──────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Revenue */}
        <div className="rounded-2xl border bg-card p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Revenue</p>
          <p className="mt-2 text-2xl font-extrabold text-green-600 dark:text-green-400">{fmt(stats.totalRevenue)}</p>
          {stats.last30Days != null && (
            <p className="mt-1 text-xs text-muted-foreground">{fmt(stats.last30Days)} last 30 days</p>
          )}
          <div className="mt-3 space-y-1.5 border-t pt-3">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <CreditCard className="h-3 w-3" /> Subscriptions
              </span>
              <span className="font-semibold">{fmt(stats.subscriptionRevenue)}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Video className="h-3 w-3" /> Video unlocks
              </span>
              <span className="font-semibold">{fmt(stats.videoRevenue)}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Banknote className="h-3 w-3" /> Direct payments
              </span>
              <span className="font-semibold">{fmt(stats.directRevenue)}</span>
            </div>
          </div>
        </div>

        {/* Active */}
        <div className="rounded-2xl border bg-card p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Active Subs</p>
          <p className="mt-2 text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{stats.active.count}</p>
          <p className="mt-1 text-xs text-muted-foreground">{fmt(stats.active.revenue)} paid</p>
        </div>

        {/* Pending */}
        <div className={`rounded-2xl border p-5 ${stats.pending.count > 0 ? "border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/20" : "bg-card"}`}>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Pending</p>
          <p className={`mt-2 text-2xl font-extrabold ${stats.pending.count > 0 ? "text-amber-600 dark:text-amber-400" : ""}`}>{stats.pending.count}</p>
          <p className="mt-1 text-xs text-muted-foreground">awaiting confirmation</p>
        </div>

        {/* Failed */}
        <div className={`rounded-2xl border p-5 ${stats.failed.count > 0 ? "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/20" : "bg-card"}`}>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Failed</p>
          <p className={`mt-2 text-2xl font-extrabold ${stats.failed.count > 0 ? "text-red-600 dark:text-red-400" : ""}`}>{stats.failed.count}</p>
          <p className="mt-1 text-xs text-muted-foreground">{stats.expired.count} expired</p>
        </div>
      </div>

      {/* ── Tabs + search ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 overflow-x-auto rounded-xl border bg-muted/40 p-1">
          {TABS.map(({ key, label }) => {
            const count =
              key === "ALL"
                ? (pag?.total ?? 0)
                : (stats as any)[key.toLowerCase()]?.count ?? 0;
            return (
              <button
                key={key}
                onClick={() => handleTab(key)}
                className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  tab === key
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
                {count > 0 && (
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none ${
                    tab === key ? "bg-primary/10 text-primary" : "bg-muted-foreground/20 text-muted-foreground"
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name or email…"
            className="h-9 rounded-xl border bg-background pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 w-56"
          />
        </form>
      </div>

      {/* ── Subscriptions list ────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border bg-card">
        {/* Table header */}
        <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-x-4 border-b bg-muted/40 px-5 py-2.5 text-xs font-medium uppercase tracking-wider text-muted-foreground max-lg:hidden">
          <span>Model</span>
          <span>Plan</span>
          <span>Amount</span>
          <span>Status</span>
          <span className="text-right">Actions</span>
        </div>

        {/* Loading */}
        {isLoading && subs.length === 0 && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Empty */}
        {!isLoading && subs.length === 0 && (
          <div className="py-16 text-center text-sm text-muted-foreground">
            No payments found.
          </div>
        )}

        {/* Rows */}
        <ul className="divide-y">
          {subs.map((sub) => {
            const cfg         = STATUS_CONFIG[sub.status] ?? STATUS_CONFIG["EXPIRED"];
            const isActing    = action.id === sub.id && action.loading;
            const lastResult  = action.id === sub.id ? action.result : null;
            const canVerify   = sub.status === "PENDING" && !!sub.orderTrackingId;
            const canConfirm  = sub.status === "PENDING" || sub.status === "FAILED";
            const canToggle   = sub.status === "ACTIVE" || sub.status === "EXPIRED";
            const isToggling  = togglingId === sub.id;
            const name        = sub.profile.user.name;

            return (
              <li key={sub.id} className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-muted/20 sm:flex-row sm:items-center sm:gap-4">
                {/* Avatar + name */}
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {initials(name)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{name}</p>
                    <p className="truncate text-xs text-muted-foreground">{sub.profile.user.email}</p>
                    {sub.profile.user.phone && (
                      <p className="text-xs text-muted-foreground">{sub.profile.user.phone}</p>
                    )}
                  </div>
                </div>

                {/* Plan + dates */}
                <div className="min-w-[130px]">
                  <p className="text-sm font-medium">
                    {sub.tier.badge} {sub.tier.displayName}
                    {sub.grantedByAdmin && (
                      <span className="ml-1.5 inline-flex items-center gap-0.5 rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                        <ShieldCheck className="h-2.5 w-2.5" /> Admin
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Paid: {fmtDate(sub.paidAt ?? sub.createdAt)}
                  </p>
                  {sub.expiresAt && (
                    <p className="text-xs text-muted-foreground">Exp: {fmtDate(sub.expiresAt)}</p>
                  )}
                </div>

                {/* Amount + profile link */}
                <div className="min-w-[110px]">
                  <p className="text-sm font-bold">
                    {sub.amountPaid ? fmt(Number(sub.amountPaid)) : <span className="text-muted-foreground font-normal">—</span>}
                  </p>
                  <div className="mt-1 flex items-center gap-1">
                    <span className={`h-1.5 w-1.5 rounded-full ${sub.profile.listingActive ? "bg-green-500" : "bg-muted-foreground/50"}`} />
                    <span className="text-xs text-muted-foreground">{sub.profile.listingActive ? "Listed" : "Hidden"}</span>
                  </div>
                  <a
                    href={`/model/${sub.profile.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-0.5 flex items-center gap-0.5 text-[10px] text-primary hover:underline"
                  >
                    View <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                </div>

                {/* Status */}
                <div className="min-w-[90px]">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${cfg.classes}`}>
                    {cfg.icon} {cfg.label}
                  </span>
                  {lastResult && (
                    <p className={`mt-1 text-[10px] ${lastResult.error ? "text-red-500" : "text-green-600 dark:text-green-400"}`}>
                      {lastResult.error ?? lastResult.outcome}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex shrink-0 items-center gap-1.5">
                  {canVerify && (
                    <button
                      onClick={() => handleVerify(sub)}
                      disabled={isActing}
                      className="flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50 transition-colors"
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
                    >
                      {isActing && action.type === "confirm"
                        ? <Loader2 className="h-3 w-3 animate-spin" />
                        : <CheckCircle2 className="h-3 w-3" />}
                      Confirm
                    </button>
                  )}
                  {canToggle && (
                    <button
                      onClick={() => setToggleModal(sub)}
                      disabled={isToggling}
                      title={sub.grantedByAdmin ? "Excluded from revenue — click to include" : "Included in revenue — click to exclude"}
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
                  {!canVerify && !canConfirm && !canToggle && (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
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
              className="rounded-xl border px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-40 transition-colors"
            >
              ← Prev
            </button>
            <button
              disabled={pag.page >= pag.totalPages}
              onClick={() => { setPage(p => p + 1); fetchData({ page: page + 1 }); }}
              className="rounded-xl border px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-40 transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* ── Revenue toggle modal ──────────────────────────────────────────── */}
      {toggleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border bg-background p-6 shadow-2xl">
            <h3 className="text-lg font-semibold">
              {toggleModal.grantedByAdmin ? "Include in revenue?" : "Exclude from revenue?"}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {toggleModal.grantedByAdmin
                ? <>Include this transaction for <strong>{toggleModal.profile.user.name}</strong> in revenue reporting — marks it as a real payment.</>
                : <>Exclude this transaction for <strong>{toggleModal.profile.user.name}</strong> from revenue totals.</>
              }
            </p>
            <div className="mt-3 rounded-xl border bg-muted/40 px-4 py-3 text-sm">
              <p><span className="text-muted-foreground">Plan:</span> {toggleModal.tier.displayName}</p>
              <p><span className="text-muted-foreground">Amount:</span> {toggleModal.amountPaid ? fmt(Number(toggleModal.amountPaid)) : "—"}</p>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setToggleModal(null)}
                className="rounded-xl border px-4 py-2 text-sm hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmToggleRevenue}
                className={`rounded-xl px-4 py-2 text-sm font-semibold text-white transition-colors ${
                  toggleModal.grantedByAdmin ? "bg-green-600 hover:bg-green-700" : "bg-amber-600 hover:bg-amber-700"
                }`}
              >
                {toggleModal.grantedByAdmin ? "Yes, include it" : "Yes, exclude it"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Manual confirm modal ──────────────────────────────────────────── */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border bg-background p-6 shadow-2xl">
            <h3 className="text-lg font-semibold">Manually confirm payment?</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              This activates <strong>{confirmModal.tier.displayName}</strong> for{" "}
              <strong>{confirmModal.profile.user.name}</strong> without a Pesapal check.
            </p>

            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
              ⚠ Only use when you've confirmed payment another way (M-Pesa SMS, bank record, etc.)
            </div>

            <div className="mt-4">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Reason (optional)</label>
              <textarea
                value={confirmReason}
                onChange={(e) => setConfirmReason(e.target.value)}
                placeholder="e.g. M-Pesa confirmed — ref ABC123"
                rows={2}
                className="w-full resize-none rounded-xl border bg-muted px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => { setConfirmModal(null); setConfirmReason(""); }}
                className="rounded-xl border px-4 py-2 text-sm hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
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
