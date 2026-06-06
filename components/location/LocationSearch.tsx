"use client";
// components/location/LocationSearch.tsx
// Searchable location input — type to find any town in Kenya

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, MapPin, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface CityResult {
  id: number; name: string; slug: string;
  county: { name: string; slug: string };
}

interface LocationSearchProps {
  placeholder?: string;
  className?: string;
  onSelect?: (city: CityResult) => void;
  defaultValue?: string;
}

export function LocationSearch({
  placeholder = "Search city or town…",
  className,
  onSelect,
  defaultValue = "",
}: LocationSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery]         = useState(defaultValue);
  const [results, setResults]     = useState<CityResult[]>([]);
  const [loading, setLoading]     = useState(false);
  const [open, setOpen]           = useState(false);
  const inputRef                  = useRef<HTMLInputElement>(null);
  const containerRef              = useRef<HTMLDivElement>(null);
  const debounceRef               = useRef<NodeJS.Timeout>();

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); setOpen(false); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/locations/cities?q=${encodeURIComponent(q)}`);
      const data: CityResult[] = await res.json();
      setResults(data.slice(0, 8));
      setOpen(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 250);
  };

  const handleSelect = (city: CityResult) => {
    setQuery(`${city.name}, ${city.county.name}`);
    setOpen(false);
    if (onSelect) {
      onSelect(city);
    } else {
      // Default: update search URL
      const params = new URLSearchParams(searchParams.toString());
      params.set("county", city.county.slug);
      params.set("city", city.slug);
      params.delete("page");
      router.push(`/search?${params.toString()}`);
    }
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setOpen(false);
    inputRef.current?.focus();
    if (!onSelect) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("county");
      params.delete("city");
      router.push(`/search?${params.toString()}`);
    }
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={placeholder}
          className="w-full rounded-lg border bg-background py-2.5 pl-9 pr-9 text-sm outline-none transition-colors focus:ring-2 focus:ring-primary"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {loading
            ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            : query
            ? <button type="button" onClick={handleClear}><X className="h-4 w-4 text-muted-foreground hover:text-foreground" /></button>
            : null}
        </div>
      </div>

      {/* Dropdown */}
      {open && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border bg-card shadow-lg">
          {results.map((city) => (
            <button
              key={city.id}
              type="button"
              onClick={() => handleSelect(city)}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors text-left"
            >
              <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <div>
                <span className="font-medium">{city.name}</span>
                <span className="ml-1.5 text-xs text-muted-foreground">{city.county.name} County</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {open && query.length >= 2 && results.length === 0 && !loading && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border bg-card px-4 py-3 text-sm text-muted-foreground shadow-lg">
          No towns found for "{query}"
        </div>
      )}
    </div>
  );
}
