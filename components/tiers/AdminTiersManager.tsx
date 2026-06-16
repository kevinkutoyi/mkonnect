"use client";
// components/tiers/AdminTiersManager.tsx

import { useState } from "react";
import { TierEditor } from "./TierEditor";
import { formatKES } from "@/lib/utils";
import { TrendingUp, Users, DollarSign, Crown } from "lucide-react";

interface Props {
  initialTiers: any[];
  recentSubs:   any[];
}

const STATUS_STYLES: Record<string, string> = {
  ACTIVE:    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  EXPIRED:   "bg-muted text-muted-foreground",
  PENDING:   "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  FAILED:    "bg-destructive/10 text-destructive",
  CANCELLED: "bg-muted text-muted-foreground",
};

export function AdminTiersManager({ initialTiers, recentSubs }: Props) {
  const [tiers, setTiers] = useState(initialTiers);

  const handleUpdated = (updated: any) =>
    setTiers((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));

  const totalRevenue     = tiers.reduce((s: number, t: any) => s + t.totalRevenue, 0);
  const totalActiveSubs  = tiers.reduce((s: number, t: any) => s + t.activeSubscriptions, 0);
  const totalAllSubs     = tiers.reduce((s: number, t: any) => s + t.totalSubscriptions, 0);
  const topTier          = [...tiers].sort((a, b) => b.activeSubscriptions - a.activeSubscriptions)[0];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Listing Tiers</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Edit prices, perks, and settings for each listing category. Changes apply to new subscriptions immediately.
        </p>
      </div>

      {/* Platform summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Revenue",      value: formatKES(totalRevenue),  icon: DollarSign  },
          { label: "Active Subscribers", value: totalActiveSubs,          icon: Users       },
          { label: "All-time Subs",      value: totalAllSubs,             icon: TrendingUp  },
          { label: "Top Tier",           value: topTier ? `${topTier.badge} ${topTier.displayName}` : "—", icon: Crown },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-xl border bg-card p-4">
            <div className="mb-1 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{label}</p>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      {/* Tier editors */}
      <div className="space-y-4">
        <h2 className="font-semibold">Tier Configuration</h2>
        {tiers.map((tier) => (
          <TierEditor key={tier.id} tier={tier} onUpdated={handleUpdated} />
        ))}
      </div>

      {/* Recent subscriptions table */}
      {recentSubs.length > 0 && (
        <div>
          <h2 className="mb-4 font-semibold">Recent Subscriptions</h2>
          <div className="overflow-hidden rounded-xl border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Model</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Plan</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Amount</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Expires</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Paid</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {recentSubs.map((sub: any) => (
                  <tr key={sub.id} className="bg-card hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium">{sub.profile?.user?.name ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">{sub.profile?.user?.email}</p>
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {sub.tier.badge} {sub.tier.displayName}
                      {sub.grantedByAdmin && (
                        <span className="ml-2 rounded-full bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">Admin</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {sub.amountPaid ? `KES ${Number(sub.amountPaid).toLocaleString()}` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[sub.status] ?? ""}`}>
                        {sub.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {sub.expiresAt ? new Date(sub.expiresAt).toLocaleDateString("en-KE") : "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {new Date(sub.createdAt).toLocaleDateString("en-KE")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
