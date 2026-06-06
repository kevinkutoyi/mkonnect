// app/(main)/masseuse/[slug]/page.tsx
// Public profile page — only visible when status=APPROVED AND listingActive=true.
// Admins bypass the listingActive gate so they can preview profiles before approval.

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ServicesList } from "@/components/profile/ServicesList";
import { PhotoGallery } from "@/components/profile/PhotoGallery";
import { ReviewsList } from "@/components/profile/ReviewsList";
import { TierBadge } from "@/components/tiers/TierBadge";
import type { TierName } from "@prisma/client";

interface Props {
  params: { slug: string };
}

async function getMasseuse(slug: string) {
  return prisma.masseuseProfile.findUnique({
    where: { slug },
    include: {
      user:     { select: { id: true, name: true, phone: true } },
      location: true,
      services: { where: { isActive: true }, orderBy: { price: "asc" } },
      photos:   { orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }] },
      reviews: {
        where:   { status: "VISIBLE" },
        orderBy: { createdAt: "desc" },
        take:    20,
        include: { client: { select: { name: true, avatarUrl: true } } },
      },
    },
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // Use a lightweight query for metadata (no auth check needed)
  const profile = await prisma.masseuseProfile.findUnique({
    where:  { slug: params.slug, status: "APPROVED", listingActive: true },
    select: {
      bio:        true,
      avatarUrl:  true,
      user:       { select: { name: true } },
      location:   true,
      services:   { where: { isActive: true }, select: { name: true }, take: 5 },
    },
  });

  if (!profile) return { title: "Not Found" };

  const services = profile.services.map((s) => s.name).join(", ");
  return {
    title:       `${profile.user.name} — ${profile.location.town}`,
    description: `${profile.user.name} offers ${services} in ${profile.location.town}, ${profile.location.county}. ${profile.bio.slice(0, 120)}`,
    openGraph: {
      images: profile.avatarUrl ? [profile.avatarUrl] : [],
    },
  };
}

export default async function MasseuseProfilePage({ params }: Props) {
  const [profile, session] = await Promise.all([
    getMasseuse(params.slug),
    auth(),
  ]);

  if (!profile) notFound();

  // ── Visibility gate ────────────────────────────────────────────────────────
  // Admins can preview any profile. Everyone else needs both gates to pass.
  const isAdmin = session?.user?.role === "ADMIN";
  const isOwner = session?.user?.id === profile.user.id;

  if (!isAdmin && !isOwner) {
    // Public visitor: profile must be APPROVED and listing-active (payment confirmed)
    if (profile.status !== "APPROVED" || !profile.listingActive) {
      notFound();
    }
  } else if (isOwner && !isAdmin) {
    // The masseuse can preview their own profile, but show a "not listed" banner
    // (handled below with profileVisible flag — no redirect)
  }

  const profileVisible = profile.status === "APPROVED" && profile.listingActive;
  const lowestPrice = profile.services.length
    ? Math.min(...profile.services.map((s) => Number(s.price)))
    : null;

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      {/* ── Admin / owner preview banner ───────────────────────────────────── */}
      {(isAdmin || isOwner) && !profileVisible && (
        <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
          {isAdmin && profile.status !== "APPROVED" ? (
            <>
              <strong>Admin preview</strong> — This profile is{" "}
              <span className="font-semibold">{profile.status.toLowerCase()}</span> and not publicly visible.
            </>
          ) : (
            <>
              <strong>Preview mode</strong> — Your profile is not publicly listed yet.{" "}
              {profile.status !== "APPROVED"
                ? "It is awaiting admin approval."
                : "Activate a listing plan to make it visible."}
              {profile.status === "APPROVED" && !profile.listingActive && (
                <a href="/dashboard/listing" className="ml-1 font-medium underline">
                  Choose a plan →
                </a>
              )}
            </>
          )}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main content */}
        <div className="space-y-8 lg:col-span-2">
          {/* Tier badge alongside header */}
          {profile.activeTierName && profile.activeTierName !== "REGULAR" && (
            <div className="flex justify-end">
              <TierBadge tier={profile.activeTierName as TierName} size="md" />
            </div>
          )}

          <ProfileHeader profile={profile} />
          {profile.photos.length > 0 && <PhotoGallery photos={profile.photos} />}
          <ServicesList services={profile.services} profileId={profile.id} />
          <ReviewsList
            reviews={profile.reviews}
            avgRating={profile.avgRating}
            total={profile.totalReviews}
          />
        </div>

        {/* Sticky booking sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 rounded-xl border bg-card p-6 shadow-sm">
            <p className="mb-4 text-lg font-semibold">Book a session</p>

            {lowestPrice !== null ? (
              <p className="mb-6 text-sm text-muted-foreground">
                Starting from{" "}
                <span className="font-bold text-foreground">
                  KES {lowestPrice.toLocaleString()}
                </span>
              </p>
            ) : (
              <p className="mb-6 text-sm text-muted-foreground">No services listed yet.</p>
            )}

            {profileVisible ? (
              <a
                href={`/booking/${profile.id}`}
                className="block w-full rounded-lg bg-primary px-4 py-3 text-center text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Book Now
              </a>
            ) : (
              <div className="rounded-lg bg-muted px-4 py-3 text-center text-xs text-muted-foreground">
                Booking unavailable — profile not active
              </div>
            )}

            <div className="mt-4 grid grid-cols-2 gap-3 text-center text-sm">
              <div className="rounded-lg bg-muted p-3">
                <p className="font-bold">{profile.avgRating.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">Rating</p>
              </div>
              <div className="rounded-lg bg-muted p-3">
                <p className="font-bold">{profile.totalReviews}</p>
                <p className="text-xs text-muted-foreground">Reviews</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
