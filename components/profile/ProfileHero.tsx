// components/profile/ProfileHero.tsx
import Image from "next/image";
import { MapPin, Star } from "lucide-react";
import { getInitials }  from "@/lib/utils";
import { TierBadge }    from "@/components/tiers/TierBadge";
import { TrustBadges }  from "@/components/trust/TrustBadges";
import type { TierName } from "@prisma/client";

const CATEGORY_COLOURS = [
  "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
];

export function ProfileHero({ profile }: { profile: any }) {
  const cover = profile.photos?.[0];
  const cats  = profile.categories?.map((c: any) => c.category ?? c) ?? [];

  return (
    <div className="relative">
      {/* Cover banner */}
      <div className="relative h-52 w-full overflow-hidden bg-gradient-to-br from-primary/20 via-primary/10 to-background md:h-72">
        {cover && (
          <Image
            src={cover.url}
            alt={`${profile.user.name} cover`}
            fill
            priority
            className="object-cover object-center"
            sizes="100vw"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
      </div>

      {/* Profile info row */}
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="relative -mt-16 flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-6">
          {/* Avatar */}
          <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl border-4 border-background bg-muted shadow-lg sm:h-36 sm:w-36">
            {profile.avatarUrl ? (
              <Image
                src={profile.avatarUrl}
                alt={profile.user.name}
                fill
                className="object-cover"
                sizes="144px"
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/30 to-primary/10">
                <span className="text-3xl font-black text-primary">
                  {getInitials(profile.user.name)}
                </span>
              </div>
            )}
          </div>

          {/* Name / meta */}
          <div className="flex-1 pb-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                {profile.user.name}
              </h1>
              {profile.activeTierName && profile.activeTierName !== "REGULAR" && (
                <TierBadge tier={profile.activeTierName as TierName} size="sm" />
              )}
            </div>

            {profile.tagline && (
              <p className="mt-1 text-base text-muted-foreground italic">"{profile.tagline}"</p>
            )}

            {/* Trust badges — prominent row */}
            <div className="mt-2">
              <TrustBadges
                verificationLevel={profile.verificationLevel}
                listingActive={profile.listingActive}
                size="md"
                showLabels
              />
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              {profile.city && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                  {profile.city.name}{profile.city.county ? `, ${profile.city.county.name}` : ""}
                </span>
              )}
              {profile.totalReviews > 0 && (
                <span className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold text-foreground">{profile.avgRating.toFixed(1)}</span>
                  <span>({profile.totalReviews} reviews)</span>
                </span>
              )}
              {profile.yearsExperience && (
                <span>{profile.yearsExperience} yrs experience</span>
              )}
              {profile.mobileService && (
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                  🏠 Home visits
                </span>
              )}
            </div>

            {/* Category pills */}
            {cats.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {cats.map((cat: any, i: number) => (
                  <span
                    key={cat.id}
                    className={`rounded-full px-3 py-0.5 text-xs font-semibold ${CATEGORY_COLOURS[i % CATEGORY_COLOURS.length]}`}
                  >
                    {cat.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
