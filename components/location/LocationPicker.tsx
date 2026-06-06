"use client";
// components/location/LocationPicker.tsx
// Cascading County → Town/City selector

import { useEffect, useState, useCallback } from "react";
import { MapPin, ChevronDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface County { id: number; name: string; slug: string; region: string }
interface City   { id: number; name: string; slug: string; isCapital: boolean; isMajor: boolean }

interface LocationPickerProps {
  countyId?: number;
  cityId?: number;
  onCountyChange: (countyId: number, countySlug: string) => void;
  onCityChange:   (cityId:   number, citySlug:   string) => void;
  countyError?: string;
  cityError?: string;
  disabled?: boolean;
  className?: string;
}

// Region display order
const REGION_ORDER = ["Nairobi", "Central", "Coast", "Eastern", "Nyanza", "Rift Valley", "Western", "North Eastern"];

export function LocationPicker({
  countyId, cityId,
  onCountyChange, onCityChange,
  countyError, cityError,
  disabled, className,
}: LocationPickerProps) {
  const [counties, setCounties]         = useState<County[]>([]);
  const [grouped,  setGrouped]          = useState<Record<string, County[]>>({});
  const [cities,   setCities]           = useState<City[]>([]);
  const [loadingCounties, setLoadingCounties] = useState(true);
  const [loadingCities,   setLoadingCities]   = useState(false);

  // Load counties once
  useEffect(() => {
    fetch("/api/locations/counties")
      .then((r) => r.json())
      .then((d) => { setCounties(d.counties); setGrouped(d.grouped); })
      .finally(() => setLoadingCounties(false));
  }, []);

  // Load cities when county changes
  const loadCities = useCallback(async (id: number) => {
    if (!id) { setCities([]); return; }
    setLoadingCities(true);
    try {
      const res = await fetch(`/api/locations/cities?countyId=${id}`);
      const data: City[] = await res.json();
      setCities(data);
    } finally {
      setLoadingCities(false);
    }
  }, []);

  useEffect(() => { if (countyId) loadCities(countyId); }, [countyId, loadCities]);

  const handleCountyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = Number(e.target.value);
    const slug = counties.find((c) => c.id === id)?.slug ?? "";
    onCountyChange(id, slug);
    setCities([]);
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = Number(e.target.value);
    const slug = cities.find((c) => c.id === id)?.slug ?? "";
    onCityChange(id, slug);
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* County */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium">
          County <span className="text-destructive">*</span>
        </label>
        <div className="relative">
          <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          {loadingCounties ? (
            <div className="flex h-10 items-center gap-2 rounded-lg border bg-muted px-3 pl-9 text-sm text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading counties…
            </div>
          ) : (
            <select
              value={countyId ?? ""}
              onChange={handleCountyChange}
              disabled={disabled}
              className={cn(
                "w-full appearance-none rounded-lg border bg-background px-3 py-2.5 pl-9 pr-8 text-sm outline-none transition-colors focus:ring-2 focus:ring-primary",
                countyError ? "border-destructive" : "border-input",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              <option value="">— Select county —</option>
              {REGION_ORDER.map((region) =>
                grouped[region] ? (
                  <optgroup key={region} label={region}>
                    {grouped[region].map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </optgroup>
                ) : null
              )}
            </select>
          )}
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        </div>
        {countyError && <p className="text-xs text-destructive">{countyError}</p>}
      </div>

      {/* Town / City */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium">
          Town / City <span className="text-destructive">*</span>
        </label>
        <div className="relative">
          {loadingCities ? (
            <div className="flex h-10 items-center gap-2 rounded-lg border bg-muted px-3 text-sm text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading towns…
            </div>
          ) : (
            <select
              value={cityId ?? ""}
              onChange={handleCityChange}
              disabled={disabled || !countyId || cities.length === 0}
              className={cn(
                "w-full appearance-none rounded-lg border bg-background px-3 py-2.5 pr-8 text-sm outline-none transition-colors focus:ring-2 focus:ring-primary",
                cityError ? "border-destructive" : "border-input",
                (!countyId || cities.length === 0) && "opacity-50 cursor-not-allowed"
              )}
            >
              <option value="">
                {!countyId ? "Select a county first" : cities.length === 0 ? "No towns found" : "— Select town/city —"}
              </option>
              {/* Major cities first */}
              {cities.filter((c) => c.isMajor || c.isCapital).length > 0 && (
                <optgroup label="Major towns">
                  {cities.filter((c) => c.isMajor || c.isCapital).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}{c.isCapital ? " (County Capital)" : ""}
                    </option>
                  ))}
                </optgroup>
              )}
              {cities.filter((c) => !c.isMajor && !c.isCapital).length > 0 && (
                <optgroup label="Other towns">
                  {cities.filter((c) => !c.isMajor && !c.isCapital).map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </optgroup>
              )}
            </select>
          )}
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        </div>
        {cityError && <p className="text-xs text-destructive">{cityError}</p>}
      </div>
    </div>
  );
}
