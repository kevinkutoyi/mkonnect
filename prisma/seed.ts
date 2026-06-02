// prisma/seed.ts
import { PrismaClient, CategoryType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// =============================================================================
// ALL 47 KENYA COUNTIES
// =============================================================================
const counties = [
  { code: "001", name: "Mombasa",         slug: "mombasa",          region: "Coast" },
  { code: "002", name: "Kwale",           slug: "kwale",            region: "Coast" },
  { code: "003", name: "Kilifi",          slug: "kilifi",           region: "Coast" },
  { code: "004", name: "Tana River",      slug: "tana-river",       region: "Coast" },
  { code: "005", name: "Lamu",            slug: "lamu",             region: "Coast" },
  { code: "006", name: "Taita Taveta",    slug: "taita-taveta",     region: "Coast" },
  { code: "007", name: "Garissa",         slug: "garissa",          region: "North Eastern" },
  { code: "008", name: "Wajir",           slug: "wajir",            region: "North Eastern" },
  { code: "009", name: "Mandera",         slug: "mandera",          region: "North Eastern" },
  { code: "010", name: "Marsabit",        slug: "marsabit",         region: "Eastern" },
  { code: "011", name: "Isiolo",          slug: "isiolo",           region: "Eastern" },
  { code: "012", name: "Meru",            slug: "meru",             region: "Eastern" },
  { code: "013", name: "Tharaka-Nithi",   slug: "tharaka-nithi",    region: "Eastern" },
  { code: "014", name: "Embu",            slug: "embu",             region: "Eastern" },
  { code: "015", name: "Kitui",           slug: "kitui",            region: "Eastern" },
  { code: "016", name: "Machakos",        slug: "machakos",         region: "Eastern" },
  { code: "017", name: "Makueni",         slug: "makueni",          region: "Eastern" },
  { code: "018", name: "Nyandarua",       slug: "nyandarua",        region: "Central" },
  { code: "019", name: "Nyeri",           slug: "nyeri",            region: "Central" },
  { code: "020", name: "Kirinyaga",       slug: "kirinyaga",        region: "Central" },
  { code: "021", name: "Murang'a",        slug: "muranga",          region: "Central" },
  { code: "022", name: "Kiambu",          slug: "kiambu",           region: "Central" },
  { code: "023", name: "Turkana",         slug: "turkana",          region: "Rift Valley" },
  { code: "024", name: "West Pokot",      slug: "west-pokot",       region: "Rift Valley" },
  { code: "025", name: "Samburu",         slug: "samburu",          region: "Rift Valley" },
  { code: "026", name: "Trans Nzoia",     slug: "trans-nzoia",      region: "Rift Valley" },
  { code: "027", name: "Uasin Gishu",     slug: "uasin-gishu",      region: "Rift Valley" },
  { code: "028", name: "Elgeyo-Marakwet", slug: "elgeyo-marakwet",  region: "Rift Valley" },
  { code: "029", name: "Nandi",           slug: "nandi",            region: "Rift Valley" },
  { code: "030", name: "Baringo",         slug: "baringo",          region: "Rift Valley" },
  { code: "031", name: "Laikipia",        slug: "laikipia",         region: "Rift Valley" },
  { code: "032", name: "Nakuru",          slug: "nakuru",           region: "Rift Valley" },
  { code: "033", name: "Narok",           slug: "narok",            region: "Rift Valley" },
  { code: "034", name: "Kajiado",         slug: "kajiado",          region: "Rift Valley" },
  { code: "035", name: "Kericho",         slug: "kericho",          region: "Rift Valley" },
  { code: "036", name: "Bomet",           slug: "bomet",            region: "Rift Valley" },
  { code: "037", name: "Kakamega",        slug: "kakamega",         region: "Western" },
  { code: "038", name: "Vihiga",          slug: "vihiga",           region: "Western" },
  { code: "039", name: "Bungoma",         slug: "bungoma",          region: "Western" },
  { code: "040", name: "Busia",           slug: "busia",            region: "Western" },
  { code: "041", name: "Siaya",           slug: "siaya",            region: "Nyanza" },
  { code: "042", name: "Kisumu",          slug: "kisumu",           region: "Nyanza" },
  { code: "043", name: "Homa Bay",        slug: "homa-bay",         region: "Nyanza" },
  { code: "044", name: "Migori",          slug: "migori",           region: "Nyanza" },
  { code: "045", name: "Kisii",           slug: "kisii",            region: "Nyanza" },
  { code: "046", name: "Nyamira",         slug: "nyamira",          region: "Nyanza" },
  { code: "047", name: "Nairobi",         slug: "nairobi",          region: "Nairobi" },
];

// =============================================================================
// TOWNS & CITIES — key urban centres per county
// =============================================================================
const citiesData = [
  // Nairobi (047)
  { slug: "nairobi-cbd",         name: "Nairobi CBD",       county: "nairobi",      isCapital: true,  isMajor: true,  lat: -1.2921, lng: 36.8219 },
  { slug: "westlands",           name: "Westlands",          county: "nairobi",      isCapital: false, isMajor: true,  lat: -1.2676, lng: 36.8073 },
  { slug: "karen",               name: "Karen",              county: "nairobi",      isCapital: false, isMajor: false, lat: -1.3200, lng: 36.7100 },
  { slug: "kilimani",            name: "Kilimani",           county: "nairobi",      isCapital: false, isMajor: false, lat: -1.2916, lng: 36.7781 },
  { slug: "langata",             name: "Lang'ata",           county: "nairobi",      isCapital: false, isMajor: false, lat: -1.3552, lng: 36.7353 },
  { slug: "eastleigh",           name: "Eastleigh",          county: "nairobi",      isCapital: false, isMajor: false, lat: -1.2786, lng: 36.8467 },
  { slug: "kasarani",            name: "Kasarani",           county: "nairobi",      isCapital: false, isMajor: false, lat: -1.2194, lng: 36.8943 },
  { slug: "embakasi",            name: "Embakasi",           county: "nairobi",      isCapital: false, isMajor: false, lat: -1.3167, lng: 36.9000 },
  // Mombasa (001)
  { slug: "mombasa-city",        name: "Mombasa City",       county: "mombasa",      isCapital: true,  isMajor: true,  lat: -4.0435, lng: 39.6682 },
  { slug: "nyali",               name: "Nyali",              county: "mombasa",      isCapital: false, isMajor: false, lat: -4.0151, lng: 39.7194 },
  { slug: "bamburi",             name: "Bamburi",            county: "mombasa",      isCapital: false, isMajor: false, lat: -3.9669, lng: 39.7237 },
  { slug: "likoni",              name: "Likoni",             county: "mombasa",      isCapital: false, isMajor: false, lat: -4.0855, lng: 39.6636 },
  { slug: "diani-beach",         name: "Diani Beach",        county: "kwale",        isCapital: false, isMajor: true,  lat: -4.3167, lng: 39.5667 },
  // Kisumu (042)
  { slug: "kisumu-city",         name: "Kisumu City",        county: "kisumu",       isCapital: true,  isMajor: true,  lat: -0.1022, lng: 34.7617 },
  { slug: "kondele",             name: "Kondele",            county: "kisumu",       isCapital: false, isMajor: false, lat: -0.0922, lng: 34.7889 },
  // Nakuru (032)
  { slug: "nakuru-city",         name: "Nakuru City",        county: "nakuru",       isCapital: true,  isMajor: true,  lat: -0.3031, lng: 36.0800 },
  { slug: "naivasha",            name: "Naivasha",           county: "nakuru",       isCapital: false, isMajor: true,  lat: -0.7167, lng: 36.4333 },
  // Uasin Gishu / Eldoret (027)
  { slug: "eldoret",             name: "Eldoret",            county: "uasin-gishu",  isCapital: true,  isMajor: true,  lat:  0.5143, lng: 35.2698 },
  // Kiambu (022)
  { slug: "thika",               name: "Thika",              county: "kiambu",       isCapital: false, isMajor: true,  lat: -1.0332, lng: 37.0693 },
  { slug: "ruiru",               name: "Ruiru",              county: "kiambu",       isCapital: false, isMajor: false, lat: -1.1460, lng: 36.9593 },
  { slug: "kiambu-town",         name: "Kiambu Town",        county: "kiambu",       isCapital: true,  isMajor: false, lat: -1.1712, lng: 36.8359 },
  // Nyeri (019)
  { slug: "nyeri-town",          name: "Nyeri Town",         county: "nyeri",        isCapital: true,  isMajor: true,  lat: -0.4167, lng: 36.9500 },
  { slug: "nanyuki",             name: "Nanyuki",            county: "laikipia",     isCapital: true,  isMajor: true,  lat:  0.0167, lng: 37.0667 },
  // Meru (012)
  { slug: "meru-town",           name: "Meru Town",          county: "meru",         isCapital: true,  isMajor: true,  lat:  0.0470, lng: 37.6490 },
  // Embu (014)
  { slug: "embu-town",           name: "Embu Town",          county: "embu",         isCapital: true,  isMajor: false, lat: -0.5287, lng: 37.4586 },
  // Machakos (016)
  { slug: "machakos-town",       name: "Machakos Town",      county: "machakos",     isCapital: true,  isMajor: false, lat: -1.5177, lng: 37.2634 },
  { slug: "athi-river",          name: "Athi River",         county: "machakos",     isCapital: false, isMajor: true,  lat: -1.4543, lng: 36.9784 },
  // Kilifi (003)
  { slug: "malindi",             name: "Malindi",            county: "kilifi",       isCapital: false, isMajor: true,  lat: -3.2138, lng: 40.1169 },
  { slug: "kilifi-town",         name: "Kilifi Town",        county: "kilifi",       isCapital: true,  isMajor: false, lat: -3.6305, lng: 39.8499 },
  { slug: "watamu",              name: "Watamu",             county: "kilifi",       isCapital: false, isMajor: false, lat: -3.3553, lng: 40.0161 },
  // Lamu (005)
  { slug: "lamu-town",           name: "Lamu Town",          county: "lamu",         isCapital: true,  isMajor: true,  lat: -2.2697, lng: 40.9025 },
  // Taita Taveta (006)
  { slug: "voi",                 name: "Voi",                county: "taita-taveta", isCapital: true,  isMajor: false, lat: -3.3954, lng: 38.5563 },
  // Kajiado (034)
  { slug: "ngong",               name: "Ngong",              county: "kajiado",      isCapital: false, isMajor: true,  lat: -1.3607, lng: 36.6555 },
  { slug: "kitengela",           name: "Kitengela",          county: "kajiado",      isCapital: false, isMajor: true,  lat: -1.4693, lng: 36.9604 },
  // Kericho (035)
  { slug: "kericho-town",        name: "Kericho Town",       county: "kericho",      isCapital: true,  isMajor: false, lat: -0.3677, lng: 35.2839 },
  // Kakamega (037)
  { slug: "kakamega-town",       name: "Kakamega Town",      county: "kakamega",     isCapital: true,  isMajor: true,  lat:  0.2827, lng: 34.7519 },
  // Bungoma (039)
  { slug: "bungoma-town",        name: "Bungoma Town",       county: "bungoma",      isCapital: true,  isMajor: false, lat:  0.5635, lng: 34.5606 },
  // Kisii (045)
  { slug: "kisii-town",          name: "Kisii Town",         county: "kisii",        isCapital: true,  isMajor: true,  lat: -0.6817, lng: 34.7660 },
  // Migori (044)
  { slug: "migori-town",         name: "Migori Town",        county: "migori",       isCapital: true,  isMajor: false, lat: -1.0634, lng: 34.4731 },
  // Homa Bay (043)
  { slug: "homa-bay-town",       name: "Homa Bay Town",      county: "homa-bay",     isCapital: true,  isMajor: false, lat: -0.5267, lng: 34.4571 },
  // Trans Nzoia (026)
  { slug: "kitale",              name: "Kitale",             county: "trans-nzoia",  isCapital: true,  isMajor: true,  lat:  1.0154, lng: 35.0062 },
  // Narok (033)
  { slug: "narok-town",          name: "Narok Town",         county: "narok",        isCapital: true,  isMajor: false, lat: -1.0820, lng: 35.8720 },
  // Garissa (007)
  { slug: "garissa-town",        name: "Garissa Town",       county: "garissa",      isCapital: true,  isMajor: false, lat: -0.4532, lng: 39.6460 },
  // Turkana (023)
  { slug: "lodwar",              name: "Lodwar",             county: "turkana",      isCapital: true,  isMajor: false, lat:  3.1191, lng: 35.5970 },
  // Isiolo (011)
  { slug: "isiolo-town",         name: "Isiolo Town",        county: "isiolo",       isCapital: true,  isMajor: false, lat:  0.3546, lng: 37.5820 },
  // Marsabit (010)
  { slug: "marsabit-town",       name: "Marsabit Town",      county: "marsabit",     isCapital: true,  isMajor: false, lat:  2.3284, lng: 37.9897 },
  // Murang'a (021)
  { slug: "muranga-town",        name: "Murang'a Town",      county: "muranga",      isCapital: true,  isMajor: false, lat: -0.7167, lng: 37.1500 },
  // Kirinyaga (020)
  { slug: "kerugoya",            name: "Kerugoya",           county: "kirinyaga",    isCapital: true,  isMajor: false, lat: -0.4930, lng: 37.2820 },
  // Nyandarua (018)
  { slug: "ol-kalou",            name: "Ol Kalou",           county: "nyandarua",    isCapital: true,  isMajor: false, lat: -0.2667, lng: 36.3833 },
];

// =============================================================================
// SERVICE CATEGORIES
// =============================================================================
const categories: { name: string; slug: string; description: string; type: CategoryType; icon: string; sortOrder: number }[] = [
  // Massage Styles
  { name: "Swedish Massage",        slug: "swedish",           description: "Classic relaxation massage with long, flowing strokes.",          type: "MASSAGE_STYLE", icon: "🧘", sortOrder: 1 },
  { name: "Deep Tissue Massage",    slug: "deep-tissue",       description: "Targets deep muscle layers to relieve chronic tension.",          type: "MASSAGE_STYLE", icon: "💪", sortOrder: 2 },
  { name: "Hot Stone Massage",      slug: "hot-stone",         description: "Uses heated volcanic stones to relax muscles.",                  type: "MASSAGE_STYLE", icon: "🪨", sortOrder: 3 },
  { name: "Aromatherapy Massage",   slug: "aromatherapy",      description: "Essential oils combined with massage for holistic relaxation.",   type: "MASSAGE_STYLE", icon: "🌸", sortOrder: 4 },
  { name: "Thai Massage",           slug: "thai",              description: "Traditional Thai stretching and pressure-point technique.",       type: "MASSAGE_STYLE", icon: "🙏", sortOrder: 5 },
  { name: "Reflexology",            slug: "reflexology",       description: "Pressure applied to feet, hands, and ears.",                     type: "MASSAGE_STYLE", icon: "👣", sortOrder: 6 },
  { name: "Shiatsu Massage",        slug: "shiatsu",           description: "Japanese pressure-point technique for energy balance.",          type: "MASSAGE_STYLE", icon: "✋", sortOrder: 7 },
  { name: "Lymphatic Drainage",     slug: "lymphatic-drainage",description: "Gentle massage to stimulate the lymphatic system.",              type: "MASSAGE_STYLE", icon: "💧", sortOrder: 8 },
  { name: "Couples Massage",        slug: "couples",           description: "Side-by-side massage session for two people.",                   type: "MASSAGE_STYLE", icon: "👫", sortOrder: 9 },
  { name: "Four-Hand Massage",      slug: "four-hand",         description: "Two therapists working simultaneously.",                         type: "MASSAGE_STYLE", icon: "🤲", sortOrder: 10 },
  // Specialties
  { name: "Prenatal Massage",       slug: "prenatal",          description: "Safe, targeted massage for pregnant clients.",                   type: "SPECIALTY",     icon: "🤰", sortOrder: 11 },
  { name: "Postnatal Massage",      slug: "postnatal",         description: "Recovery-focused massage for new mothers.",                      type: "SPECIALTY",     icon: "👶", sortOrder: 12 },
  { name: "Sports Massage",         slug: "sports",            description: "Targeted at athletes for injury prevention and recovery.",       type: "SPECIALTY",     icon: "⚽", sortOrder: 13 },
  { name: "Elderly Care Massage",   slug: "elderly-care",      description: "Gentle massage tailored for older clients.",                     type: "SPECIALTY",     icon: "👴", sortOrder: 14 },
  { name: "Oncology Massage",       slug: "oncology",          description: "Gentle, specialist massage for cancer patients.",                type: "SPECIALTY",     icon: "🎗️", sortOrder: 15 },
  { name: "Scar Tissue Massage",    slug: "scar-tissue",       description: "Specialised technique to reduce scar tissue adhesions.",        type: "SPECIALTY",     icon: "🩹", sortOrder: 16 },
  // Settings
  { name: "Home Visit",             slug: "home-visit",        description: "Masseuse travels to the client's location.",                     type: "SETTING",       icon: "🏠", sortOrder: 17 },
  { name: "Hotel / Airbnb",         slug: "hotel-airbnb",      description: "Session at client's hotel or short-stay accommodation.",        type: "SETTING",       icon: "🏨", sortOrder: 18 },
  { name: "Spa / Studio",           slug: "spa-studio",        description: "Session at the masseuse's own spa or studio.",                  type: "SETTING",       icon: "🛁", sortOrder: 19 },
  { name: "Corporate / Office",     slug: "corporate-office",  description: "Chair massage for workplace wellness programmes.",               type: "SETTING",       icon: "🏢", sortOrder: 20 },
  // Body Areas
  { name: "Full Body",              slug: "full-body",         description: "Complete head-to-toe massage.",                                  type: "BODY_AREA",     icon: "🧍", sortOrder: 21 },
  { name: "Back & Neck",            slug: "back-neck",         description: "Focused on the back, shoulders, and neck.",                     type: "BODY_AREA",     icon: "🔙", sortOrder: 22 },
  { name: "Head & Scalp",           slug: "head-scalp",        description: "Relaxing scalp and head massage.",                              type: "BODY_AREA",     icon: "🧠", sortOrder: 23 },
  { name: "Legs & Feet",            slug: "legs-feet",         description: "Focused on legs, calves, and feet.",                            type: "BODY_AREA",     icon: "🦵", sortOrder: 24 },
  { name: "Facial Massage",         slug: "facial",            description: "Gentle massage for the face and décolletage.",                  type: "BODY_AREA",     icon: "😌", sortOrder: 25 },
];

// =============================================================================
// SEED RUNNER
// =============================================================================
async function main() {
  console.log("🌱 Seeding mconnect database…\n");

  // 1. Counties
  console.log("📍 Seeding 47 counties…");
  for (const c of counties) {
    await prisma.county.upsert({
      where: { code: c.code },
      update: { name: c.name, slug: c.slug, region: c.region },
      create: c,
    });
  }
  console.log(`   ✓ ${counties.length} counties`);

  // 2. Cities
  console.log("🏙️  Seeding towns and cities…");
  // Build a slug→id lookup for counties
  const countyMap = await prisma.county.findMany({ select: { id: true, slug: true } });
  const countySlugToId = Object.fromEntries(countyMap.map((c) => [c.slug, c.id]));

  for (const city of citiesData) {
    const countyId = countySlugToId[city.county];
    if (!countyId) { console.warn(`   ⚠ County not found: ${city.county}`); continue; }
    await prisma.city.upsert({
      where: { slug: city.slug },
      update: {
        name: city.name,
        countyId,
        isCapital: city.isCapital,
        isMajor: city.isMajor,
        latitude: city.lat,
        longitude: city.lng,
      },
      create: {
        slug: city.slug,
        name: city.name,
        countyId,
        isCapital: city.isCapital,
        isMajor: city.isMajor,
        latitude: city.lat,
        longitude: city.lng,
      },
    });
  }
  console.log(`   ✓ ${citiesData.length} cities/towns`);

  // 3. Categories
  console.log("🗂️  Seeding service categories…");
  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: cat,
      create: cat,
    });
  }
  console.log(`   ✓ ${categories.length} categories`);

  // 4. Admin user
  console.log("👤 Seeding admin user…");
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

  console.log("\n✅ Seed complete!");
  console.log(`   Counties : ${counties.length}`);
  console.log(`   Cities   : ${citiesData.length}`);
  console.log(`   Categories: ${categories.length}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
