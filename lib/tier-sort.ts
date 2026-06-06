// lib/tier-sort.ts
// Single source of truth for tier-boosted listing order.
//
// profileScore is a denormalized integer written to MasseuseProfile whenever
// a subscription activates (see app/api/tiers/callback/route.ts):
//
//   VVIP    → searchBoost = 50
//   PREMIUM → searchBoost = 25
//   VIP     → searchBoost = 10
//   REGULAR → searchBoost =  0
//
// Sorting by [{ profileScore: "desc" }, baseOrderBy] therefore gives:
//   1. VVIP  (score 50)
//   2. PREMIUM (score 25)
//   3. VIP  (score 10)
//   4. REGULAR (score 0)
//   … ties broken by whatever baseOrderBy specifies.

import type { TierName } from "@prisma/client";

// ─── Numeric rank (lower = higher priority) ──────────────────────────────────
export const TIER_RANK: Record<TierName, number> = {
  VVIP:    0,
  PREMIUM: 1,
  VIP:     2,
  REGULAR: 3,
};

// ─── Prisma orderBy that always leads with tier priority ─────────────────────
/**
 * Wrap any secondary Prisma orderBy clause with the tier-priority lead.
 *
 * Usage:
 *   orderBy: tierOrderBy({ avgRating: "desc" })
 *   orderBy: tierOrderBy([{ createdAt: "desc" }])
 */
export function tierOrderBy(
  secondary: Record<string, unknown> | Record<string, unknown>[]
): Record<string, unknown>[] {
  const secondaryArray = Array.isArray(secondary) ? secondary : [secondary];
  return [{ profileScore: "desc" }, ...secondaryArray];
}

// ─── Sort helper for in-memory arrays (e.g. seed data, tests) ─────────────────
export function sortByTier<T extends { activeTierName?: TierName | null }>(
  items: T[],
  secondaryKey?: keyof T,
  secondaryDir: "asc" | "desc" = "desc"
): T[] {
  return [...items].sort((a, b) => {
    const rankA = TIER_RANK[a.activeTierName ?? "REGULAR"];
    const rankB = TIER_RANK[b.activeTierName ?? "REGULAR"];
    if (rankA !== rankB) return rankA - rankB;
    if (!secondaryKey) return 0;
    const va = a[secondaryKey] as number;
    const vb = b[secondaryKey] as number;
    return secondaryDir === "desc" ? vb - va : va - vb;
  });
}
