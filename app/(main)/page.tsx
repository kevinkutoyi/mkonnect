// app/(main)/page.tsx
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
