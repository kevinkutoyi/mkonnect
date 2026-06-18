"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search, MapPin, ChevronDown } from "lucide-react";

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
    <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-background pb-20 pt-16">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -top-32 right-0 h-[600px] w-[600px] rounded-full bg-primary/5 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-[400px] w-[400px] rounded-full bg-primary/8 blur-3xl" />

      <div className="relative mx-auto max-w-4xl px-6 text-center">
        {/* Badge */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-semibold text-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          Kenya's #1 Model Services Platform
        </div>

        <h1 className="text-5xl font-extrabold tracking-tight text-foreground md:text-7xl">
          Find Your Perfect<br />
          <span className="bg-gradient-to-r from-primary to-rose-400 bg-clip-text text-transparent">
            Model
          </span>
        </h1>

        <p className="mx-auto mt-3 max-w-xl text-xl font-semibold text-muted-foreground">
          Find your perfect model match
        </p>
        <p className="mx-auto mt-3 max-w-xl text-base text-muted-foreground">
          Browse verified, professional models across Kenya.
          Book in minutes, pay securely via M-Pesa.
        </p>

        {/* Search card */}
        <form
          onSubmit={handleSearch}
          className="mt-10 overflow-hidden rounded-2xl bg-card shadow-xl ring-1 ring-border"
        >
          <div className="flex flex-col sm:flex-row">
            {/* Location */}
            <div className="flex flex-1 items-center gap-3 border-b px-5 py-4 sm:border-b-0 sm:border-r">
              <MapPin className="h-4 w-4 shrink-0 text-primary" />
              <div className="flex-1">
                <p className="mb-0.5 text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Location</p>
                <div className="relative">
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full appearance-none bg-transparent text-sm font-medium outline-none"
                  >
                    <option value="">All of Kenya</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.slug}>{loc.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-0 top-0.5 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </div>

            {/* Service */}
            <div className="flex flex-[2] items-center gap-3 px-5 py-4">
              <Search className="h-4 w-4 shrink-0 text-primary" />
              <div className="flex-1">
                <p className="mb-0.5 text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Service</p>
                <input
                  type="text"
                  placeholder="e.g. Swedish massage, Deep tissue…"
                  value={service}
                  onChange={(e) => setService(e.target.value)}
                  className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-muted-foreground/50"
                />
              </div>
            </div>

            {/* Submit */}
            <div className="p-2 sm:flex sm:items-center">
              <button
                type="submit"
                className="w-full rounded-xl bg-primary px-8 py-3.5 text-sm font-bold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 active:scale-95"
              >
                Search
              </button>
            </div>
          </div>
        </form>

        {/* Quick picks */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <span className="text-xs text-muted-foreground">Popular:</span>
          {["Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret"].map((city) => (
            <button
              key={city}
              type="button"
              onClick={() => router.push(`/search?location=${city.toLowerCase()}`)}
              className="rounded-full border bg-background px-3 py-1 text-xs font-medium transition-colors hover:border-primary hover:text-primary"
            >
              {city}
            </button>
          ))}
        </div>

        {/* Trust stats */}
        <div className="mt-12 flex flex-wrap justify-center gap-8 text-center">
          {[
            { value: "185+", label: "Cities" },
            { value: "Verified", label: "Profiles" },
            { value: "M-Pesa", label: "Secure Payments" },
            { value: "24/7", label: "Support" },
          ].map(({ value, label }) => (
            <div key={label}>
              <p className="text-xl font-extrabold text-foreground">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
