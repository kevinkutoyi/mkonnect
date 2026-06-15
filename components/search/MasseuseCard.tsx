// components/search/MasseuseCard.tsx
import Link from "next/link";
import Image from "next/image";
import { MapPin, Star, Home, Clock } from "lucide-react";
import { formatKES, formatDuration, getInitials } from "@/lib/utils";
import { TierBadge }       from "@/components/tiers/TierBadge";
import { TrustBadgeIcons } from "@/components/trust/TrustBadges";
import type { TierName } from "@prisma/client";

interface Props {
  masseuse: any;
  /** Pass true for above-the-fold cards to avoid lazy loading the LCP image */
  priority?: boolean;
}

// Rotate through subtle accent colours for category pills
const CATEGORY_COLOURS = [
  "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
];

function StarRating({ rating, count }: { rating: number; count: number }) {
  const full  = Math.floor(rating);
  const half  = rating - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: full }).map((_, i) => (
          <Star key={`f${i}`} className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
        ))}
        {half && (
          <span className="relative inline-block h-3.5 w-3.5">
            <Star className="absolute h-3.5 w-3.5 text-muted-foreground/30" />
            <span className="absolute inset-0 overflow-hidden w-1/2">
              <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
            </span>
          </span>
        )}
        {Array.from({ length: empty }).map((_, i) => (
          <Star key={`e${i}`} className="h-3.5 w-3.5 text-muted-foreground/30" />
        ))}
      </div>
      <span className="text-xs font-semibold">{rating.toFixed(1)}</span>
      <span className="text-xs text-muted-foreground">({count})</span>
    </div>
  );
}

export function MasseuseCard({ masseuse, priority = false }: Props) {
  const coverPhoto  = masseuse.photos?.[0];
  const services    = masseuse.services ?? [];
  const categories  = masseuse.categories?.map((c: any) => c.category ?? c) ?? [];
  const lowestPrice = services.length
    ? Math.min(...services.map((s: any) => Number(s.price)))
    : null;

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/10">
      {/* ── Photo ─────────────────────────────────────────────── */}
      <Link href={`/masseuse/${masseuse.slug}`} className="relative block h-56 shrink-0 bg-muted">
        {coverPhoto ? (
          <Image
            src={coverPhoto.url}
            alt={masseuse.user.name}
            fill
            priority={priority}
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
            <span className="text-5xl font-black text-primary/40">
              {getInitials(masseuse.user.name)}
            </span>
          </div>
        )}

        {/* Gradient scrim so overlaid text is always readable */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Top-left: tier badge */}
        {masseuse.activeTierName && masseuse.activeTierName !== "REGULAR" && (
          <div className="absolute left-3 top-3">
            <TierBadge tier={masseuse.activeTierName as TierName} size="sm" />
          </div>
        )}

        {/* Top-right: home service tag */}
        {masseuse.mobileService && (
          <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-background/90 px-2 py-1 text-[10px] font-bold backdrop-blur-sm">
            <Home className="h-3 w-3 text-primary" />
            Home visit
          </div>
        )}

        {/* Bottom overlay: name + location + trust icons */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <p className="text-base font-bold text-white leading-tight drop-shadow">
            {masseuse.user.name}
          </p>
          {masseuse.city && (
            <div className="mt-0.5 flex items-center gap-1 text-xs text-white/80">
              <MapPin className="h-3 w-3" />
              {masseuse.city.name}
              {masseuse.city.county ? `, ${masseuse.city.county.name}` : ""}
            </div>
          )}
          <div className="mt-1.5">
            <TrustBadgeIcons
              verificationLevel={masseuse.verificationLevel ?? "UNVERIFIED"}
              listingActive={masseuse.listingActive ?? false}
            />
          </div>
        </div>
      </Link>

      {/* ── Body ──────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col p-4 gap-3">

        {/* Rating row */}
        <div className="flex items-center justify-between">
          <StarRating rating={masseuse.avgRating} count={masseuse.totalReviews} />
          {lowestPrice !== null && (
            <span className="text-sm font-bold text-primary">
              From {formatKES(lowestPrice)}
            </span>
          )}
        </div>

        {/* Category badges */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {categories.slice(0, 3).map((cat: any, i: number) => (
              <span
                key={cat.id ?? cat.name}
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                  CATEGORY_COLOURS[i % CATEGORY_COLOURS.length]
                }`}
              >
                {cat.name}
              </span>
            ))}
          </div>
        )}

        {/* Services */}
        {services.length > 0 && (
          <div className="space-y-1.5">
            {services.slice(0, 3).map((s: any) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-lg bg-muted/60 px-3 py-1.5"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Clock className="h-3 w-3 shrink-0 text-muted-foreground" />
                  <span className="truncate text-xs font-medium">{s.name}</span>
                  {s.duration && (
                    <span className="shrink-0 text-[10px] text-muted-foreground">
                      {formatDuration(s.duration)}
                    </span>
                  )}
                </div>
                <span className="ml-2 shrink-0 text-xs font-bold text-primary">
                  {formatKES(Number(s.price))}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="mt-auto pt-1 flex gap-2">
          <Link
            href={`/masseuse/${masseuse.slug}`}
            className="flex-1 rounded-xl border px-4 py-2.5 text-center text-sm font-semibold transition-colors hover:bg-muted"
          >
            View Profile
          </Link>
          <Link
            href={`/booking/${masseuse.id}`}
            className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-center text-sm font-bold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-md hover:shadow-primary/25 active:scale-95"
          >
            Book Now
          </Link>
        </div>
      </div>
    </div>
  );
}
