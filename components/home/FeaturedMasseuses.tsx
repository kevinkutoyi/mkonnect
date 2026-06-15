// components/home/FeaturedMasseuses.tsx
import Link from "next/link";
import { MasseuseCard } from "@/components/search/MasseuseCard";
import { ArrowRight } from "lucide-react";

interface Props {
  masseuses: any[];
}

export function FeaturedMasseuses({ masseuses }: Props) {
  if (masseuses.length === 0) return null;

  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-6">
        {/* Header */}
        <div className="mb-10 flex items-end justify-between">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-primary">
              Top Rated
            </p>
            <h2 className="text-3xl font-extrabold tracking-tight">Featured Masseuses</h2>
            <p className="mt-1 text-muted-foreground">
              Handpicked, verified professionals ready to book
            </p>
          </div>
          <Link
            href="/search"
            className="hidden items-center gap-1 text-sm font-semibold text-primary hover:underline sm:flex"
          >
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {masseuses.map((m, i) => (
            // First 3 are above the fold — preload their cover images (LCP)
            <MasseuseCard key={m.id} masseuse={m} priority={i < 3} />
          ))}
        </div>

        <div className="mt-8 text-center sm:hidden">
          <Link
            href="/search"
            className="inline-flex items-center gap-2 rounded-xl border px-6 py-3 text-sm font-semibold hover:bg-muted"
          >
            View all masseuses <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
