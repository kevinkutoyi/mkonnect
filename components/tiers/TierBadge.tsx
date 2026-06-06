// components/tiers/TierBadge.tsx
// Small reusable badge shown on profile cards and profile pages

import { cn } from "@/lib/utils";
import type { TierName } from "@prisma/client";

const TIER_STYLES: Record<TierName, { bg: string; text: string; ring: string }> = {
  REGULAR: { bg: "bg-green-100 dark:bg-green-900/30",   text: "text-green-700 dark:text-green-400",   ring: "ring-green-300 dark:ring-green-700"   },
  VIP:     { bg: "bg-blue-100 dark:bg-blue-900/30",     text: "text-blue-700 dark:text-blue-400",     ring: "ring-blue-300 dark:ring-blue-700"     },
  PREMIUM: { bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-700 dark:text-purple-400", ring: "ring-purple-300 dark:ring-purple-700" },
  VVIP:    { bg: "bg-amber-100 dark:bg-amber-900/30",   text: "text-amber-700 dark:text-amber-400",   ring: "ring-amber-300 dark:ring-amber-700"   },
};

const TIER_BADGES: Record<TierName, string> = {
  REGULAR: "🟢",
  VIP:     "⭐",
  PREMIUM: "💎",
  VVIP:    "👑",
};

interface TierBadgeProps {
  tier: TierName;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export function TierBadge({ tier, size = "md", showLabel = true, className }: TierBadgeProps) {
  const styles = TIER_STYLES[tier];
  const badge  = TIER_BADGES[tier];

  const sizeClass = {
    sm: "px-1.5 py-0.5 text-xs gap-1",
    md: "px-2.5 py-1 text-xs gap-1.5",
    lg: "px-3 py-1.5 text-sm gap-2 font-semibold",
  }[size];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full ring-1",
        styles.bg, styles.text, styles.ring,
        sizeClass, className
      )}
    >
      <span>{badge}</span>
      {showLabel && <span className="font-medium">{tier}</span>}
    </span>
  );
}
