"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search, MapPin } from "lucide-react";

interface HeroProps {
  locations: { id: number; slug: string; name: string }[];
}

export function Hero({ locations }: HeroProps) {
  const router = useRouter();
  const [location, setLocation] = useState("");
  const [service, setService]   = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (location) params.set("location", location);
    if (service)  params.set("service", service);
    router.push(`/search?${params.toString()}`);
  };

  return (
    <section className="py-20 bg-gradient-to-br from-primary/8 to-background">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4 leading-tight">
          Find a Professional<br />
          <span className="text-primary">Masseuse Near You</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed">
          Discover verified masseuses across Kenya — Nairobi, Mombasa, Kisumu and beyond.
          Book in minutes, pay securely via M-Pesa.
        </p>

        {/* Search form */}
        <form
          onSubmit={handleSearch}
          className="flex flex-wrap gap-3 max-w-2xl mx-auto bg-card rounded-2xl p-4 shadow-lg"
        >
          <div className="flex items-center gap-2 flex-1 min-w-36 rounded-lg border bg-background px-3 py-2">
            <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none"
            >
              <option value="">All locations</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.slug}>{loc.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 flex-[2] min-w-40 rounded-lg border bg-background px-3 py-2">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              type="text"
              placeholder="Service (e.g. Swedish, Deep Tissue)"
              value={service}
              onChange={(e) => setService(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none"
            />
          </div>

          <button
            type="submit"
            className="rounded-lg bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 shrink-0"
          >
            Search
          </button>
        </form>

        {/* Quick city links */}
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
