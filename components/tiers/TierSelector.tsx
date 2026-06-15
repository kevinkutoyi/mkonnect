"use client";
// components/tiers/TierSelector.tsx
// Masseuse-facing tier selection + payment initiation

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Crown, Sparkles, Star, Zap } from "lucide-react";
import { formatKES } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { TierName } from "@prisma/client";

interface Tier {
  id: number;
  name: TierName;
  displayName: string;
  price: string | number;
  durationDays: number;
  badge: string;
  color: string;
  description: string;
  perks: string[];
  searchBoost: number;
  featuredSlots: number;
}

interface ActiveSub {
  tierId: number;
  tierName: TierName;
  expiresAt: string;
  status: string;
}

interface TierSelectorProps {
  tiers:     Tier[];
  activeSub: ActiveSub | null;
}

const TIER_ICONS: Record<TierName, React.ReactNode> = {
  REGULAR: <Zap      className="h-5 w-5" />,
  VIP:     <Star     className="h-5 w-5" />,
  PREMIUM: <Sparkles className="h-5 w-5" />,
  VVIP:    <Crown    className="h-5 w-5" />,
};

const TIER_GRADIENTS: Record<TierName, string> = {
  REGULAR: "from-green-50  to-green-100/50  dark:from-green-950/20  dark:to-green-900/10",
  VIP:     "from-blue-50   to-blue-100/50   dark:from-blue-950/20   dark:to-blue-900/10",
  PREMIUM: "from-purple-50 to-purple-100/50 dark:from-purple-950/20 dark:to-purple-900/10",
  VVIP:    "from-amber-50  to-amber-100/50  dark:from-amber-950/20  dark:to-amber-900/10",
};

const TIER_ACCENT: Record<TierName, string> = {
  REGULAR: "border-green-300  dark:border-green-700  ring-green-300",
  VIP:     "border-blue-300   dark:border-blue-700   ring-blue-300",
  PREMIUM: "border-purple-300 dark:border-purple-700 ring-purple-300",
  VVIP:    "border-amber-300  dark:border-amber-700  ring-amber-300",
};

const TIER_ICON_COLOR: Record<TierName, string> = {
  REGULAR: "text-green-600  bg-green-100  dark:text-green-400  dark:bg-green-900/30",
  VIP:     "text-blue-600   bg-blue-100   dark:text-blue-400   dark:bg-blue-900/30",
  PREMIUM: "text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/30",
  VVIP:    "text-amber-600  bg-amber-100  dark:text-amber-400  dark:bg-amber-900/30",
};

export function TierSelector({ tiers, activeSub }: TierSelectorProps) {
  const router   = useRouter();
  const [loading, setLoading] = useState<number | null>(null);
  const [error,   setError]   = useState<string | null>(null);

  const handleSubscribe = async (tierId: number) => {
    setLoading(tierId);
    setError(null);
    try {
      const res  = await fetch("/api/tiers/subscribe", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ tierId }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Failed to initiate payment.");
        return;
      }
      // Redirect to Pesapal
      window.location.href = json.redirectUrl;
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  const isCurrentTier = (tierId: number) =>
    activeSub?.tierId === tierId && activeSub?.status === "ACTIVE";

  const isExpiringSoon = (tierId: number) => {
    if (!isCurrentTier(tierId) || !activeSub?.expiresAt) return false;
    const daysLeft = Math.ceil(
      (new Date(activeSub.expiresAt).getTime() - Date.now()) / 86_400_000
    );
    return daysLeft <= 7;
  };

  return (
    <div className="space-y-6">
      {/* Active subscription banner */}
      {activeSub && activeSub.status === "ACTIVE" && (
        <div className="flex items-center justify-between rounded-xl border bg-card px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="text-xl">
              {tiers.find((t) => t.id === activeSub.tierId)?.badge ?? ""}
            </span>
            <div>
              <p className="font-semibold text-sm">
                {tiers.find((t) => t.id === activeSub.tierId)?.displayName} — Active
              </p>
              <p className="text-xs text-muted-foreground">
                Expires {new Date(activeSub.expiresAt).toLocaleDateString("en-KE", {
                  day: "numeric", month: "long", year: "numeric",
                })}
              </p>
            </div>
          </div>
          {isExpiringSoon(activeSub.tierId) && (
            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
              Expiring soon
            </span>
          )}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Tier cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiers.map((tier) => {
          const active    = isCurrentTier(tier.id);
          const expiring  = isExpiringSoon(tier.id);
          const isVVIP    = tier.name === "VVIP";
          const loadingThis = loading === tier.id;

          return (
            <div
              key={tier.id}
              className={cn(
                "relative flex flex-col rounded-2xl border-2 bg-gradient-to-b p-5 transition-all",
                TIER_GRADIENTS[tier.name],
                active ? cn("border-2 ring-2 ring-offset-2", TIER_ACCENT[tier.name])
                       : "border-border hover:border-muted-foreground/40",
                isVVIP && !active && "border-amber-200 dark:border-amber-800"
              )}
            >
              {/* Popular / active badge */}
              {isVVIP && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-amber-500 px-3 py-0.5 text-xs font-bold text-white shadow">
                    Most Popular
                  </span>
                </div>
              )}
              {active && (
                <div className="absolute -top-3 right-4">
                  <span className="rounded-full bg-primary px-3 py-0.5 text-xs font-bold text-primary-foreground shadow">
                    {expiring ? "⚠ Expiring" : "✓ Active"}
                  </span>
                </div>
              )}

              {/* Header */}
              <div className="mb-4 flex items-center gap-3">
                <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", TIER_ICON_COLOR[tier.name])}>
                  {TIER_ICONS[tier.name]}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">{tier.badge}</span>
                    <h3 className="font-bold">{tier.displayName}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground">{tier.durationDays} days</p>
                </div>
              </div>

              {/* Price */}
              <div className="mb-4">
                <span className="text-3xl font-extrabold">{formatKES(Number(tier.price))}</span>
                <span className="text-sm text-muted-foreground"> / {tier.durationDays}d</span>
              </div>

              {/* Description */}
              <p className="mb-4 text-xs text-muted-foreground leading-relaxed">{tier.description}</p>

              {/* Perks */}
              <ul className="mb-6 flex-1 space-y-2">
                {(tier.perks as string[]).map((perk, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs">
                    <Check className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", TIER_ICON_COLOR[tier.name].split(" ")[0])} />
                    <span>{perk}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <button
                onClick={() => handleSubscribe(tier.id)}
                disabled={loadingThis || (active && !expiring)}
                className={cn(
                  "flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all",
                  active && !expiring
                    ? "bg-muted text-muted-foreground cursor-default"
                    : cn(
                        "text-white shadow-sm hover:opacity-90 active:scale-95",
                        tier.name === "REGULAR" ? "bg-green-600"
                        : tier.name === "VIP"    ? "bg-blue-600"
                        : tier.name === "PREMIUM" ? "bg-purple-600"
                        : "bg-amber-500"
                      )
                )}
              >
                {loadingThis ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Redirecting…</>
                ) : active && !expiring ? (
                  "Current plan"
                ) : expiring ? (
                  "Renew now"
                ) : activeSub ? (
                  "Upgrade"
                ) : (
                  "Get started"
                )}
              </button>
            </div>
          );
        })}
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Secure payment via Pesapal · M-Pesa and cards accepted · Auto-renewal optional
      </p>
    </div>
  );
}
