// app/(main)/favorites/page.tsx
import { redirect }   from "next/navigation";
import Link           from "next/link";
import Image          from "next/image";
import { Heart, MapPin, Star, ArrowRight } from "lucide-react";
import { auth }       from "@/lib/auth";
import { prisma }     from "@/lib/prisma";
import { formatKES, getInitials } from "@/lib/utils";
import { FavoriteButton } from "@/components/favorites/FavoriteButton";
import { PUBLIC_PROFILE_FILTER } from "@/lib/profile-activation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Favorites — mconnect",
  description: "Your saved masseuse profiles.",
};

export default async function FavoritesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?next=/favorites");

  const favs = await prisma.favorite.findMany({
    where:   { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      profile: {
        include: {
          user:       { select: { name: true } },
          city:       { include: { county: true } },
          services:   { where: { isActive: true }, orderBy: { price: "asc" }, take: 1 },
          photos:     { where: { isCover: true }, take: 1 },
          categories: { include: { category: true }, take: 3 },
        },
      },
    },
  });

  // Filter to only public profiles
  const visible = favs.filter(
    (f) =>
      f.profile.status === "APPROVED" && f.profile.listingActive
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:px-6">
      <div className="mb-8 flex items-center gap-3">
        <Heart className="h-7 w-7 fill-rose-500 text-rose-500" />
        <div>
          <h1 className="text-2xl font-bold">My Favorites</h1>
          <p className="text-sm text-muted-foreground">
            {visible.length} saved profile{visible.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="flex flex-col items-center gap-5 rounded-2xl border bg-card py-20 text-center">
          <Heart className="h-14 w-14 text-muted-foreground/20" />
          <div>
            <p className="text-lg font-semibold">No favorites yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Tap the heart icon on any profile to save it here.
            </p>
          </div>
          <Link
            href="/search"
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Browse masseuses
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map(({ profile, id: favId }) => {
            const photo = profile.photos[0];
            const cats  = profile.categories.map((c: any) => c.category ?? c);
            const city  = profile.city?.name ?? "";
            const from  = profile.services[0];

            return (
              <div key={favId} className="group relative overflow-hidden rounded-2xl border bg-card shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
                {/* Cover photo */}
                <Link href={`/masseuse/${profile.slug}`}>
                  <div className="relative h-44 w-full bg-gradient-to-br from-primary/20 to-background">
                    {photo && (
                      <Image
                        src={photo.url}
                        alt={profile.user.name}
                        fill
                        className="object-cover"
                        sizes="(max-width:640px) 100vw, 400px"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    {/* Name overlay */}
                    <div className="absolute bottom-3 left-3 right-12">
                      <p className="truncate font-bold text-white">{profile.user.name}</p>
                      {city && (
                        <p className="flex items-center gap-1 text-xs text-white/80">
                          <MapPin className="h-3 w-3" /> {city}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>

                {/* Favorite remove button */}
                <div className="absolute right-3 top-3">
                  <FavoriteButton
                    profileId={profile.id}
                    initialSaved
                    isLoggedIn
                    size="sm"
                  />
                </div>

                {/* Card body */}
                <div className="p-4">
                  {/* Rating */}
                  {profile.totalReviews > 0 && (
                    <div className="mb-2 flex items-center gap-1 text-sm">
                      <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold">{profile.avgRating.toFixed(1)}</span>
                      <span className="text-muted-foreground">({profile.totalReviews})</span>
                    </div>
                  )}

                  {/* Categories */}
                  {cats.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-1">
                      {cats.slice(0, 2).map((cat: any) => (
                        <span key={cat.id} className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                          {cat.name}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Starting price + CTA */}
                  <div className="flex items-center justify-between">
                    {from ? (
                      <p className="text-sm text-muted-foreground">
                        From <span className="font-bold text-foreground">{formatKES(from.price)}</span>
                      </p>
                    ) : <span />}
                    <Link
                      href={`/masseuse/${profile.slug}`}
                      className="flex items-center gap-1 rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/90"
                    >
                      View <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
