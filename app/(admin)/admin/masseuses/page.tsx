// app/(admin)/admin/masseuses/page.tsx
"use client";
import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter }        from "next/navigation";
import Image from "next/image";
import {
  CheckCircle2, XCircle, Ban, RotateCcw,
  MapPin, Calendar, Search, ExternalLink,
  ChevronDown, Loader2, Eye,
} from "lucide-react";
import { getInitials } from "@/lib/utils";

type Status = "PENDING" | "APPROVED" | "SUSPENDED" | "BANNED";

const TABS: { key: Status; label: string; color: string }[] = [
  { key: "PENDING",   label: "Pending",   color: "text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-700" },
  { key: "APPROVED",  label: "Approved",  color: "text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-700" },
  { key: "SUSPENDED", label: "Suspended", color: "text-rose-600 bg-rose-50 border-rose-200 dark:bg-rose-950/30 dark:border-rose-700" },
  { key: "BANNED",    label: "Banned",    color: "text-red-700 bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-700" },
];

const STATUS_BADGE: Record<Status, string> = {
  PENDING:   "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
  APPROVED:  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
  SUSPENDED: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400",
  BANNED:    "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400",
};

// ── Reason modal ──────────────────────────────────────────────────────────────
function ReasonModal({
  title, placeholder, onConfirm, onCancel, confirmLabel, confirmClass,
}: {
  title: string; placeholder: string; confirmLabel: string; confirmClass: string;
  onConfirm: (reason: string) => void; onCancel: () => void;
}) {
  const [reason, setReason] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-2xl">
        <h3 className="mb-1 text-lg font-bold">{title}</h3>
        <p className="mb-4 text-sm text-muted-foreground">Add a reason (optional)</p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="w-full resize-none rounded-xl border bg-muted/40 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        />
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onCancel} className="rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-muted">
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason.trim())}
            className={`rounded-xl px-4 py-2 text-sm font-bold text-white ${confirmClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}


// ── Verification level control ────────────────────────────────────────────────
const VERIFY_LEVELS = [
  { value: "UNVERIFIED",     label: "Unverified" },
  { value: "EMAIL_VERIFIED", label: "Email verified" },
  { value: "PHONE_VERIFIED", label: "Phone verified" },
  { value: "ID_VERIFIED",    label: "ID verified" },
  { value: "FULLY_VERIFIED", label: "Fully verified" },
];

function VerifyControl({ profileId, current, onDone }: {
  profileId: string; current: string; onDone: () => void;
}) {
  const [level,   setLevel]   = useState(current);
  const [saving,  setSaving]  = useState(false);

  const save = async () => {
    if (level === current) return;
    setSaving(true);
    await fetch(`/api/admin/profiles/${profileId}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ verificationLevel: level }),
    });
    setSaving(false);
    onDone();
  };

  return (
    <div className="flex items-center gap-2">
      <select
        value={level}
        onChange={(e) => setLevel(e.target.value)}
        className="rounded-lg border bg-card px-2 py-1.5 text-xs font-medium outline-none focus:border-primary"
      >
        {VERIFY_LEVELS.map((l) => (
          <option key={l.value} value={l.value}>{l.label}</option>
        ))}
      </select>
      <button
        onClick={save}
        disabled={saving || level === current}
        className="rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground disabled:opacity-40 hover:bg-primary/90"
      >
        {saving ? "Saving…" : "Save"}
      </button>
    </div>
  );
}

// ── Profile card ──────────────────────────────────────────────────────────────
function ProfileCard({
  profile,
  onAction,
  acting,
}: {
  profile: any;
  onAction: (id: string, action: string, reason?: string) => void;
  acting: string | null;
}) {
  const [modal, setModal] = useState<"suspend" | "ban" | null>(null);
  const photo = profile.photos?.[0];
  const status: Status = profile.status;
  const isActing = acting === profile.id;

  return (
    <>
      <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        {/* Top row: avatar + info + status */}
        <div className="flex gap-4 p-5">
          {/* Avatar / cover thumb */}
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-muted">
            {photo ? (
              <Image src={photo.url} alt={profile.user.name} fill className="object-cover" sizes="64px" />
            ) : (
              <div className="flex h-full items-center justify-center text-lg font-bold text-muted-foreground">
                {getInitials(profile.user.name)}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-bold truncate">{profile.user.name}</p>
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_BADGE[status]}`}>
                {status}
              </span>
              {profile.listingActive && (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                  Listed
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate">{profile.user.email}</p>
            {profile.city && (
              <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {profile.city.name}{profile.city.county ? `, ${profile.city.county.name}` : ""}
              </p>
            )}
            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              Joined {new Date(profile.createdAt).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
            </p>
          </div>

          <a
            href={`/masseuse/${profile.slug}`}
            target="_blank"
            className="shrink-0 rounded-xl border p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
            title="View public profile"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>

        {/* Bio preview */}
        {profile.bio && (
          <div className="border-t px-5 py-3">
            <p className="line-clamp-2 text-xs text-muted-foreground">{profile.bio}</p>
          </div>
        )}

        {/* Verification level */}
        <div className="border-t px-5 py-3">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Verification Level
          </p>
          <VerifyControl
            profileId={profile.id}
            current={profile.verificationLevel ?? "UNVERIFIED"}
            onDone={() => onAction(profile.id, "__refresh__")}
          />
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 border-t bg-muted/20 px-5 py-3">
          {isActing ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Processing…
            </div>
          ) : (
            <>
              {status !== "APPROVED" && (
                <button
                  onClick={() => onAction(profile.id, "APPROVE")}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-600 active:scale-95"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                </button>
              )}
              {status === "PENDING" && (
                <button
                  onClick={() => onAction(profile.id, "PENDING")}
                  className="flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold hover:bg-muted active:scale-95"
                >
                  <XCircle className="h-3.5 w-3.5" /> Reject
                </button>
              )}
              {status !== "SUSPENDED" && status !== "BANNED" && (
                <button
                  onClick={() => setModal("suspend")}
                  className="flex items-center gap-1.5 rounded-xl border border-amber-300 px-3 py-1.5 text-xs font-bold text-amber-700 hover:bg-amber-50 active:scale-95 dark:border-amber-700 dark:text-amber-400"
                >
                  <XCircle className="h-3.5 w-3.5" /> Suspend
                </button>
              )}
              {status === "SUSPENDED" && (
                <button
                  onClick={() => onAction(profile.id, "APPROVE")}
                  className="flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold hover:bg-muted active:scale-95"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Reinstate
                </button>
              )}
              {status !== "BANNED" && (
                <button
                  onClick={() => setModal("ban")}
                  className="flex items-center gap-1.5 rounded-xl border border-red-300 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-50 active:scale-95 dark:border-red-800 dark:text-red-400"
                >
                  <Ban className="h-3.5 w-3.5" /> Ban & Delete
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {modal === "suspend" && (
        <ReasonModal
          title={`Suspend ${profile.user.name}?`}
          placeholder="Reason for suspension (e.g. policy violation, reported by users…)"
          confirmLabel="Suspend"
          confirmClass="bg-amber-500 hover:bg-amber-600"
          onConfirm={(reason) => { setModal(null); onAction(profile.id, "SUSPEND", reason); }}
          onCancel={() => setModal(null)}
        />
      )}
      {modal === "ban" && (
        <ReasonModal
          title={`Ban & delete ${profile.user.name}?`}
          placeholder="Reason (e.g. fake profile, repeated violations…)"
          confirmLabel="Ban permanently"
          confirmClass="bg-red-600 hover:bg-red-700"
          onConfirm={(reason) => { setModal(null); onAction(profile.id, "BAN", reason); }}
          onCancel={() => setModal(null)}
        />
      )}
    </>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AdminMasseusesPage() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const [tab,      setTab]      = useState<Status>((searchParams.get("status") as Status) ?? "PENDING");
  const [profiles, setProfiles] = useState<any[]>([]);
  const [total,    setTotal]    = useState(0);
  const [search,   setSearch]   = useState("");
  const [loading,  setLoading]  = useState(true);
  const [acting,   setActing]   = useState<string | null>(null);
  const [counts,   setCounts]   = useState<Record<Status, number>>({ PENDING: 0, APPROVED: 0, SUSPENDED: 0, BANNED: 0 });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ status: tab, ...(search ? { search } : {}) });
      const res = await fetch(`/api/admin/masseuses?${qs}`);
      const data = await res.json();
      setProfiles(Array.isArray(data) ? data : data.profiles ?? []);
      setTotal(data.total ?? (Array.isArray(data) ? data.length : 0));
    } finally {
      setLoading(false);
    }
  }, [tab, search]);

  // Load counts for badge numbers
  useEffect(() => {
    (["PENDING","APPROVED","SUSPENDED","BANNED"] as Status[]).forEach(async (s) => {
      const res  = await fetch(`/api/admin/masseuses?status=${s}&countOnly=1`);
      const data = await res.json();
      setCounts((prev) => ({ ...prev, [s]: Array.isArray(data) ? data.length : (data.total ?? 0) }));
    });
  }, [acting]);

  useEffect(() => { load(); }, [load]);

  const handleAction = async (id: string, action: string, reason?: string) => {
    setActing(id);
    try {
      await fetch("/api/admin/approve", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ profileId: id, action, reason }),
      });
      await load();
    } finally {
      setActing(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Profile Moderation</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Approve, suspend, or remove masseuse profiles
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {TABS.map(({ key, label, color }) => (
          <button
            key={key}
            onClick={() => { setTab(key); setSearch(""); }}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-all ${
              tab === key ? color : "border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            {label}
            <span className={`rounded-full px-1.5 py-0.5 text-xs ${
              tab === key ? "" : "bg-muted"
            }`}>
              {counts[key]}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email…"
          className="w-full rounded-xl border bg-card py-2.5 pl-9 pr-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Count */}
      <p className="text-sm text-muted-foreground">
        {loading ? "Loading…" : `${profiles.length} profile${profiles.length !== 1 ? "s" : ""}`}
      </p>

      {/* Profile grid */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1,2,3,4].map((i) => (
            <div key={i} className="h-48 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : profiles.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border bg-card py-16 text-center text-muted-foreground">
          <CheckCircle2 className="h-10 w-10 text-muted-foreground/20" />
          <p className="font-semibold">No profiles in this queue</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {profiles.map((p) => (
            <ProfileCard key={p.id} profile={p} onAction={handleAction} acting={acting} />
          ))}
        </div>
      )}
    </div>
  );
}
