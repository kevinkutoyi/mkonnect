"use client";
// components/search/ActiveFilters.tsx
import { useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";

const LABELS: Record<string, (v: string) => string> = {
  location:    (v) => `City: ${v.replace(/-/g, " ")}`,
  county:      (v) => `County: ${v.replace(/-/g, " ")}`,
  category:    (v) => `Category: ${v.replace(/-/g, " ")}`,
  service:     (v) => `Service: ${v}`,
  minPrice:    (v) => `Min: KES ${Number(v).toLocaleString()}`,
  maxPrice:    (v) => `Max: KES ${Number(v).toLocaleString()}`,
  homeService: ()  => "Home service",
  day:         (v) => `Available: ${v.charAt(0).toUpperCase() + v.slice(1)}`,
  minRating:   (v) => `${v}+ stars`,
};

const HIDDEN = new Set(["page", "sort"]);

export function ActiveFilters({ total }: { total: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const active = Array.from(searchParams.entries()).filter(([k]) => !HIDDEN.has(k) && LABELS[k]);
  if (active.length === 0) return null;

  const remove = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(key);
    params.delete("page");
    router.push(`/search?${params.toString()}`);
  };

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <span className="text-xs text-muted-foreground">{total} results for:</span>
      {active.map(([key, val]) => (
        <span
          key={key}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
        >
          {LABELS[key]?.(val) ?? val}
          <button
            type="button"
            onClick={() => remove(key)}
            className="hover:text-primary/70"
            aria-label={`Remove ${key} filter`}
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <button
        onClick={() => {
          const params = new URLSearchParams();
          const sort = searchParams.get("sort");
          if (sort) params.set("sort", sort);
          router.push(`/search?${params.toString()}`);
        }}
        className="text-xs text-muted-foreground hover:text-foreground underline"
      >
        Clear all
      </button>
    </div>
  );
}
