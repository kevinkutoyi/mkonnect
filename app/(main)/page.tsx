// app/(main)/page.tsx
import { Hero } from "@/components/home/Hero";
import { FeaturedMasseuses } from "@/components/home/FeaturedMasseuses";
import { HowItWorks } from "@/components/home/HowItWorks";
import { prisma } from "@/lib/prisma";

export default async function HomePage() {
  const featured = await prisma.masseuseProfile.findMany({
    where: { status: "APPROVED" },
    orderBy: { avgRating: "desc" },
    take: 6,
    include: {
      user: { select: { name: true } },
      location: true,
      services: { where: { isActive: true }, take: 3 },
      photos: { where: { isCover: true }, take: 1 },
    },
  });

  const locations = await prisma.location.findMany({ orderBy: { town: "asc" } });

  return (
    <>
      <Hero locations={locations} />
      <HowItWorks />
      <FeaturedMasseuses masseuses={featured} />
    </>
  );
}
