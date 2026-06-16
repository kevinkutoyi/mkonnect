// components/home/Cities.tsx
import Link from "next/link";
import { MapPin } from "lucide-react";

interface Props {
  cities: {
    id: number;
    name: string;
    slug: string;
    county: { name: string };
    _count: { profiles: number };
  }[];
}

// Rough accent colours cycling through — purely decorative
const ACCENTS = [
  "from-rose-500/20 to-pink-500/5",
  "from-violet-500/20 to-purple-500/5",
  "from-sky-500/20 to-blue-500/5",
  "from-amber-500/20 to-orange-500/5",
  "from-emerald-500/20 to-green-500/5",
  "from-cyan-500/20 to-teal-500/5",
  "from-fuchsia-500/20 to-pink-500/5",
  "from-indigo-500/20 to-violet-500/5",
];

export function Cities({ cities }: Props) {
  const active = cities.filter((c) => c._count.profiles > 0);
  if (active.length === 0) return null;

  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-10 text-center">
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-primary">
            Nationwide Coverage
          </p>
          <h2 className="text-3xl font-extrabold tracking-tight">Browse by City</h2>
          <p className="mt-1 text-muted-foreground">
            Professional models available across Kenya
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {active.map((city, i) => (
            <Link
              key={city.id}
              href={`/search?location=${city.slug}`}
              className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-br ${ACCENTS[i % ACCENTS.length]} p-6 transition-all hover:shadow-lg hover:-translate-y-0.5`}
            >
              <MapPin className="mb-3 h-5 w-5 text-primary" />
              <p className="font-bold text-foreground">{city.name}</p>
              <p className="text-xs text-muted-foreground">{city.county.name}</p>
              <p className="mt-2 text-xs font-semibold text-primary">
                {city._count.profiles} available
              </p>
            </Link>
          ))}
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don't see your city?{" "}
          <Link href="/search" className="font-semibold text-primary hover:underline">
            Search all locations →
          </Link>
        </p>
      </div>
    </section>
  );
}
