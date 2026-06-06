"use client";
// components/location/NearbyFilter.tsx
// Nearby City filter — picks a city and radius, shows cities within that radius

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Navigation, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface NearbyCity {
  id: number; name: string; slug: string; distanceKm: number;
  county: { name: string };
}

const RADIUS_OPTIONS = [
  { label: "5 km",   value: 5  },
  { label: "10 km",  value: 10 },
  { label: "25 km",  value: 25 },
  { label: "50 km",  value: 50 },
  { label: "100 km", value: 100},
];

interface NearbyFilterProps {
  currentCityId?: number;
  currentCityName?: string;
  className?: string;
}

export function NearbyFilter({ currentCityId, currentCityName, className }: NearbyFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [radius, setRadius]         = useState(25);
  const [nearbyCities, setNearby]   = useState<NearbyCity[]>([]);
  const [loading, setLoading]       = useState(false);
  const [expanded, setExpanded]     = useState(false);
  const [usingGPS, setUsingGPS]     = useState(false);
  const [gpsError, setGpsError]     = useState<string | null>(null);

  const activeCity = searchParams.get("city");
  const activeRadius = Number(searchParams.get("radius") ?? 25);

  const fetchNearby = useCallback(async (cityId?: number, lat?: number, lng?: number) => {
    setLoading(true);
    setNearby([]);
    try {
      const params = new URLSearchParams({ radius: String(radius), limit: "12" });
      if (cityId)            params.set("cityId", String(cityId));
      else if (lat && lng)   { params.set("lat", String(lat)); params.set("lng", String(lng)); }
      else return;

      const res = await fetch(`/api/locations/nearby?${params}`);
      const data = await res.json();
      setNearby(data.results ?? []);
    } finally {
      setLoading(false);
    }
  }, [radius]);

  // Load when city changes or radius changes
  useEffect(() => {
    if (currentCityId) fetchNearby(currentCityId);
  }, [currentCityId, radius, fetchNearby]);

  const handleUseGPS = () => {
    if (!navigator.geolocation) {
      setGpsError("Geolocation is not supported by your browser.");
      return;
    }
    setUsingGPS(true);
    setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        fetchNearby(undefined, pos.coords.latitude, pos.coords.longitude);
        setUsingGPS(false);
        setExpanded(true);
      },
      () => {
        setGpsError("Could not get your location. Please allow location access.");
        setUsingGPS(false);
      }
    );
  };

  const applyCity = (city: NearbyCity) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("city", city.slug);
    params.set("radius", String(radius));
    params.delete("page");
    router.push(`/search?${params.toString()}`);
  };

  const clearNearby = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("city");
    params.delete("radius");
    router.push(`/search?${params.toString()}`);
  };

  return (
    <div className={cn("rounded-xl border bg-card p-4 space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-semibold text-sm">
          <Navigation className="h-4 w-4 text-primary" />
          Nearby cities
        </h3>
        {activeCity && (
          <button onClick={clearNearby} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <X className="h-3 w-3" /> Clear
          </button>
        )}
      </div>

      {/* Radius selector */}
      <div className="space-y-1.5">
        <p className="text-xs text-muted-foreground">Search radius</p>
        <div className="flex flex-wrap gap-1.5">
          {RADIUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setRadius(opt.value)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                radius === opt.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border hover:border-primary/40"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Use GPS button */}
      <button
        type="button"
        onClick={handleUseGPS}
        disabled={usingGPS}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed py-2 text-sm font-medium text-muted-foreground hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
      >
        {usingGPS
          ? <><Loader2 className="h-4 w-4 animate-spin" /> Detecting location…</>
          : <><Navigation className="h-4 w-4" /> Use my location</>}
      </button>
      {gpsError && <p className="text-xs text-destructive">{gpsError}</p>}

      {/* Nearby results */}
      {loading && (
        <div className="flex items-center justify-center py-3">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {!loading && nearbyCities.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">
            Towns within {radius} km{currentCityName ? ` of ${currentCityName}` : ""}
          </p>
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {nearbyCities.map((city) => (
              <button
                key={city.id}
                type="button"
                onClick={() => applyCity(city)}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted",
                  activeCity === city.slug && "bg-primary/10 text-primary font-medium"
                )}
              >
                <div className="text-left">
                  <span className="font-medium">{city.name}</span>
                  <span className="ml-1.5 text-xs text-muted-foreground">{city.county.name}</span>
                </div>
                <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs">
                  {city.distanceKm} km
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {!loading && currentCityId && nearbyCities.length === 0 && (
        <p className="text-xs text-center text-muted-foreground py-2">
          No other towns within {radius} km.
        </p>
      )}
    </div>
  );
}
