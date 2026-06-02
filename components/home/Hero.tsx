"use client";
// components/home/Hero.tsx
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search, MapPin } from "lucide-react";
import type { Location } from "@prisma/client";

interface HeroProps {
  locations: Location[];
}

export function Hero({ locations }: HeroProps) {
  const router = useRouter();
  const [location, setLocation] = useState("");
  const [service, setService] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (location) params.set("location", location);
    if (service) params.set("service", service);
    router.push(`/search?${params.toString()}`);
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-background py-20 lg:py-32">
      <div className="container mx-auto px-4 text-center">
        <h1 className="mb-4 text-4xl font-extrabold tracking-tight lg:text-6xl">
          Find a Professional
          <br />
          <span className="text-primary">Masseuse Near You</span>
        </h1>
        <p className="mx-auto mb-10 max-w-xl text-lg text-muted-foreground">
          Discover verified masseuses across Kenya — Nairobi, Mombasa, Kisumu and beyond.
          Book in minutes, pay securely via M-Pesa.
        </p>

        <form
          onSubmit={handleSearch}
          className="mx-auto flex max-w-2xl flex-col gap-3 rounded-2xl bg-card p-4 shadow-lg sm:flex-row"
        >
          <div className="flex flex-1 items-center gap-2 rounded-lg border bg-background px-3 py-2">
            <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none"
            >
              <option value="">All locations</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.slug}>
                  {loc.town}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-1 items-center gap-2 rounded-lg border bg-background px-3 py-2">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              type="text"
              placeholder="Service (e.g. Swedish, Deep Tissue)"
              value={service}
              onChange={(e) => setService(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>

          <button
            type="submit"
            className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Search
          </button>
        </form>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {["Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret"].map((city) => (
            <button
              key={city}
              onClick={() => router.push(`/search?location=${city.toLowerCase()}`)}
              className="rounded-full border px-4 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
            >
              {city}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
