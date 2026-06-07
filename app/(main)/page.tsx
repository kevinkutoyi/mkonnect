// app/(main)/page.tsx
import { Hero } from "@/components/home/Hero";
import { FeaturedMasseuses } from "@/components/home/FeaturedMasseuses";
import { HowItWorks } from "@/components/home/HowItWorks";
import { prisma } from "@/lib/prisma";
import { tierOrderBy } from "@/lib/tier-sort";
import { PUBLIC_PROFILE_FILTER } from "@/lib/profile-activation";

export default async function HomePage() {
  // Only APPROVED + payment-confirmed profiles appear on homepage
  const featured = await prisma.masseuseProfile.findMany({
    where: { ...PUBLIC_PROFILE_FILTER },
    orderBy: tierOrderBy({ avgRating: "desc" }),
    take: 6,
    include: {
      user:     { select: { name: true } },
      city:     true,
      services: { where: { isActive: true }, take: 3 },
      photos:   { where: { isCover: true }, take: 1 },
    },
  });

  const locations = await prisma.city.findMany({
    select: { id: true, slug: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <>
      <Hero locations={locations} />
      <HowItWorks />
      <FeaturedMasseuses masseuses={featured} />
    </>
  );
}
