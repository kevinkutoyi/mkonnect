// components/home/FeaturedMasseuses.tsx
import Link from "next/link";
import { MasseuseCard } from "@/components/search/MasseuseCard";

interface Props {
  masseuses: any[];
}

export function FeaturedMasseuses({ masseuses }: Props) {
  if (masseuses.length === 0) return null;

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Top Rated Masseuses</h2>
          <Link
            href="/search"
            className="text-sm font-medium text-primary hover:underline"
          >
            View all →
          </Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {masseuses.map((m) => (
            <MasseuseCard key={m.id} masseuse={m} />
          ))}
        </div>
      </div>
    </section>
  );
}
