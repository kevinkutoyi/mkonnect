"use client";
// components/search/SearchFilters.tsx
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { LocationSearch } from "@/components/location/LocationSearch";
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react";

interface FilterProps {
  counties:   { name: string; slug: string }[];
  categories: { name: string; slug: string }[];
}

const DAYS = [
  { key: "mon", label: "Mon" }, { key: "tue", label: "Tue" },
  { key: "wed", label: "Wed" }, { key: "thu", label: "Thu" },
  { key: "fri", label: "Fri" }, { key: "sat", label: "Sat" },
  { key: "sun", label: "Sun" },
];

const PRICE_PRESETS = [
  { label: "Under KES 2,000", min: "",     max: "2000" },
  { label: "KES 2–5k",        min: "2000", max: "5000" },
  { label: "KES 5–10k",       min: "5000", max: "10000" },
  { label: "KES 10k+",        min: "10000", max: ""   },
];

function Section({ title, children, defaultOpen = true }: {
  title: string; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b last:border-0 py-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-sm font-semibold"
      >
        {title}
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  );
}

export function SearchFilters({ counties, categories }: FilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const set = useCallback((key: string, value: string) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value); else params.delete(key);
      params.delete("page");
      router.push(`/search?${params.toString()}`);
    });
  }, [router, searchParams]);

  const toggle = useCallback((key: string) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (params.get(key)) params.delete(key); else params.set(key, "true");
      params.delete("page");
      router.push(`/search?${params.toString()}`);
    });
  }, [router, searchParams]);

  const clearAll = () => {
    startTransition(() => router.push("/search"));
  };

  const hasFilters = Array.from(searchParams.keys()).some((k) => k !== "page" && k !== "sort");

  return (
    <div className="rounded-2xl border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <span className="text-sm font-semibold">Filters</span>
        <div className="flex items-center gap-2">
          {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
          {hasFilters && (
            <button onClick={clearAll} className="text-xs text-primary hover:underline">
              Clear all
            </button>
          )}
        </div>
      </div>

      <div className="px-4">
        {/* Location */}
        <Section title="Location">
          <div className="space-y-2">
            <LocationSearch
              placeholder="Search city or town…"
              defaultValue={
                searchParams.get("location")
                  ? searchParams.get("location")!.replace(/-/g, " ")
                  : ""
              }
            />
            <select
              value={searchParams.get("county") ?? ""}
              onChange={(e) => {
                const params = new URLSearchParams(searchParams.toString());
                if (e.target.value) params.set("county", e.target.value);
                else params.delete("county");
                params.delete("location");
                params.delete("page");
                startTransition(() => router.push(`/search?${params.toString()}`));
              }}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Counties</option>
              {counties.map((c) => (
                <option key={c.slug} value={c.slug}>{c.name}</option>
              ))}
            </select>
          </div>
        </Section>

        {/* Category */}
        <Section title="Category">
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => {
              const active = searchParams.get("category") === cat.slug;
              return (
                <button
                  key={cat.slug}
                  type="button"
                  onClick={() => set("category", active ? "" : cat.slug)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors border ${
                    active
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background hover:border-primary hover:text-primary"
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>
        </Section>

        {/* Service type */}
        <Section title="Service Type" defaultOpen={false}>
          <input
            type="text"
            placeholder="e.g. Swedish, Deep Tissue…"
            defaultValue={searchParams.get("service") ?? ""}
            onKeyDown={(e) => {
              if (e.key === "Enter") set("service", (e.target as HTMLInputElement).value);
            }}
            onBlur={(e) => set("service", e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
          <p className="mt-1 text-xs text-muted-foreground">Press Enter to apply</p>
        </Section>

        {/* Price range */}
        <Section title="Price Range (KES)" defaultOpen={false}>
          {/* Presets */}
          <div className="mb-3 flex flex-col gap-1">
            {PRICE_PRESETS.map(({ label, min, max }) => {
              const active =
                (searchParams.get("minPrice") ?? "") === min &&
                (searchParams.get("maxPrice") ?? "") === max;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    const params = new URLSearchParams(searchParams.toString());
                    if (active) {
                      params.delete("minPrice"); params.delete("maxPrice");
                    } else {
                      if (min) params.set("minPrice", min); else params.delete("minPrice");
                      if (max) params.set("maxPrice", max); else params.delete("maxPrice");
                    }
                    params.delete("page");
                    startTransition(() => router.push(`/search?${params.toString()}`));
                  }}
                  className={`rounded-lg px-3 py-2 text-left text-xs font-medium transition-colors border ${
                    active ? "bg-primary/10 border-primary text-primary" : "hover:bg-muted border-transparent"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
          {/* Custom */}
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Min"
              defaultValue={searchParams.get("minPrice") ?? ""}
              onBlur={(e) => set("minPrice", e.target.value)}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              type="number"
              placeholder="Max"
              defaultValue={searchParams.get("maxPrice") ?? ""}
              onBlur={(e) => set("maxPrice", e.target.value)}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </Section>

        {/* Availability */}
        <Section title="Available On" defaultOpen={false}>
          <div className="flex flex-wrap gap-2">
            {DAYS.map(({ key, label }) => {
              const active = searchParams.get("day") === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => set("day", active ? "" : key)}
                  className={`h-9 w-10 rounded-lg text-xs font-semibold transition-colors border ${
                    active
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background hover:border-primary hover:text-primary"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </Section>

        {/* Home service */}
        <Section title="Service Type" defaultOpen={false}>
          <label className="flex cursor-pointer items-center justify-between rounded-xl border bg-background p-3 transition-colors hover:bg-muted">
            <div>
              <p className="text-sm font-medium">Home Service</p>
              <p className="text-xs text-muted-foreground">Masseuse comes to you</p>
            </div>
            <div
              onClick={() => toggle("homeService")}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                searchParams.get("homeService") === "true" ? "bg-primary" : "bg-muted-foreground/30"
              }`}
            >
              <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                searchParams.get("homeService") === "true" ? "translate-x-5" : "translate-x-0.5"
              }`} />
            </div>
          </label>
        </Section>

        {/* Rating */}
        <Section title="Minimum Rating" defaultOpen={false}>
          {[["", "Any"], ["4", "4+ ★"], ["4.5", "4.5+ ★"], ["5", "5 ★ only"]].map(([val, label]) => {
            const active = (searchParams.get("minRating") ?? "") === val;
            return (
              <button
                key={label}
                type="button"
                onClick={() => set("minRating", active && val ? "" : val)}
                className={`mb-1 flex w-full items-center rounded-lg px-3 py-2 text-sm transition-colors ${
                  active ? "bg-primary/10 font-semibold text-primary" : "hover:bg-muted"
                }`}
              >
                {label}
              </button>
            );
          })}
        </Section>
      </div>
    </div>
  );
}
