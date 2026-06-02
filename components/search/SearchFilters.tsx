"use client";
// components/search/SearchFilters.tsx
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import type { Location } from "@prisma/client";

interface Props {
  locations: Location[];
}

export function SearchFilters({ locations }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      params.delete("page");
      router.push(`/search?${params.toString()}`);
    },
    [router, searchParams]
  );

  return (
    <div className="space-y-6 rounded-xl border bg-card p-4">
      <h2 className="font-semibold">Filters</h2>

      {/* Location */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Location
        </label>
        <select
          value={searchParams.get("location") ?? ""}
          onChange={(e) => updateFilter("location", e.target.value)}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">All locations</option>
          {locations.map((loc) => (
            <option key={loc.id} value={loc.slug}>
              {loc.town}
            </option>
          ))}
        </select>
      </div>

      {/* Min Rating */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Minimum Rating
        </label>
        <select
          value={searchParams.get("minRating") ?? ""}
          onChange={(e) => updateFilter("minRating", e.target.value)}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Any rating</option>
          <option value="4">4+ stars</option>
          <option value="4.5">4.5+ stars</option>
          <option value="5">5 stars</option>
        </select>
      </div>

      {/* Price range */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Price Range (KES)
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min"
            defaultValue={searchParams.get("minPrice") ?? ""}
            onBlur={(e) => updateFilter("minPrice", e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
          <input
            type="number"
            placeholder="Max"
            defaultValue={searchParams.get("maxPrice") ?? ""}
            onBlur={(e) => updateFilter("maxPrice", e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Sort */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Sort By
        </label>
        <select
          value={searchParams.get("sort") ?? "rating"}
          onChange={(e) => updateFilter("sort", e.target.value)}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="rating">Top Rated</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="newest">Newest</option>
        </select>
      </div>

      <button
        onClick={() => router.push("/search")}
        className="w-full rounded-lg border px-3 py-2 text-sm font-medium hover:bg-muted transition-colors"
      >
        Clear Filters
      </button>
    </div>
  );
}
