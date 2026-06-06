// components/search/MasseuseCard.tsx
import Link from "next/link";
import Image from "next/image";
import { MapPin, Star, Clock } from "lucide-react";
import { formatKES, formatDuration, getInitials } from "@/lib/utils";
import { TierBadge } from "@/components/tiers/TierBadge";
import type { TierName } from "@prisma/client";

interface Props {
  masseuse: any;
}

export function MasseuseCard({ masseuse }: Props) {
  const coverPhoto = masseuse.photos?.[0];
  const lowestPrice = masseuse.services?.length
    ? Math.min(...masseuse.services.map((s: any) => Number(s.price)))
    : null;

  return (
    <Link
      href={`/masseuse/${masseuse.slug}`}
      className="group block overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md"
    >
      {/* Photo */}
      <div className="relative h-48 bg-muted">
        {coverPhoto ? (
          <Image
            src={coverPhoto.url}
            alt={masseuse.user.name}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="text-4xl font-bold text-muted-foreground">
              {getInitials(masseuse.user.name)}
            </span>
          </div>
        )}
        {/* Tier badge — top left */}
        {masseuse.activeTierName && masseuse.activeTierName !== "REGULAR" && (
          <div className="absolute left-3 top-3">
            <TierBadge tier={masseuse.activeTierName as TierName} size="sm" />
          </div>
        )}
        {/* Rating badge */}
        <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-background/90 px-2 py-1 text-xs font-semibold backdrop-blur-sm">
          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
          {masseuse.avgRating.toFixed(1)}
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-semibold">{masseuse.user.name}</h3>
        <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" />
          {masseuse.location.town}, {masseuse.location.county}
        </div>

        {/* Services preview */}
        {masseuse.services?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {masseuse.services.slice(0, 3).map((s: any) => (
              <span
                key={s.id}
                className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs"
              >
                <Clock className="h-2.5 w-2.5" />
                {s.name}
              </span>
            ))}
          </div>
        )}

        <div className="mt-3 flex items-center justify-between text-sm">
          {lowestPrice !== null && (
            <span className="font-semibold text-primary">
              From {formatKES(lowestPrice)}
            </span>
          )}
          <span className="text-xs text-muted-foreground">{masseuse.totalReviews} reviews</span>
        </div>
      </div>
    </Link>
  );
}
