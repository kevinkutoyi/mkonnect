// app/(main)/search/page.tsx
import { Suspense } from "react";
import { SearchFilters } from "@/components/search/SearchFilters";
import { SearchResults } from "@/components/search/SearchResults";
import { prisma } from "@/lib/prisma";
import { tierOrderBy } from "@/lib/tier-sort";
import { PUBLIC_PROFILE_FILTER } from "@/lib/profile-activation";
import type { Metadata } from "next";

interface SearchPageProps {
  searchParams: {
    location?: string;
    service?: string;
    minPrice?: string;
    maxPrice?: string;
    minRating?: string;
    sort?: string;
    page?: string;
  };
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const location = searchParams.location;
  return {
    title: location ? `Masseuses in ${location}` : "Browse Masseuses",
    description: `Find professional massage services${location ? ` in ${location}` : ""} across Kenya.`,
  };
}

async function getMasseuses(searchParams: SearchPageProps["searchParams"]) {
  const page = Number(searchParams.page ?? 1);
  const pageSize = 12;

  // Both admin-approved AND payment confirmed are required for public listing
  const where: any = { ...PUBLIC_PROFILE_FILTER };

  if (searchParams.location) {
    where.city = { slug: searchParams.location };
  }
  if (searchParams.minRating) {
    where.avgRating = { gte: Number(searchParams.minRating) };
  }
  if (searchParams.service || searchParams.minPrice || searchParams.maxPrice) {
    where.services = {
      some: {
        isActive: true,
        ...(searchParams.service && {
          name: { contains: searchParams.service, mode: "insensitive" },
        }),
        ...(searchParams.minPrice || searchParams.maxPrice
          ? {
              price: {
                ...(searchParams.minPrice && { gte: Number(searchParams.minPrice) }),
                ...(searchParams.maxPrice && { lte: Number(searchParams.maxPrice) }),
              },
            }
          : {}),
      },
    };
  }

  // Tier-boosted sort: VVIP → PREMIUM → VIP → REGULAR, then by chosen sort
  const baseOrderBy: any =
    searchParams.sort === "newest"
      ? { createdAt: "desc" }
      : searchParams.sort === "price_asc"
      ? { services: { _min: { price: "asc" } } }
      : { avgRating: "desc" };
  const orderBy = tierOrderBy(baseOrderBy);

  const [masseuses, total] = await Promise.all([
    prisma.masseuseProfile.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        user:     { select: { name: true } },
        city:     true,
        services: { where: { isActive: true }, orderBy: { price: "asc" }, take: 3 },
        photos:   { where: { isCover: true }, take: 1 },
      },
      // activeTierName is a scalar field, returned automatically
    }),
    prisma.masseuseProfile.count({ where }),
  ]);

  return { masseuses, total, page, pageSize };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { masseuses, total, page, pageSize } = await getMasseuses(searchParams);

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <h1 className="text-2xl font-bold mb-6">
        {searchParams.location
          ? `Masseuses in ${searchParams.location}`
          : "Browse Masseuses"}
        {total > 0 && (
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            ({total} found)
          </span>
        )}
      </h1>
      <div className="flex gap-6 items-start">
        <aside className="w-64 shrink-0">
          <SearchFilters />
        </aside>
        <div className="flex-1 min-w-0">
          <Suspense fallback={<div>Loading results…</div>}>
            <SearchResults
              masseuses={masseuses}
              total={total}
              page={page}
              pageSize={pageSize}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
