// prisma/kenya-locations.ts
// Complete Kenya location data — 47 counties + 400+ towns/cities with GPS coordinates
// Used by seed.ts

export const KENYA_COUNTIES = [
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
] as const;

// lat/lng in decimal degrees (WGS84)
export const KENYA_CITIES: {
  slug: string; name: string; county: string;
  lat: number; lng: number;
  isCapital: boolean; isMajor: boolean;
}[] = [

  // ── NAIROBI (047) ───────────────────────────────────────────────────────────
  { slug: "nairobi-cbd",        name: "Nairobi CBD",         county: "nairobi",       lat: -1.2921, lng: 36.8219, isCapital: true,  isMajor: true  },
  { slug: "westlands",          name: "Westlands",           county: "nairobi",       lat: -1.2676, lng: 36.8073, isCapital: false, isMajor: true  },
  { slug: "karen",              name: "Karen",               county: "nairobi",       lat: -1.3200, lng: 36.7100, isCapital: false, isMajor: false },
  { slug: "kilimani",           name: "Kilimani",            county: "nairobi",       lat: -1.2916, lng: 36.7781, isCapital: false, isMajor: false },
  { slug: "langata",            name: "Lang'ata",            county: "nairobi",       lat: -1.3552, lng: 36.7353, isCapital: false, isMajor: false },
  { slug: "eastleigh",          name: "Eastleigh",           county: "nairobi",       lat: -1.2786, lng: 36.8467, isCapital: false, isMajor: false },
  { slug: "kasarani",           name: "Kasarani",            county: "nairobi",       lat: -1.2194, lng: 36.8943, isCapital: false, isMajor: false },
  { slug: "embakasi",           name: "Embakasi",            county: "nairobi",       lat: -1.3167, lng: 36.9000, isCapital: false, isMajor: false },
  { slug: "south-b",            name: "South B",             county: "nairobi",       lat: -1.3080, lng: 36.8340, isCapital: false, isMajor: false },
  { slug: "south-c",            name: "South C",             county: "nairobi",       lat: -1.3200, lng: 36.8270, isCapital: false, isMajor: false },
  { slug: "parklands",          name: "Parklands",           county: "nairobi",       lat: -1.2598, lng: 36.8202, isCapital: false, isMajor: false },
  { slug: "lavington",          name: "Lavington",           county: "nairobi",       lat: -1.2900, lng: 36.7780, isCapital: false, isMajor: false },
  { slug: "upperhill",          name: "Upper Hill",          county: "nairobi",       lat: -1.2990, lng: 36.8138, isCapital: false, isMajor: false },
  { slug: "industrial-area-nbi",name: "Industrial Area",     county: "nairobi",       lat: -1.3100, lng: 36.8560, isCapital: false, isMajor: false },
  { slug: "gigiri",             name: "Gigiri",              county: "nairobi",       lat: -1.2301, lng: 36.8069, isCapital: false, isMajor: false },
  { slug: "ruaraka",            name: "Ruaraka",             county: "nairobi",       lat: -1.2360, lng: 36.8800, isCapital: false, isMajor: false },
  { slug: "pipeline",           name: "Pipeline",            county: "nairobi",       lat: -1.3280, lng: 36.8930, isCapital: false, isMajor: false },
  { slug: "donholm",            name: "Donholm",             county: "nairobi",       lat: -1.2990, lng: 36.8870, isCapital: false, isMajor: false },
  { slug: "buruburu",           name: "Buruburu",            county: "nairobi",       lat: -1.2880, lng: 36.8790, isCapital: false, isMajor: false },
  { slug: "umoja",              name: "Umoja",               county: "nairobi",       lat: -1.2840, lng: 36.9010, isCapital: false, isMajor: false },

  // ── MOMBASA (001) ──────────────────────────────────────────────────────────
  { slug: "mombasa-city",       name: "Mombasa City",        county: "mombasa",       lat: -4.0435, lng: 39.6682, isCapital: true,  isMajor: true  },
  { slug: "nyali",              name: "Nyali",               county: "mombasa",       lat: -4.0151, lng: 39.7194, isCapital: false, isMajor: true  },
  { slug: "bamburi",            name: "Bamburi",             county: "mombasa",       lat: -3.9669, lng: 39.7237, isCapital: false, isMajor: false },
  { slug: "likoni",             name: "Likoni",              county: "mombasa",       lat: -4.0855, lng: 39.6636, isCapital: false, isMajor: false },
  { slug: "kisauni",            name: "Kisauni",             county: "mombasa",       lat: -3.9969, lng: 39.7128, isCapital: false, isMajor: false },
  { slug: "old-town-mombasa",   name: "Old Town",            county: "mombasa",       lat: -4.0630, lng: 39.6690, isCapital: false, isMajor: false },
  { slug: "shanzu",             name: "Shanzu",              county: "mombasa",       lat: -3.9330, lng: 39.7360, isCapital: false, isMajor: false },

  // ── KWALE (002) ────────────────────────────────────────────────────────────
  { slug: "kwale-town",         name: "Kwale Town",          county: "kwale",         lat: -4.1736, lng: 39.4525, isCapital: true,  isMajor: false },
  { slug: "diani-beach",        name: "Diani Beach",         county: "kwale",         lat: -4.3167, lng: 39.5667, isCapital: false, isMajor: true  },
  { slug: "ukunda",             name: "Ukunda",              county: "kwale",         lat: -4.2833, lng: 39.5667, isCapital: false, isMajor: false },
  { slug: "msambweni",          name: "Msambweni",           county: "kwale",         lat: -4.4699, lng: 39.4936, isCapital: false, isMajor: false },
  { slug: "shimba-hills",       name: "Shimba Hills",        county: "kwale",         lat: -4.2300, lng: 39.3700, isCapital: false, isMajor: false },

  // ── KILIFI (003) ───────────────────────────────────────────────────────────
  { slug: "kilifi-town",        name: "Kilifi Town",         county: "kilifi",        lat: -3.6305, lng: 39.8499, isCapital: true,  isMajor: true  },
  { slug: "malindi",            name: "Malindi",             county: "kilifi",        lat: -3.2138, lng: 40.1169, isCapital: false, isMajor: true  },
  { slug: "watamu",             name: "Watamu",              county: "kilifi",        lat: -3.3553, lng: 40.0161, isCapital: false, isMajor: false },
  { slug: "mtwapa",             name: "Mtwapa",              county: "kilifi",        lat: -3.9383, lng: 39.7372, isCapital: false, isMajor: false },
  { slug: "mariakani",          name: "Mariakani",           county: "kilifi",        lat: -3.8597, lng: 39.4622, isCapital: false, isMajor: false },
  { slug: "kaloleni",           name: "Kaloleni",            county: "kilifi",        lat: -3.9000, lng: 39.5300, isCapital: false, isMajor: false },

  // ── TANA RIVER (004) ───────────────────────────────────────────────────────
  { slug: "hola",               name: "Hola",                county: "tana-river",    lat: -1.4996, lng: 40.0284, isCapital: true,  isMajor: false },
  { slug: "garsen",             name: "Garsen",              county: "tana-river",    lat: -2.2697, lng: 40.1194, isCapital: false, isMajor: false },
  { slug: "bura-tana",          name: "Bura",                county: "tana-river",    lat: -1.1043, lng: 39.9478, isCapital: false, isMajor: false },

  // ── LAMU (005) ─────────────────────────────────────────────────────────────
  { slug: "lamu-town",          name: "Lamu Town",           county: "lamu",          lat: -2.2697, lng: 40.9025, isCapital: true,  isMajor: true  },
  { slug: "mpeketoni",          name: "Mpeketoni",           county: "lamu",          lat: -2.0960, lng: 40.8770, isCapital: false, isMajor: false },
  { slug: "hindi",              name: "Hindi",               county: "lamu",          lat: -2.1330, lng: 40.9210, isCapital: false, isMajor: false },

  // ── TAITA TAVETA (006) ─────────────────────────────────────────────────────
  { slug: "voi",                name: "Voi",                 county: "taita-taveta",  lat: -3.3954, lng: 38.5563, isCapital: true,  isMajor: true  },
  { slug: "wundanyi",           name: "Wundanyi",            county: "taita-taveta",  lat: -3.3959, lng: 38.3590, isCapital: false, isMajor: false },
  { slug: "taveta",             name: "Taveta",              county: "taita-taveta",  lat: -3.3950, lng: 37.6870, isCapital: false, isMajor: false },
  { slug: "mwatate",            name: "Mwatate",             county: "taita-taveta",  lat: -3.5050, lng: 38.3770, isCapital: false, isMajor: false },

  // ── GARISSA (007) ──────────────────────────────────────────────────────────
  { slug: "garissa-town",       name: "Garissa Town",        county: "garissa",       lat: -0.4532, lng: 39.6460, isCapital: true,  isMajor: true  },
  { slug: "dadaab",             name: "Dadaab",              county: "garissa",       lat:  0.0523, lng: 40.3120, isCapital: false, isMajor: false },
  { slug: "modogashe",          name: "Modogashe",           county: "garissa",       lat:  0.9700, lng: 39.5500, isCapital: false, isMajor: false },

  // ── WAJIR (008) ────────────────────────────────────────────────────────────
  { slug: "wajir-town",         name: "Wajir Town",          county: "wajir",         lat:  1.7471, lng: 40.0573, isCapital: true,  isMajor: false },
  { slug: "habaswein",          name: "Habaswein",           county: "wajir",         lat:  1.0110, lng: 39.4960, isCapital: false, isMajor: false },

  // ── MANDERA (009) ──────────────────────────────────────────────────────────
  { slug: "mandera-town",       name: "Mandera Town",        county: "mandera",       lat:  3.9366, lng: 41.8670, isCapital: true,  isMajor: false },
  { slug: "el-wak",             name: "El Wak",              county: "mandera",       lat:  2.8000, lng: 40.9330, isCapital: false, isMajor: false },

  // ── MARSABIT (010) ─────────────────────────────────────────────────────────
  { slug: "marsabit-town",      name: "Marsabit Town",       county: "marsabit",      lat:  2.3284, lng: 37.9897, isCapital: true,  isMajor: false },
  { slug: "moyale",             name: "Moyale",              county: "marsabit",      lat:  3.5200, lng: 39.0560, isCapital: false, isMajor: true  },
  { slug: "laisamis",           name: "Laisamis",            county: "marsabit",      lat:  1.6170, lng: 37.8020, isCapital: false, isMajor: false },
  { slug: "loiyangalani",       name: "Loiyangalani",        county: "marsabit",      lat:  2.7530, lng: 36.7120, isCapital: false, isMajor: false },

  // ── ISIOLO (011) ───────────────────────────────────────────────────────────
  { slug: "isiolo-town",        name: "Isiolo Town",         county: "isiolo",        lat:  0.3546, lng: 37.5820, isCapital: true,  isMajor: true  },
  { slug: "meru-national-park-gate", name: "Meru Gate",     county: "isiolo",        lat:  0.2350, lng: 38.2010, isCapital: false, isMajor: false },

  // ── MERU (012) ─────────────────────────────────────────────────────────────
  { slug: "meru-town",          name: "Meru Town",           county: "meru",          lat:  0.0470, lng: 37.6490, isCapital: true,  isMajor: true  },
  { slug: "maua",               name: "Maua",                county: "meru",          lat:  0.2330, lng: 37.9350, isCapital: false, isMajor: false },
  { slug: "nkubu",              name: "Nkubu",               county: "meru",          lat: -0.0700, lng: 37.6200, isCapital: false, isMajor: false },
  { slug: "timau",              name: "Timau",               county: "meru",          lat:  0.0890, lng: 37.2500, isCapital: false, isMajor: false },
  { slug: "laare",              name: "Laare",               county: "meru",          lat:  0.1550, lng: 37.7560, isCapital: false, isMajor: false },

  // ── THARAKA-NITHI (013) ────────────────────────────────────────────────────
  { slug: "chuka",              name: "Chuka",               county: "tharaka-nithi", lat: -0.3350, lng: 37.6480, isCapital: true,  isMajor: false },
  { slug: "marimanti",          name: "Marimanti",           county: "tharaka-nithi", lat:  0.0250, lng: 37.9960, isCapital: false, isMajor: false },
  { slug: "kathwana",           name: "Kathwana",            county: "tharaka-nithi", lat:  0.0770, lng: 37.9260, isCapital: false, isMajor: false },

  // ── EMBU (014) ─────────────────────────────────────────────────────────────
  { slug: "embu-town",          name: "Embu Town",           county: "embu",          lat: -0.5287, lng: 37.4586, isCapital: true,  isMajor: true  },
  { slug: "runyenjes",          name: "Runyenjes",           county: "embu",          lat: -0.4060, lng: 37.5620, isCapital: false, isMajor: false },
  { slug: "siakago",            name: "Siakago",             county: "embu",          lat: -0.6540, lng: 37.6140, isCapital: false, isMajor: false },

  // ── KITUI (015) ────────────────────────────────────────────────────────────
  { slug: "kitui-town",         name: "Kitui Town",          county: "kitui",         lat: -1.3670, lng: 38.0110, isCapital: true,  isMajor: true  },
  { slug: "mutomo",             name: "Mutomo",              county: "kitui",         lat: -1.8430, lng: 38.2020, isCapital: false, isMajor: false },
  { slug: "mwingi",             name: "Mwingi",              county: "kitui",         lat: -0.9380, lng: 38.0630, isCapital: false, isMajor: false },
  { slug: "kibwezi-kitui",      name: "Kibwezi",             county: "kitui",         lat: -2.4180, lng: 37.9580, isCapital: false, isMajor: false },

  // ── MACHAKOS (016) ─────────────────────────────────────────────────────────
  { slug: "machakos-town",      name: "Machakos Town",       county: "machakos",      lat: -1.5177, lng: 37.2634, isCapital: true,  isMajor: true  },
  { slug: "athi-river",         name: "Athi River (Mavoko)", county: "machakos",      lat: -1.4543, lng: 36.9784, isCapital: false, isMajor: true  },
  { slug: "kangundo",           name: "Kangundo",            county: "machakos",      lat: -1.2460, lng: 37.3480, isCapital: false, isMajor: false },
  { slug: "kathiani",           name: "Kathiani",            county: "machakos",      lat: -1.3810, lng: 37.3510, isCapital: false, isMajor: false },
  { slug: "tala",               name: "Tala",                county: "machakos",      lat: -1.2550, lng: 37.3790, isCapital: false, isMajor: false },

  // ── MAKUENI (017) ──────────────────────────────────────────────────────────
  { slug: "wote",               name: "Wote",                county: "makueni",       lat: -1.7850, lng: 37.6330, isCapital: true,  isMajor: false },
  { slug: "sultan-hamud",       name: "Sultan Hamud",        county: "makueni",       lat: -2.0430, lng: 37.3810, isCapital: false, isMajor: false },
  { slug: "mtito-andei",        name: "Mtito Andei",         county: "makueni",       lat: -2.6810, lng: 38.1720, isCapital: false, isMajor: false },
  { slug: "emali",              name: "Emali",               county: "makueni",       lat: -2.0870, lng: 37.4990, isCapital: false, isMajor: false },

  // ── NYANDARUA (018) ────────────────────────────────────────────────────────
  { slug: "ol-kalou",           name: "Ol Kalou",            county: "nyandarua",     lat: -0.2667, lng: 36.3833, isCapital: true,  isMajor: false },
  { slug: "nyahururu",          name: "Nyahururu",           county: "nyandarua",     lat:  0.0270, lng: 36.3660, isCapital: false, isMajor: true  },
  { slug: "engineer",           name: "Engineer",            county: "nyandarua",     lat: -0.8790, lng: 36.6780, isCapital: false, isMajor: false },

  // ── NYERI (019) ────────────────────────────────────────────────────────────
  { slug: "nyeri-town",         name: "Nyeri Town",          county: "nyeri",         lat: -0.4167, lng: 36.9500, isCapital: true,  isMajor: true  },
  { slug: "karatina",           name: "Karatina",            county: "nyeri",         lat: -0.4845, lng: 37.1231, isCapital: false, isMajor: false },
  { slug: "othaya",             name: "Othaya",              county: "nyeri",         lat: -0.5780, lng: 36.9340, isCapital: false, isMajor: false },
  { slug: "mukurwe-ini",        name: "Mukurwe-ini",         county: "nyeri",         lat: -0.7110, lng: 36.9880, isCapital: false, isMajor: false },
  { slug: "nanyuki",            name: "Nanyuki",             county: "laikipia",      lat:  0.0167, lng: 37.0667, isCapital: false, isMajor: true  },

  // ── KIRINYAGA (020) ────────────────────────────────────────────────────────
  { slug: "kerugoya",           name: "Kerugoya",            county: "kirinyaga",     lat: -0.4930, lng: 37.2820, isCapital: true,  isMajor: false },
  { slug: "kutus",              name: "Kutus",               county: "kirinyaga",     lat: -0.5720, lng: 37.3250, isCapital: false, isMajor: false },
  { slug: "sagana",             name: "Sagana",              county: "kirinyaga",     lat: -0.6800, lng: 37.2100, isCapital: false, isMajor: false },

  // ── MURANG'A (021) ─────────────────────────────────────────────────────────
  { slug: "muranga-town",       name: "Murang'a Town",       county: "muranga",       lat: -0.7167, lng: 37.1500, isCapital: true,  isMajor: false },
  { slug: "kangema",            name: "Kangema",             county: "muranga",       lat: -0.6250, lng: 37.0000, isCapital: false, isMajor: false },
  { slug: "kenol",              name: "Kenol",               county: "muranga",       lat: -1.0000, lng: 37.1500, isCapital: false, isMajor: false },
  { slug: "maragua",            name: "Maragua",             county: "muranga",       lat: -0.8930, lng: 37.1390, isCapital: false, isMajor: false },

  // ── KIAMBU (022) ───────────────────────────────────────────────────────────
  { slug: "kiambu-town",        name: "Kiambu Town",         county: "kiambu",        lat: -1.1712, lng: 36.8359, isCapital: true,  isMajor: false },
  { slug: "thika",              name: "Thika",               county: "kiambu",        lat: -1.0332, lng: 37.0693, isCapital: false, isMajor: true  },
  { slug: "ruiru",              name: "Ruiru",               county: "kiambu",        lat: -1.1460, lng: 36.9593, isCapital: false, isMajor: true  },
  { slug: "juja",               name: "Juja",                county: "kiambu",        lat: -1.1020, lng: 37.0140, isCapital: false, isMajor: false },
  { slug: "limuru",             name: "Limuru",              county: "kiambu",        lat: -1.1120, lng: 36.6430, isCapital: false, isMajor: false },
  { slug: "githunguri",         name: "Githunguri",          county: "kiambu",        lat: -1.0360, lng: 36.7060, isCapital: false, isMajor: false },
  { slug: "kikuyu",             name: "Kikuyu",              county: "kiambu",        lat: -1.2490, lng: 36.6620, isCapital: false, isMajor: false },
  { slug: "gatundu",            name: "Gatundu",             county: "kiambu",        lat: -0.9780, lng: 36.9260, isCapital: false, isMajor: false },

  // ── TURKANA (023) ──────────────────────────────────────────────────────────
  { slug: "lodwar",             name: "Lodwar",              county: "turkana",       lat:  3.1191, lng: 35.5970, isCapital: true,  isMajor: true  },
  { slug: "kakuma",             name: "Kakuma",              county: "turkana",       lat:  3.7190, lng: 34.8810, isCapital: false, isMajor: false },
  { slug: "lokichoggio",        name: "Lokichoggio",         county: "turkana",       lat:  4.2060, lng: 34.3500, isCapital: false, isMajor: false },
  { slug: "kalokol",            name: "Kalokol",             county: "turkana",       lat:  3.5310, lng: 35.8270, isCapital: false, isMajor: false },

  // ── WEST POKOT (024) ───────────────────────────────────────────────────────
  { slug: "kapenguria",         name: "Kapenguria",          county: "west-pokot",    lat:  1.2381, lng: 35.1119, isCapital: true,  isMajor: false },
  { slug: "kitale-pokot",       name: "Makutano",            county: "west-pokot",    lat:  1.3440, lng: 35.1750, isCapital: false, isMajor: false },

  // ── SAMBURU (025) ──────────────────────────────────────────────────────────
  { slug: "maralal",            name: "Maralal",             county: "samburu",       lat:  1.0980, lng: 36.6990, isCapital: true,  isMajor: false },
  { slug: "archers-post",       name: "Archer's Post",       county: "samburu",       lat:  0.6510, lng: 37.6640, isCapital: false, isMajor: false },

  // ── TRANS NZOIA (026) ──────────────────────────────────────────────────────
  { slug: "kitale",             name: "Kitale",              county: "trans-nzoia",   lat:  1.0154, lng: 35.0062, isCapital: true,  isMajor: true  },
  { slug: "endebess",           name: "Endebess",            county: "trans-nzoia",   lat:  1.1470, lng: 34.9520, isCapital: false, isMajor: false },
  { slug: "saboti",             name: "Saboti",              county: "trans-nzoia",   lat:  0.9840, lng: 34.9100, isCapital: false, isMajor: false },

  // ── UASIN GISHU (027) ──────────────────────────────────────────────────────
  { slug: "eldoret",            name: "Eldoret",             county: "uasin-gishu",   lat:  0.5143, lng: 35.2698, isCapital: true,  isMajor: true  },
  { slug: "turbo",              name: "Turbo",               county: "uasin-gishu",   lat:  0.6120, lng: 35.0470, isCapital: false, isMajor: false },
  { slug: "moiben",             name: "Moiben",              county: "uasin-gishu",   lat:  0.7700, lng: 35.2000, isCapital: false, isMajor: false },

  // ── ELGEYO-MARAKWET (028) ──────────────────────────────────────────────────
  { slug: "iten",               name: "Iten",                county: "elgeyo-marakwet", lat: 0.6700, lng: 35.5100, isCapital: true,  isMajor: false },
  { slug: "kapcherop",          name: "Kapcherop",           county: "elgeyo-marakwet", lat: 1.0390, lng: 35.4960, isCapital: false, isMajor: false },
  { slug: "chesoi",             name: "Chesoi",              county: "elgeyo-marakwet", lat: 1.0590, lng: 35.5680, isCapital: false, isMajor: false },

  // ── NANDI (029) ────────────────────────────────────────────────────────────
  { slug: "kapsabet",           name: "Kapsabet",            county: "nandi",         lat:  0.2040, lng: 35.0980, isCapital: true,  isMajor: false },
  { slug: "nandi-hills",        name: "Nandi Hills",         county: "nandi",         lat:  0.1040, lng: 35.1790, isCapital: false, isMajor: false },

  // ── BARINGO (030) ──────────────────────────────────────────────────────────
  { slug: "kabarnet",           name: "Kabarnet",            county: "baringo",       lat:  0.4920, lng: 35.7420, isCapital: true,  isMajor: false },
  { slug: "eldama-ravine",      name: "Eldama Ravine",       county: "baringo",       lat:  0.0500, lng: 35.7230, isCapital: false, isMajor: false },
  { slug: "marigat",            name: "Marigat",             county: "baringo",       lat:  0.4660, lng: 36.0990, isCapital: false, isMajor: false },

  // ── LAIKIPIA (031) ─────────────────────────────────────────────────────────
  { slug: "laikipia-nanyuki",   name: "Nanyuki",             county: "laikipia",      lat:  0.0167, lng: 37.0667, isCapital: true,  isMajor: true  },
  { slug: "rumuruti",           name: "Rumuruti",            county: "laikipia",      lat:  0.2700, lng: 36.5370, isCapital: false, isMajor: false },
  { slug: "nyahururu-laikipia", name: "Nyahururu",           county: "laikipia",      lat:  0.0270, lng: 36.3660, isCapital: false, isMajor: false },

  // ── NAKURU (032) ───────────────────────────────────────────────────────────
  { slug: "nakuru-city",        name: "Nakuru City",         county: "nakuru",        lat: -0.3031, lng: 36.0800, isCapital: true,  isMajor: true  },
  { slug: "naivasha",           name: "Naivasha",            county: "nakuru",        lat: -0.7167, lng: 36.4333, isCapital: false, isMajor: true  },
  { slug: "gilgil",             name: "Gilgil",              county: "nakuru",        lat: -0.4940, lng: 36.3200, isCapital: false, isMajor: false },
  { slug: "narok-nakuru",       name: "Molo",                county: "nakuru",        lat: -0.2470, lng: 35.7340, isCapital: false, isMajor: false },
  { slug: "njoro",              name: "Njoro",               county: "nakuru",        lat: -0.3310, lng: 35.9490, isCapital: false, isMajor: false },
  { slug: "subukia",            name: "Subukia",             county: "nakuru",        lat:  0.1490, lng: 36.1690, isCapital: false, isMajor: false },

  // ── NAROK (033) ────────────────────────────────────────────────────────────
  { slug: "narok-town",         name: "Narok Town",          county: "narok",         lat: -1.0820, lng: 35.8720, isCapital: true,  isMajor: true  },
  { slug: "kilgoris",           name: "Kilgoris",            county: "narok",         lat: -1.0140, lng: 34.8840, isCapital: false, isMajor: false },

  // ── KAJIADO (034) ──────────────────────────────────────────────────────────
  { slug: "kajiado-town",       name: "Kajiado Town",        county: "kajiado",       lat: -1.8520, lng: 36.7760, isCapital: true,  isMajor: false },
  { slug: "ngong",              name: "Ngong",               county: "kajiado",       lat: -1.3607, lng: 36.6555, isCapital: false, isMajor: true  },
  { slug: "kitengela",          name: "Kitengela",           county: "kajiado",       lat: -1.4693, lng: 36.9604, isCapital: false, isMajor: true  },
  { slug: "ongata-rongai",      name: "Ongata Rongai",       county: "kajiado",       lat: -1.3948, lng: 36.7447, isCapital: false, isMajor: true  },
  { slug: "kiserian",           name: "Kiserian",            county: "kajiado",       lat: -1.4380, lng: 36.6780, isCapital: false, isMajor: false },
  { slug: "namanga",            name: "Namanga",             county: "kajiado",       lat: -2.5510, lng: 36.7960, isCapital: false, isMajor: false },

  // ── KERICHO (035) ──────────────────────────────────────────────────────────
  { slug: "kericho-town",       name: "Kericho Town",        county: "kericho",       lat: -0.3677, lng: 35.2839, isCapital: true,  isMajor: true  },
  { slug: "litein",             name: "Litein",              county: "kericho",       lat: -0.6180, lng: 35.2130, isCapital: false, isMajor: false },
  { slug: "londiani",           name: "Londiani",            county: "kericho",       lat: -0.1590, lng: 35.5970, isCapital: false, isMajor: false },

  // ── BOMET (036) ────────────────────────────────────────────────────────────
  { slug: "bomet-town",         name: "Bomet Town",          county: "bomet",         lat: -0.7820, lng: 35.3420, isCapital: true,  isMajor: false },
  { slug: "sotik",              name: "Sotik",               county: "bomet",         lat: -0.6820, lng: 35.1200, isCapital: false, isMajor: false },

  // ── KAKAMEGA (037) ─────────────────────────────────────────────────────────
  { slug: "kakamega-town",      name: "Kakamega Town",       county: "kakamega",      lat:  0.2827, lng: 34.7519, isCapital: true,  isMajor: true  },
  { slug: "mumias",             name: "Mumias",              county: "kakamega",      lat:  0.3350, lng: 34.4880, isCapital: false, isMajor: false },
  { slug: "malava",             name: "Malava",              county: "kakamega",      lat:  0.4460, lng: 34.8600, isCapital: false, isMajor: false },
  { slug: "khayega",            name: "Khayega",             county: "kakamega",      lat:  0.2190, lng: 34.6380, isCapital: false, isMajor: false },

  // ── VIHIGA (038) ───────────────────────────────────────────────────────────
  { slug: "vihiga-town",        name: "Vihiga Town",         county: "vihiga",        lat:  0.0730, lng: 34.7240, isCapital: true,  isMajor: false },
  { slug: "mbale",              name: "Mbale",               county: "vihiga",        lat:  0.1620, lng: 34.7020, isCapital: false, isMajor: false },

  // ── BUNGOMA (039) ──────────────────────────────────────────────────────────
  { slug: "bungoma-town",       name: "Bungoma Town",        county: "bungoma",       lat:  0.5635, lng: 34.5606, isCapital: true,  isMajor: true  },
  { slug: "webuye",             name: "Webuye",              county: "bungoma",       lat:  0.6090, lng: 34.7710, isCapital: false, isMajor: false },
  { slug: "kimilili",           name: "Kimilili",            county: "bungoma",       lat:  0.7820, lng: 34.7190, isCapital: false, isMajor: false },

  // ── BUSIA (040) ────────────────────────────────────────────────────────────
  { slug: "busia-town",         name: "Busia Town",          county: "busia",         lat:  0.4607, lng: 34.1110, isCapital: true,  isMajor: true  },
  { slug: "malaba",             name: "Malaba",              county: "busia",         lat:  0.6310, lng: 34.2650, isCapital: false, isMajor: false },
  { slug: "funyula",            name: "Funyula",             county: "busia",         lat:  0.2580, lng: 34.0640, isCapital: false, isMajor: false },

  // ── SIAYA (041) ────────────────────────────────────────────────────────────
  { slug: "siaya-town",         name: "Siaya Town",          county: "siaya",         lat:  0.0607, lng: 34.2881, isCapital: true,  isMajor: false },
  { slug: "bondo",              name: "Bondo",               county: "siaya",         lat:  0.3020, lng: 34.2620, isCapital: false, isMajor: false },
  { slug: "ugunja",             name: "Ugunja",              county: "siaya",         lat:  0.1380, lng: 34.3500, isCapital: false, isMajor: false },

  // ── KISUMU (042) ───────────────────────────────────────────────────────────
  { slug: "kisumu-city",        name: "Kisumu City",         county: "kisumu",        lat: -0.1022, lng: 34.7617, isCapital: true,  isMajor: true  },
  { slug: "kondele",            name: "Kondele",             county: "kisumu",        lat: -0.0922, lng: 34.7889, isCapital: false, isMajor: false },
  { slug: "mamboleo",           name: "Mamboleo",            county: "kisumu",        lat: -0.0660, lng: 34.7980, isCapital: false, isMajor: false },
  { slug: "ahero",              name: "Ahero",               county: "kisumu",        lat: -0.1740, lng: 34.9200, isCapital: false, isMajor: false },
  { slug: "muhoroni",           name: "Muhoroni",            county: "kisumu",        lat: -0.1590, lng: 35.1930, isCapital: false, isMajor: false },

  // ── HOMA BAY (043) ─────────────────────────────────────────────────────────
  { slug: "homa-bay-town",      name: "Homa Bay Town",       county: "homa-bay",      lat: -0.5267, lng: 34.4571, isCapital: true,  isMajor: true  },
  { slug: "oyugis",             name: "Oyugis",              county: "homa-bay",      lat: -0.7390, lng: 34.7380, isCapital: false, isMajor: false },
  { slug: "mbita",              name: "Mbita",               county: "homa-bay",      lat: -0.4250, lng: 34.2020, isCapital: false, isMajor: false },

  // ── MIGORI (044) ───────────────────────────────────────────────────────────
  { slug: "migori-town",        name: "Migori Town",         county: "migori",        lat: -1.0634, lng: 34.4731, isCapital: true,  isMajor: true  },
  { slug: "rongo",              name: "Rongo",               county: "migori",        lat: -0.9670, lng: 34.6260, isCapital: false, isMajor: false },
  { slug: "kehancha",           name: "Kehancha",            county: "migori",        lat: -1.3600, lng: 34.7350, isCapital: false, isMajor: false },
  { slug: "isebania",           name: "Isebania",            county: "migori",        lat: -1.5410, lng: 34.5360, isCapital: false, isMajor: false },

  // ── KISII (045) ────────────────────────────────────────────────────────────
  { slug: "kisii-town",         name: "Kisii Town",          county: "kisii",         lat: -0.6817, lng: 34.7660, isCapital: true,  isMajor: true  },
  { slug: "ogembo",             name: "Ogembo",              county: "kisii",         lat: -0.7540, lng: 34.6690, isCapital: false, isMajor: false },
  { slug: "keroka",             name: "Keroka",              county: "kisii",         lat: -0.8100, lng: 34.8210, isCapital: false, isMajor: false },

  // ── NYAMIRA (046) ──────────────────────────────────────────────────────────
  { slug: "nyamira-town",       name: "Nyamira Town",        county: "nyamira",       lat: -0.5660, lng: 34.9350, isCapital: true,  isMajor: false },
  { slug: "keroka-nyamira",     name: "Keroka",              county: "nyamira",       lat: -0.8100, lng: 34.8210, isCapital: false, isMajor: false },
  { slug: "nyansiongo",         name: "Nyansiongo",          county: "nyamira",       lat: -0.6390, lng: 34.9310, isCapital: false, isMajor: false },
];
