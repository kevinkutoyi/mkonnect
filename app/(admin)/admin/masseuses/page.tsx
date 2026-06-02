"use client";
// app/(admin)/admin/masseuses/page.tsx
import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Clock } from "lucide-react";

type ProfileStatus = "PENDING" | "APPROVED" | "SUSPENDED";

export default function AdminMasseusesPage() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [filter, setFilter] = useState<ProfileStatus | "ALL">("PENDING");
  const [loading, setLoading] = useState(false);

  const fetchProfiles = async () => {
    setLoading(true);
    const params = filter !== "ALL" ? `?status=${filter}` : "";
    const res = await fetch(`/api/admin/masseuses${params}`);
    const data = await res.json();
    setProfiles(data);
    setLoading(false);
  };

  useEffect(() => { fetchProfiles(); }, [filter]);

  const handleAction = async (profileId: string, action: "APPROVE" | "SUSPEND" | "PENDING") => {
    await fetch("/api/admin/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileId, action }),
    });
    fetchProfiles();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Masseuse Management</h1>

      <div className="flex gap-2">
        {(["PENDING", "APPROVED", "SUSPENDED", "ALL"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              filter === s ? "bg-primary text-primary-foreground" : "border hover:bg-muted"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : profiles.length === 0 ? (
        <p className="text-muted-foreground">No profiles found.</p>
      ) : (
        <div className="space-y-3">
          {profiles.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-xl border bg-card p-4">
              <div>
                <p className="font-semibold">{p.user?.name}</p>
                <p className="text-xs text-muted-foreground">{p.user?.email} · {p.location?.town}</p>
                <p className="mt-1 text-xs line-clamp-2 text-muted-foreground max-w-md">{p.bio}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                {p.status !== "APPROVED" && (
                  <button
                    onClick={() => handleAction(p.id, "APPROVE")}
                    className="flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700"
                  >
                    <CheckCircle className="h-3 w-3" /> Approve
                  </button>
                )}
                {p.status !== "SUSPENDED" && (
                  <button
                    onClick={() => handleAction(p.id, "SUSPEND")}
                    className="flex items-center gap-1 rounded-lg bg-destructive px-3 py-1.5 text-xs font-semibold text-destructive-foreground hover:bg-destructive/90"
                  >
                    <XCircle className="h-3 w-3" /> Suspend
                  </button>
                )}
                {p.status === "SUSPENDED" && (
                  <button
                    onClick={() => handleAction(p.id, "PENDING")}
                    className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-semibold hover:bg-muted"
                  >
                    <Clock className="h-3 w-3" /> Reset
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
