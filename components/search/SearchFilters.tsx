"use client";
// components/search/SearchFilters.tsx
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useEffect } from "react";
import { LocationSearch } from "@/components/location/LocationSearch";
import { NearbyFilter } from "@/components/location/NearbyFilter";

export function SearchFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Track the active city for NearbyFilter
  const [activeCityId,   setActiveCityId]   = useState<number | undefined>();
  const [activeCityName, setActiveCityName] = useState<string | undefined>();

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
    <div className="space-y-4">
      {/* Location search */}
      <div className="rounded-xl border bg-card p-4 space-y-3">
        <h3 className="font-semibold text-sm">Location</h3>

        <LocationSearch
          placeholder="Search town or city…"
          defaultValue={searchParams.get("city") ?? ""}
          onSelect={(city) => {
            const params = new URLSearchParams(searchParams.toString());
            params.set("county", city.county.slug);
            params.set("city",   city.slug);
            params.delete("page");
            router.push(`/search?${params.toString()}`);
            setActiveCityId(city.id);
            setActiveCityName(`${city.name}, ${city.county.name}`);
          }}
        />

        {/* Active location badge */}
        {searchParams.get("county") && (
          <div className="flex items-center justify-between rounded-lg bg-primary/10 px-3 py-2 text-sm">
            <span className="font-medium text-primary capitalize">
              {(searchParams.get("city") ?? searchParams.get("county") ?? "").replace(/-/g, " ")}
            </span>
            <button
              onClick={() => {
                const params = new URLSearchParams(searchParams.toString());
                params.delete("county"); params.delete("city"); params.delete("radius");
                router.push(`/search?${params.toString()}`);
                setActiveCityId(undefined);
              }}
              className="text-xs text-muted-foreground hover:text-destructive"
            >
              Clear ×
            </button>
          </div>
        )}
      </div>

      {/* Nearby filter */}
      <NearbyFilter
        currentCityId={activeCityId}
        currentCityName={activeCityName}
      />

      {/* Rating */}
      <div className="rounded-xl border bg-card p-4 space-y-2">
        <h3 className="font-semibold text-sm">Minimum Rating</h3>
        <select
          value={searchParams.get("minRating") ?? ""}
          onChange={(e) => updateFilter("minRating", e.target.value)}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Any rating</option>
          <option value="4">4+ stars</option>
          <option value="4.5">4.5+ stars</option>
          <option value="5">5 stars only</option>
        </select>
      </div>

      {/* Price range */}
      <div className="rounded-xl border bg-card p-4 space-y-2">
        <h3 className="font-semibold text-sm">Price Range (KES)</h3>
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
      <div className="rounded-xl border bg-card p-4 space-y-2">
        <h3 className="font-semibold text-sm">Sort By</h3>
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
        Clear All Filters
      </button>
    </div>
  );
}
