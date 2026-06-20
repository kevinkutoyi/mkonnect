// app/(main)/model/[slug]/page.tsx
import { notFound }        from "next/navigation";
import type { Metadata }   from "next";
import dynamicImport       from "next/dynamic";
import { Suspense }        from "react";
import { prisma }          from "@/lib/prisma";
import { auth }            from "@/lib/auth";
import { ProfileHero }     from "@/components/profile/ProfileHero";
import { ProfileBio }      from "@/components/profile/ProfileBio";
import { ServicesList }    from "@/components/profile/ServicesList";
import { ReviewsList }     from "@/components/profile/ReviewsList";
import { BookingSidebar }  from "@/components/profile/BookingSidebar";
import { ContactBar }      from "@/components/contact/ContactBar";
import { PresenceHeartbeat } from "@/components/contact/PresenceHeartbeat";
import { FavoriteButton }   from "@/components/favorites/FavoriteButton";
import type { TierName }   from "@prisma/client";

// ── Lazy-load below-the-fold heavy components ─────────────────────────────────
// PhotoGallery uses lightbox JS; ReviewForm is client-only — both safely deferred
const PhotoGallery = dynamicImport(
  () => import("@/components/profile/PhotoGallery").then((m) => m.PhotoGallery),
  { loading: () => <div className="h-48 animate-pulse rounded-xl bg-muted" /> }
);
const ReviewForm = dynamicImport(
  () => import("@/components/reviews/ReviewForm").then((m) => m.ReviewForm),
  { loading: () => <div className="h-32 animate-pulse rounded-xl bg-muted" /> }
);

// Profile pages use auth() to check ownership — cannot use ISR/static generation.
// Force dynamic so every request is server-rendered with a live cookie context.
export const dynamic = "force-dynamic";

interface Props { params: { slug: string } }

async function getMasseuse(slug: string) {
  return prisma.masseuseProfile.findUnique({
    where: { slug },
    include: {
      user:       { select: { id: true, name: true, phone: true, isOnline: true, lastSeen: true } },
      city:       { include: { county: true } },
      services:   { where: { isActive: true }, orderBy: { price: "asc" } },
      photos:     { orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }] },
      categories: { include: { category: true } },
      reviews: {
        where:   { status: "VISIBLE" },
        orderBy: { createdAt: "desc" },
        take:    20,
        include: { client: { select: { name: true, avatarUrl: true } } },
      },
    },
  });
}

// ── SEO metadata ──────────────────────────────────────────────────────────────
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await prisma.masseuseProfile.findUnique({
    where:  { slug: params.slug, status: "APPROVED", listingActive: true },
    select: {
      bio:        true,
      tagline:    true,
      avatarUrl:  true,
      user:       { select: { name: true } },
      city:       { include: { county: true } },
      services:   { where: { isActive: true }, select: { name: true }, take: 5 },
      categories: { include: { category: { select: { name: true } } }, take: 5 },
    },
  });
  if (!p) return { title: "Not Found" };

  const cityStr    = p.city ? `${p.city.name}, ${p.city.county?.name ?? "Kenya"}` : "Kenya";
  const serviceStr = p.services.map((s) => s.name).join(", ");
  const catStr     = p.categories.map((c) => c.category.name).join(", ");
  const title      = `${p.user.name} — Professional Model in ${cityStr}`;
  const description = p.tagline
    ?? `${p.user.name} offers ${serviceStr} in ${cityStr}. ${p.bio?.slice(0, 110) ?? ""}`;
  const keywords = [
    p.user.name, "model", "massage", cityStr,
    serviceStr, catStr, "Kenya massage", "book massage",
  ].filter(Boolean).join(", ");

  return {
    title,
    description,
    keywords,
    openGraph: {
      title,
      description,
      images: p.avatarUrl ? [{ url: p.avatarUrl, alt: p.user.name }] : [],
      type: "profile",
    },
    twitter: { card: "summary_large_image", title, description },
    alternates: { canonical: `/model/${params.slug}` },
  };
}

// ── JSON-LD structured data ───────────────────────────────────────────────────
function JsonLd({ profile }: { profile: any }) {
  const base    = process.env.NEXTAUTH_URL ?? "https://mconnect.co.ke";
  const cityStr = profile.city ? `${profile.city.name}, ${profile.city.county?.name ?? ""}` : "";

  const data = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name:        profile.user.name,
    description: profile.bio ?? profile.tagline,
    image:       profile.avatarUrl,
    url:         `${base}/model/${profile.slug}`,
    telephone:   profile.user.phone,
    address: {
      "@type":         "PostalAddress",
      addressLocality: profile.city?.name,
      addressRegion:   profile.city?.county?.name,
      addressCountry:  "KE",
    },
    aggregateRating: profile.totalReviews > 0 ? {
      "@type":     "AggregateRating",
      ratingValue: profile.avgRating.toFixed(1),
      reviewCount: profile.totalReviews,
      bestRating:  "5",
      worstRating: "1",
    } : undefined,
    priceRange: profile.minPrice
      ? `KES ${Number(profile.minPrice).toLocaleString()}–${Number(profile.maxPrice ?? profile.minPrice).toLocaleString()}`
      : undefined,
    openingHours: buildOpeningHours(profile),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

const DAY_NAMES = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const DAY_KEYS  = ["availableMon","availableTue","availableWed","availableThu","availableFri","availableSat","availableSun"];

function buildOpeningHours(p: any): string[] {
  const from = p.availableFrom ?? "08:00";
  const to   = p.availableTo   ?? "20:00";
  return DAY_KEYS
    .map((k, i) => p[k] ? `${DAY_NAMES[i]} ${from}-${to}` : null)
    .filter(Boolean) as string[];
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default async function ModelProfilePage({ params }: Props) {
  const [profile, session] = await Promise.all([getMasseuse(params.slug), auth()]);
  if (!profile) notFound();

  const isFavorited = session?.user
    ? !!(await prisma.favorite.findUnique({
        where: { userId_profileId: { userId: session.user.id, profileId: profile.id } },
      }))
    : false;

  const isAdmin = session?.user?.role === "ADMIN";
  const isOwner = session?.user?.id === profile.user.id;

  if (!isAdmin && !isOwner) {
    if (profile.status !== "APPROVED" || !profile.listingActive) notFound();
  }

  const profileVisible = profile.status === "APPROVED" && profile.listingActive;

  return (
    <>
      <JsonLd profile={profile} />

      {/* Heartbeat for logged-in users */}
      {session?.user && <PresenceHeartbeat />}

      <div className="min-h-screen bg-background">
        {/* Preview banner */}
        {(isAdmin || isOwner) && !profileVisible && (
          <div className="sticky top-16 z-30 border-b border-amber-300 bg-amber-50 px-6 py-3 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
            {isAdmin && profile.status !== "APPROVED"
              ? <><strong>Admin preview —</strong> status: <em>{profile.status.toLowerCase()}</em>, not publicly visible.</>
              : <><strong>Preview mode —</strong>{" "}
                  {profile.status !== "APPROVED"
                    ? "Awaiting admin approval."
                    : <>Not publicly listed. <a href="/dashboard/listing" className="font-semibold underline">Activate a listing plan →</a></>}
                </>
            }
          </div>
        )}

        {/* Hero */}
        <ProfileHero profile={profile} />

        {/* Contact bar — below hero */}
        <div className="mx-auto max-w-6xl px-4 py-4 md:px-6">
          <div className="flex items-center gap-3 flex-wrap">
            <FavoriteButton
              profileId={profile.id}
              initialSaved={isFavorited}
              isLoggedIn={!!session?.user}
            />
            <ContactBar
            profile={{
              id:       profile.id,
              user:     { name: profile.user.name, phone: profile.user.phone },
              avatarUrl: profile.avatarUrl,
              isOnline: profile.user.isOnline,
            }}
            currentUserId={session?.user?.id ?? null}
            />
          </div>
        </div>

        {/* Body */}
        <div className="mx-auto max-w-6xl px-4 pb-10 md:px-6">
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Left column */}
            <div className="space-y-10 lg:col-span-2">
              <ProfileBio profile={profile} />

              {/* Service settings — where the model works */}
              {(profile.mobileService || profile.spaService) && (
                <section>
                  <h2 className="mb-3 text-xl font-bold">Where I work</h2>
                  <div className="flex flex-wrap gap-3">
                    {profile.mobileService && (
                      <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-4 py-3">
                        <span className="text-xl">🏠</span>
                        <div>
                          <p className="font-semibold text-sm">Home / Hotel visits</p>
                          <p className="text-xs text-muted-foreground">Travels to the client</p>
                        </div>
                      </div>
                    )}
                    {profile.spaService && (
                      <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-4 py-3">
                        <span className="text-xl">🛁</span>
                        <div>
                          <p className="font-semibold text-sm">My own space</p>
                          <p className="text-xs text-muted-foreground">Client comes to them</p>
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {(profile.photos.length > 1 || profile.videoUrl) && (
                <section>
                  <h2 className="mb-4 text-xl font-bold">Gallery</h2>
                  <PhotoGallery
                    photos={profile.photos.slice(1)}
                    videoUrl={profile.videoUrl}
                  />
                </section>
              )}
              <ServicesList services={profile.offeredServices ?? []} />
              <ReviewsList
                reviews={profile.reviews}
                avgRating={profile.avgRating}
                total={profile.totalReviews}
              />
              {/* Review form — hide for owners and admins */}
              {!isOwner && !isAdmin && (
                <ReviewForm profileId={profile.id} profileName={profile.user.name} />
              )}
            </div>

            {/* Sticky sidebar */}
            <div className="lg:col-span-1">
              <BookingSidebar profile={profile} visible={profileVisible} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
