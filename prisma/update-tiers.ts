// prisma/update-tiers.ts
// Standalone script — upserts the 4 listing tiers with the correct pricing.
// Safe to run on a live database: only touches the listing_tiers table.
//
// Usage:
//   npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/update-tiers.ts
//   — or —
//   npx tsx prisma/update-tiers.ts

import { PrismaClient, TierName } from "@prisma/client";

const prisma = new PrismaClient();

const TIERS: {
  name:         TierName;
  displayName:  string;
  price:        number;
  durationDays: number;
  sortOrder:    number;
  badge:        string;
  color:        string;
  description:  string;
  perks:        string[];
  searchBoost:  number;
  featuredSlots:number;
}[] = [
  {
    name: "REGULAR", displayName: "Regular", price: 700, durationDays: 7,
    sortOrder: 0, badge: "🟢", color: "green",
    description: "Get started and appear in search results for 7 days.",
    perks: [
      "7-day listing",
      "Appear in search results",
      "Up to 5 services",
      "Client reviews & ratings",
    ],
    searchBoost: 0, featuredSlots: 0,
  },
  {
    name: "VIP", displayName: "VIP", price: 1250, durationDays: 14,
    sortOrder: 1, badge: "⭐", color: "blue",
    description: "More visibility for 14 days with a VIP badge.",
    perks: [
      "14-day listing",
      "VIP badge on profile",
      "Higher search ranking",
      "Up to 10 services",
      "Priority support",
    ],
    searchBoost: 10, featuredSlots: 0,
  },
  {
    name: "PREMIUM", displayName: "Premium", price: 1800, durationDays: 21,
    sortOrder: 2, badge: "💎", color: "purple",
    description: "Top placement and homepage features for 21 days.",
    perks: [
      "21-day listing",
      "Premium badge on profile",
      "Top search placement",
      "Up to 20 services",
      "Featured on homepage",
      "Profile analytics",
    ],
    searchBoost: 25, featuredSlots: 1,
  },
  {
    name: "VVIP", displayName: "VVIP", price: 2450, durationDays: 30,
    sortOrder: 3, badge: "👑", color: "amber",
    description: "Maximum exposure for a full month. Best value.",
    perks: [
      "30-day listing",
      "VVIP crown badge",
      "First in search results",
      "Unlimited services",
      "3× homepage featured slots",
      "Dedicated account manager",
      "Promoted on social media",
    ],
    searchBoost: 50, featuredSlots: 3,
  },
];

async function main() {
  console.log("Upserting listing tiers…");

  for (const tier of TIERS) {
    const result = await prisma.listingTier.upsert({
      where:  { name: tier.name },
      create: { ...tier, isActive: true },
      update: {
        displayName:   tier.displayName,
        price:         tier.price,
        durationDays:  tier.durationDays,
        sortOrder:     tier.sortOrder,
        badge:         tier.badge,
        color:         tier.color,
        description:   tier.description,
        perks:         tier.perks,
        searchBoost:   tier.searchBoost,
        featuredSlots: tier.featuredSlots,
        isActive:      true,
      },
    });
    console.log(`  ✓ ${result.displayName} — KES ${tier.price} / ${tier.durationDays} days (id=${result.id})`);
  }

  console.log("\nDone ✅");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
