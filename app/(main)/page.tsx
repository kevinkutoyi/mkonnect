// app/(main)/page.tsx
import type { Metadata }     from "next";
import { Hero }              from "@/components/home/Hero";
import { FeaturedMasseuses } from "@/components/home/FeaturedMasseuses";
import { Categories }        from "@/components/home/Categories";
import { Cities }            from "@/components/home/Cities";
import { HowItWorks }        from "@/components/home/HowItWorks";
import { SafetyNotice }      from "@/components/home/SafetyNotice";
import { RegisterCTA }       from "@/components/home/RegisterCTA";
import { prisma }            from "@/lib/prisma";
import { tierOrderBy }       from "@/lib/tier-sort";
import { PUBLIC_PROFILE_FILTER } from "@/lib/profile-activation";

const BASE_URL = process.env.NEXTAUTH_URL ?? "https://modelsraha.co.ke";

export const metadata: Metadata = {
  alternates: { canonical: BASE_URL },
};

// WebSite schema — enables Google Sitelinks Search Box
const websiteSchema = {
  "@context":        "https://schema.org",
  "@type":           "WebSite",
  name:              "modelsraha",
  url:               BASE_URL,
  potentialAction: {
    "@type":        "SearchAction",
    target:         { "@type": "EntryPoint", urlTemplate: `${BASE_URL}/search?q={search_term_string}` },
    "query-input":  "required name=search_term_string",
  },
};

export default async function HomePage() {
  const [featured, locations, categories, cities] = await Promise.all([
    // Featured masseuses — tier-boosted
    prisma.masseuseProfile.findMany({
      where:   { ...PUBLIC_PROFILE_FILTER },
      orderBy: tierOrderBy({ avgRating: "desc" }),
      take:    6,
      include: {
        user:       { select: { name: true } },
        city:       { include: { county: true } },
        services:   { where: { isActive: true }, take: 3 },
        photos:     { where: { isCover: true },  take: 1 },
        categories: { include: { category: true }, take: 3 },
      },
    }),
    // For hero search dropdown
    prisma.city.findMany({
      where:   { isMajor: true },
      select:  { id: true, slug: true, name: true },
      orderBy: { name: "asc" },
      take:    30,
    }),
    // Categories with masseuse counts
    prisma.category.findMany({
      where:   { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { profiles: true } } },
      take:    8,
    }),
    // Major cities with masseuse counts
    prisma.city.findMany({
      where:   { isMajor: true },
      include: {
        county: { select: { name: true } },
        _count: { select: { profiles: { where: { ...PUBLIC_PROFILE_FILTER } } } },
      },
      orderBy: { profiles: { _count: "desc" } },
      take:    8,
    }),
  ]);

  return (
    <>
      {/* WebSite structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <Hero locations={locations} />
      <FeaturedMasseuses masseuses={featured} />
      <Categories categories={categories} />
      <Cities cities={cities} />
      <HowItWorks />
      <SafetyNotice />
      <RegisterCTA />
    </>
  );
}
