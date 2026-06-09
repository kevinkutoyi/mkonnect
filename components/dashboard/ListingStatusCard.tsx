"use client";

// components/dashboard/ListingStatusCard.tsx
// Prominent listing expiry widget shown at the top of the masseuse dashboard.
// States: ACTIVE (with countdown) | EXPIRING_SOON | EXPIRED | NONE

import Link from "next/link";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ArrowRight,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface ListingStatus {
  state:       "ACTIVE" | "EXPIRING" | "EXPIRED" | "NONE";
  tierName?:   string;   // display name e.g. "VVIP"
  tierBadge?:  string;   // emoji e.g. "👑"
  expiresAt?:  string;   // ISO string
  daysLeft?:   number;
  durationDays?: number; // total plan length for progress bar
}

export function ListingStatusCard({ status }: { status: ListingStatus }) {
  switch (status.state) {
    case "ACTIVE":
      return <ActiveCard status={status} />;
    case "EXPIRING":
      return <ExpiringCard status={status} />;
    case "EXPIRED":
      return <ExpiredCard />;
    case "NONE":
    default:
      return <NoneCard />;
  }
}

// ── Active ──────────────────────────────────────────────────────────────────
function ActiveCard({ status }: { status: ListingStatus }) {
  const progress = status.durationDays && status.daysLeft != null
    ? Math.round((status.daysLeft / status.durationDays) * 100)
    : null;

  const expiryStr = status.expiresAt
    ? new Date(status.expiresAt).toLocaleDateString("en-KE", {
        day: "numeric", month: "long", year: "numeric",
      })
    : null;

  return (
    <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50/60 p-5 dark:border-emerald-800 dark:from-emerald-950/30 dark:to-teal-950/20">
      <div className="flex items-start justify-between gap-4">
        {/* Left */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/40">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-emerald-700 dark:text-emerald-300">
                Listing Active
              </span>
              {status.tierBadge && status.tierName && (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                  {status.tierBadge} {status.tierName}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-emerald-600/80 dark:text-emerald-400/80">
              Your profile is visible to clients across Kenya
            </p>
          </div>
        </div>

        {/* Days pill */}
        {status.daysLeft != null && (
          <div className="flex-shrink-0 text-right">
            <p className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-300 leading-none">
              {status.daysLeft}
            </p>
            <p className="text-[11px] text-emerald-600/70 dark:text-emerald-400/70 mt-0.5">
              {status.daysLeft === 1 ? "day left" : "days left"}
            </p>
          </div>
        )}
      </div>

      {/* Progress bar */}
      {progress !== null && (
        <div className="mt-4">
          <div className="flex justify-between text-[11px] text-emerald-600/70 dark:text-emerald-400/70 mb-1">
            <span>Time remaining</span>
            {expiryStr && <span>Expires {expiryStr}</span>}
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-emerald-200/60 dark:bg-emerald-900/40">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all dark:bg-emerald-400"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Renew link (passive, not urgent) */}
      <div className="mt-3 flex justify-end">
        <Link
          href="/dashboard/listing"
          className="flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
        >
          Manage plan <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

// ── Expiring soon (≤ 3 days) ─────────────────────────────────────────────────
function ExpiringCard({ status }: { status: ListingStatus }) {
  const expiryStr = status.expiresAt
    ? new Date(status.expiresAt).toLocaleDateString("en-KE", {
        day: "numeric", month: "long",
      })
    : null;

  return (
    <div className="rounded-2xl border border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50/60 p-5 dark:border-amber-700 dark:from-amber-950/30 dark:to-orange-950/20">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/40">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-amber-700 dark:text-amber-300">
                Listing Expiring Soon
              </span>
              {status.tierBadge && status.tierName && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                  {status.tierBadge} {status.tierName}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-amber-600/80 dark:text-amber-400/80">
              {status.daysLeft === 0
                ? "Expires today — renew now to stay visible"
                : `Expires ${expiryStr ?? "soon"} — renew to avoid going offline`}
            </p>
          </div>
        </div>

        <div className="flex-shrink-0 text-right">
          <p className={cn(
            "text-2xl font-extrabold leading-none",
            status.daysLeft === 0 ? "text-red-600 dark:text-red-400" : "text-amber-700 dark:text-amber-300"
          )}>
            {status.daysLeft}
          </p>
          <p className="text-[11px] text-amber-600/70 dark:text-amber-400/70 mt-0.5">
            {status.daysLeft === 1 ? "day left" : "days left"}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <Link
          href="/dashboard/listing"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-600 transition-colors"
        >
          <Zap className="h-4 w-4" />
          Renew listing now
        </Link>
      </div>
    </div>
  );
}

// ── Expired ──────────────────────────────────────────────────────────────────
function ExpiredCard() {
  return (
    <div className="rounded-2xl border border-red-200 bg-gradient-to-br from-red-50 to-rose-50/60 p-5 dark:border-red-800 dark:from-red-950/30 dark:to-rose-950/20">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-red-100 dark:bg-red-900/40">
          <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
        </div>
        <div className="flex-1">
          <p className="font-bold text-red-700 dark:text-red-300">Listing Expired</p>
          <p className="mt-0.5 text-xs text-red-600/80 dark:text-red-400/80">
            Your profile is hidden from clients. Renew a plan to go live again immediately.
          </p>
        </div>
      </div>

      <div className="mt-4">
        <Link
          href="/dashboard/listing"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-700 transition-colors"
        >
          <Zap className="h-4 w-4" />
          Renew listing
        </Link>
      </div>
    </div>
  );
}

// ── No subscription yet ──────────────────────────────────────────────────────
function NoneCard() {
  return (
    <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 p-5 dark:border-gray-700 dark:bg-gray-900/20">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
          <Clock className="h-5 w-5 text-gray-400 dark:text-gray-500" />
        </div>
        <div className="flex-1">
          <p className="font-bold text-gray-700 dark:text-gray-300">Listing Not Active</p>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            Purchase a listing plan to make your profile visible to clients across Kenya.
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-center text-xs">
        {[
          { label: "7 days",  price: "KES 700",   tier: "Regular" },
          { label: "14 days", price: "KES 1,250",  tier: "VIP" },
          { label: "21 days", price: "KES 1,800",  tier: "Premium" },
          { label: "30 days", price: "KES 2,450",  tier: "VVIP" },
        ].map((p) => (
          <div key={p.tier} className="rounded-lg border bg-white px-2 py-2 dark:bg-gray-900 dark:border-gray-700">
            <p className="font-semibold text-gray-700 dark:text-gray-200">{p.price}</p>
            <p className="text-gray-400">{p.label} · {p.tier}</p>
          </div>
        ))}
      </div>

      <div className="mt-3">
        <Link
          href="/dashboard/listing"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
        >
          <Zap className="h-4 w-4" />
          Activate listing
        </Link>
      </div>
    </div>
  );
}
