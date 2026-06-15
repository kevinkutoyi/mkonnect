// app/(main)/search/page.tsx
import { Suspense }        from "react";
import { SearchFilters }   from "@/components/search/SearchFilters";
import { ActiveFilters }   from "@/components/search/ActiveFilters";
import { SearchResults }   from "@/components/search/SearchResults";
import { MobileFilters }   from "@/components/search/MobileFilters";
import { SortSelect }      from "@/components/search/SortSelect";
import { prisma }          from "@/lib/prisma";
import { tierOrderBy }     from "@/lib/tier-sort";
import { PUBLIC_PROFILE_FILTER } from "@/lib/profile-activation";
import type { Metadata }   from "next";

const BASE_URL = process.env.NEXTAUTH_URL ?? "https://mconnect.co.ke";

interface SearchPageProps {
  searchParams: {
    location?:    string;  // city slug
    county?:      string;  // county slug
    category?:    string;  // category slug
    service?:     string;  // free-text service search
    minPrice?:    string;
    maxPrice?:    string;
    homeService?: string;  // "true"
    day?:         string;  // mon|tue|wed|thu|fri|sat|sun
    minRating?:   string;
    sort?:        string;
    page?:        string;
  };
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const sp = searchParams;

  // Resolve human-readable city/county name from slug for better meta
  let locationName: string | null = null;
  if (sp.location) {
    const city = await prisma.city.findFirst({
      where:  { slug: sp.location },
      select: { name: true, county: { select: { name: true } } },
    });
    locationName = city ? `${city.name}, ${city.county?.name ?? "Kenya"}` : sp.location.replace(/-/g, " ");
  } else if (sp.county) {
    const county = await prisma.county.findFirst({
      where:  { slug: sp.county },
      select: { name: true },
    });
    locationName = county?.name ?? sp.county.replace(/-/g, " ");
  }

  let categoryName: string | null = null;
  if (sp.category) {
    const cat = await prisma.category.findFirst({
      where:  { slug: sp.category },
      select: { name: true },
    });
    categoryName = cat?.name ?? sp.category.replace(/-/g, " ");
  }

  const titleParts: string[] = [];
  if (categoryName) titleParts.push(categoryName);
  titleParts.push("Masseuses");
  if (locationName) titleParts.push(`in ${locationName}`);

  const title       = titleParts.join(" ");
  const description = [
    "Find professional",
    categoryName ?? "massage",
    "services",
    locationName ? `in ${locationName}` : "across Kenya",
    "— verified masseuses, instant booking.",
  ].join(" ");

  // Build canonical URL from searchParams
  const params = new URLSearchParams();
  if (sp.location)    params.set("location",    sp.location);
  if (sp.county)      params.set("county",      sp.county);
  if (sp.category)    params.set("category",    sp.category);
  const canonical = `${BASE_URL}/search${params.size ? `?${params}` : ""}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
    },
  };
}

const DAY_MAP: Record<string, string> = {
  mon: "availableMon", tue: "availableTue", wed: "availableWed",
  thu: "availableThu", fri: "availableFri", sat: "availableSat", sun: "availableSun",
};

async function getResults(sp: SearchPageProps["searchParams"]) {
  const page     = Math.max(1, Number(sp.page ?? 1));
  const pageSize = 12;

  const where: any = { ...PUBLIC_PROFILE_FILTER };

  if (sp.location) {
    where.city = { slug: sp.location };
  } else if (sp.county) {
    where.city = { county: { slug: sp.county } };
  }

  if (sp.category) {
    where.categories = { some: { category: { slug: sp.category } } };
  }

  if (sp.service) {
    where.services = {
      some: { isActive: true, name: { contains: sp.service, mode: "insensitive" } },
    };
  }

  if (sp.minPrice) where.maxPrice = { gte: Number(sp.minPrice) };
  if (sp.maxPrice) where.minPrice = { lte: Number(sp.maxPrice) };
  if (sp.homeService === "true") where.mobileService = true;
  if (sp.day && DAY_MAP[sp.day]) where[DAY_MAP[sp.day]] = true;
  if (sp.minRating) where.avgRating = { gte: Number(sp.minRating) };

  const baseOrderBy: any =
    sp.sort === "newest"     ? { createdAt: "desc" }  :
    sp.sort === "price_asc"  ? { minPrice:  "asc"  }  :
    sp.sort === "price_desc" ? { minPrice:  "desc" }  :
                               { avgRating: "desc" };
  const orderBy = tierOrderBy(baseOrderBy);

  const [masseuses, total] = await Promise.all([
    prisma.masseuseProfile.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        user:       { select: { name: true } },
        city:       { include: { county: true } },
        services:   { where: { isActive: true }, orderBy: { price: "asc" }, take: 3 },
        photos:     { where: { isCover: true }, take: 1 },
        categories: { include: { category: true }, take: 3 },
      },
    }),
    prisma.masseuseProfile.count({ where }),
  ]);

  return { masseuses, total, page, pageSize };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const [{ masseuses, total, page, pageSize }, counties, categories] = await Promise.all([
    getResults(searchParams),
    prisma.county.findMany({ select: { name: true, slug: true }, orderBy: { name: "asc" } }),
    prisma.category.findMany({
      where:   { isActive: true },
      select:  { name: true, slug: true },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  const filterProps = { counties, categories };
  const locationLabel =
    (searchParams.location ?? searchParams.county ?? "").replace(/-/g, " ");

  // ItemList structured data — helps Google show individual results in search
  const itemListSchema = masseuses.length > 0 ? {
    "@context":      "https://schema.org",
    "@type":         "ItemList",
    name:            locationLabel ? `Masseuses in ${locationLabel}` : "Browse Masseuses",
    numberOfItems:   total,
    itemListElement: masseuses.map((m: any, i) => ({
      "@type":    "ListItem",
      position:   (page - 1) * pageSize + i + 1,
      url:        `${BASE_URL}/masseuse/${m.slug}`,
      name:       m.user.name,
    })),
  } : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
      {itemListSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
        />
      )}

      {/* Mobile: filter button row */}
      <div className="mb-4 flex items-center justify-between md:hidden">
        <div>
          <h1 className="text-lg font-bold">
            {locationLabel ? `Masseuses in ${locationLabel}` : "Browse Masseuses"}
          </h1>
          <p className="text-xs text-muted-foreground">{total} found</p>
        </div>
        <MobileFilters {...filterProps} />
      </div>

      <ActiveFilters total={total} />

      <div className="flex gap-6 items-start">
        <aside className="hidden md:block w-72 shrink-0 sticky top-20">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Filters</h2>
          </div>
          <SearchFilters {...filterProps} />
        </aside>

        <div className="flex-1 min-w-0">
          <div className="mb-5 hidden items-center justify-between md:flex">
            <h1 className="text-xl font-bold">
              {locationLabel ? `Masseuses in ${locationLabel}` : "Browse Masseuses"}
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({total} found)
              </span>
            </h1>
            <SortSelect />
          </div>

          <Suspense fallback={<ResultsSkeleton />}>
            <SearchResults masseuses={masseuses} total={total} page={page} pageSize={pageSize} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

function ResultsSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-72 rounded-2xl bg-muted animate-pulse" />
      ))}
    </div>
  );
}
