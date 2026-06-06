// prisma/seed.ts
import { PrismaClient, CategoryType, TierName } from "@prisma/client";
import bcrypt from "bcryptjs";
import { KENYA_COUNTIES, KENYA_CITIES } from "./kenya-locations";

// ─── Listing Tiers ────────────────────────────────────────────────────────────
const LISTING_TIERS: {
  name: TierName; displayName: string; price: number; durationDays: number;
  sortOrder: number; badge: string; color: string; description: string;
  perks: string[]; searchBoost: number; featuredSlots: number;
}[] = [
  {
    name: "REGULAR", displayName: "Regular", price: 500, durationDays: 30,
    sortOrder: 0, badge: "🟢", color: "green",
    description: "Start listing your services on mconnect.",
    perks: [
      "Basic profile listing",
      "Appear in search results",
      "Up to 5 services",
      "Client reviews & ratings",
    ],
    searchBoost: 0, featuredSlots: 0,
  },
  {
    name: "VIP", displayName: "VIP", price: 1500, durationDays: 30,
    sortOrder: 1, badge: "⭐", color: "blue",
    description: "Stand out from Regular listings with enhanced visibility.",
    perks: [
      "Everything in Regular",
      "VIP badge on profile",
      "Higher search ranking",
      "Up to 10 services",
      "Priority support",
    ],
    searchBoost: 10, featuredSlots: 0,
  },
  {
    name: "PREMIUM", displayName: "Premium", price: 3500, durationDays: 30,
    sortOrder: 2, badge: "💎", color: "purple",
    description: "Top placement and featured exposure for serious professionals.",
    perks: [
      "Everything in VIP",
      "Premium badge on profile",
      "Top search placement",
      "Up to 20 services",
      "Featured on homepage",
      "Profile analytics",
    ],
    searchBoost: 25, featuredSlots: 1,
  },
  {
    name: "VVIP", displayName: "VVIP", price: 7500, durationDays: 30,
    sortOrder: 3, badge: "👑", color: "amber",
    description: "Maximum visibility. The highest tier on mconnect.",
    perks: [
      "Everything in Premium",
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

const prisma = new PrismaClient();

// ─── Service Categories ───────────────────────────────────────────────────────
const CATEGORIES: {
  name: string; slug: string; description: string;
  type: CategoryType; icon: string; sortOrder: number;
}[] = [
  { name: "Swedish Massage",       slug: "swedish",            description: "Classic relaxation massage with long, flowing strokes.",        type: "MASSAGE_STYLE", icon: "🧘", sortOrder: 1 },
  { name: "Deep Tissue Massage",   slug: "deep-tissue",        description: "Targets deep muscle layers to relieve chronic tension.",        type: "MASSAGE_STYLE", icon: "💪", sortOrder: 2 },
  { name: "Hot Stone Massage",     slug: "hot-stone",          description: "Uses heated volcanic stones to relax muscles.",                type: "MASSAGE_STYLE", icon: "🪨", sortOrder: 3 },
  { name: "Aromatherapy Massage",  slug: "aromatherapy",       description: "Essential oils combined with massage for holistic relaxation.", type: "MASSAGE_STYLE", icon: "🌸", sortOrder: 4 },
  { name: "Thai Massage",          slug: "thai",               description: "Traditional Thai stretching and pressure-point technique.",     type: "MASSAGE_STYLE", icon: "🙏", sortOrder: 5 },
  { name: "Reflexology",           slug: "reflexology",        description: "Pressure applied to feet, hands, and ears.",                   type: "MASSAGE_STYLE", icon: "👣", sortOrder: 6 },
  { name: "Shiatsu Massage",       slug: "shiatsu",            description: "Japanese pressure-point technique for energy balance.",        type: "MASSAGE_STYLE", icon: "✋", sortOrder: 7 },
  { name: "Lymphatic Drainage",    slug: "lymphatic-drainage", description: "Gentle massage to stimulate the lymphatic system.",            type: "MASSAGE_STYLE", icon: "💧", sortOrder: 8 },
  { name: "Couples Massage",       slug: "couples",            description: "Side-by-side massage session for two people.",                 type: "MASSAGE_STYLE", icon: "👫", sortOrder: 9 },
  { name: "Four-Hand Massage",     slug: "four-hand",          description: "Two therapists working simultaneously.",                       type: "MASSAGE_STYLE", icon: "🤲", sortOrder: 10 },
  { name: "Prenatal Massage",      slug: "prenatal",           description: "Safe, targeted massage for pregnant clients.",                 type: "SPECIALTY",     icon: "🤰", sortOrder: 11 },
  { name: "Postnatal Massage",     slug: "postnatal",          description: "Recovery-focused massage for new mothers.",                    type: "SPECIALTY",     icon: "👶", sortOrder: 12 },
  { name: "Sports Massage",        slug: "sports",             description: "Targeted at athletes for injury prevention and recovery.",     type: "SPECIALTY",     icon: "⚽", sortOrder: 13 },
  { name: "Elderly Care Massage",  slug: "elderly-care",       description: "Gentle massage tailored for older clients.",                   type: "SPECIALTY",     icon: "👴", sortOrder: 14 },
  { name: "Oncology Massage",      slug: "oncology",           description: "Gentle, specialist massage for cancer patients.",              type: "SPECIALTY",     icon: "🎗️", sortOrder: 15 },
  { name: "Scar Tissue Massage",   slug: "scar-tissue",        description: "Specialised technique to reduce scar tissue adhesions.",      type: "SPECIALTY",     icon: "🩹", sortOrder: 16 },
  { name: "Home Visit",            slug: "home-visit",         description: "Masseuse travels to the client's location.",                  type: "SETTING",       icon: "🏠", sortOrder: 17 },
  { name: "Hotel / Airbnb",        slug: "hotel-airbnb",       description: "Session at client's hotel or short-stay accommodation.",      type: "SETTING",       icon: "🏨", sortOrder: 18 },
  { name: "Spa / Studio",          slug: "spa-studio",         description: "Session at the masseuse's own spa or studio.",               type: "SETTING",       icon: "🛁", sortOrder: 19 },
  { name: "Corporate / Office",    slug: "corporate-office",   description: "Chair massage for workplace wellness programmes.",             type: "SETTING",       icon: "🏢", sortOrder: 20 },
  { name: "Full Body",             slug: "full-body",          description: "Complete head-to-toe massage.",                               type: "BODY_AREA",     icon: "🧍", sortOrder: 21 },
  { name: "Back & Neck",           slug: "back-neck",          description: "Focused on the back, shoulders, and neck.",                  type: "BODY_AREA",     icon: "🔙", sortOrder: 22 },
  { name: "Head & Scalp",          slug: "head-scalp",         description: "Relaxing scalp and head massage.",                           type: "BODY_AREA",     icon: "🧠", sortOrder: 23 },
  { name: "Legs & Feet",           slug: "legs-feet",          description: "Focused on legs, calves, and feet.",                         type: "BODY_AREA",     icon: "🦵", sortOrder: 24 },
  { name: "Facial Massage",        slug: "facial",             description: "Gentle massage for the face and décolletage.",               type: "BODY_AREA",     icon: "😌", sortOrder: 25 },
];

// ─── Seed runner ─────────────────────────────────────────────────────────────
async function main() {
  console.log("🌱 Seeding mconnect database…\n");

  // 1. Counties
  console.log(`📍 Seeding ${KENYA_COUNTIES.length} counties…`);
  for (const c of KENYA_COUNTIES) {
    await prisma.county.upsert({
      where: { code: c.code },
      update: { name: c.name, slug: c.slug, region: c.region },
      create: { code: c.code, name: c.name, slug: c.slug, region: c.region },
    });
  }
  console.log(`   ✓ ${KENYA_COUNTIES.length} counties seeded`);

  // 2. Cities / Towns
  console.log(`\n🏙️  Seeding ${KENYA_CITIES.length} towns and cities…`);
  const countyMap = await prisma.county.findMany({ select: { id: true, slug: true } });
  const countySlugToId = Object.fromEntries(countyMap.map((c) => [c.slug, c.id]));

  let citiesSeeded = 0;
  let citiesSkipped = 0;
  for (const city of KENYA_CITIES) {
    const countyId = countySlugToId[city.county];
    if (!countyId) {
      console.warn(`   ⚠  County not found: "${city.county}" for city "${city.name}"`);
      citiesSkipped++;
      continue;
    }
    await prisma.city.upsert({
      where: { slug: city.slug },
      update: {
        name: city.name, countyId,
        isCapital: city.isCapital, isMajor: city.isMajor,
        latitude: city.lat, longitude: city.lng,
      },
      create: {
        slug: city.slug, name: city.name, countyId,
        isCapital: city.isCapital, isMajor: city.isMajor,
        latitude: city.lat, longitude: city.lng,
      },
    });
    citiesSeeded++;
  }
  console.log(`   ✓ ${citiesSeeded} cities/towns seeded${citiesSkipped > 0 ? ` (${citiesSkipped} skipped)` : ""}`);

  // 3. Categories
  console.log(`\n🗂️  Seeding ${CATEGORIES.length} service categories…`);
  for (const cat of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: cat,
      create: cat,
    });
  }
  console.log(`   ✓ ${CATEGORIES.length} categories seeded`);

  // 4. Admin user
  console.log(`\n👤 Seeding admin user…`);
  const adminPassword = await bcrypt.hash("Admin@mconnect2024!", 12);
  await prisma.user.upsert({
    where: { email: "admin@mconnect.co.ke" },
    update: {},
    create: {
      name: "Platform Admin",
      email: "admin@mconnect.co.ke",
      password: adminPassword,
      role: "ADMIN",
    },
  });
  console.log("   ✓ admin@mconnect.co.ke");

  // 5. Listing tiers
  console.log(`\n🏷️  Seeding ${LISTING_TIERS.length} listing tiers…`);
  for (const tier of LISTING_TIERS) {
    await prisma.listingTier.upsert({
      where: { name: tier.name },
      update: {
        displayName: tier.displayName,
        price: tier.price,
        durationDays: tier.durationDays,
        sortOrder: tier.sortOrder,
        badge: tier.badge,
        color: tier.color,
        description: tier.description,
        perks: tier.perks,
        searchBoost: tier.searchBoost,
        featuredSlots: tier.featuredSlots,
      },
      create: tier,
    });
  }
  console.log(`   ✓ ${LISTING_TIERS.map((t) => t.displayName).join(", ")} tiers seeded`);

  console.log("\n✅ Seed complete!");
  console.log(`   Counties  : ${KENYA_COUNTIES.length}`);
  console.log(`   Cities    : ${citiesSeeded}`);
  console.log(`   Categories: ${CATEGORIES.length}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
