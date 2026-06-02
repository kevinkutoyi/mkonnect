// app/(main)/masseuse/[slug]/page.tsx
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ServicesList } from "@/components/profile/ServicesList";
import { PhotoGallery } from "@/components/profile/PhotoGallery";
import { ReviewsList } from "@/components/profile/ReviewsList";

interface Props {
  params: { slug: string };
}

async function getMasseuse(slug: string) {
  return prisma.masseuseProfile.findUnique({
    where: { slug, status: "APPROVED" },
    include: {
      user: { select: { id: true, name: true, phone: true } },
      location: true,
      services: { where: { isActive: true }, orderBy: { price: "asc" } },
      photos: { orderBy: [{ isCover: "desc" }, { order: "asc" }] },
      reviews: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { client: { select: { name: true, image: true } } },
      },
    },
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const profile = await getMasseuse(params.slug);
  if (!profile) return { title: "Not Found" };

  const services = profile.services.map((s) => s.name).join(", ");
  return {
    title: `${profile.user.name} — ${profile.location.town}`,
    description: `${profile.user.name} offers ${services} in ${profile.location.town}, ${profile.location.county}. ${profile.bio.slice(0, 120)}`,
    openGraph: {
      images: profile.avatarUrl ? [profile.avatarUrl] : [],
    },
  };
}

export default async function MasseuseProfilePage({ params }: Props) {
  const profile = await getMasseuse(params.slug);
  if (!profile) notFound();

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-8">
          <ProfileHeader profile={profile} />
          {profile.photos.length > 0 && <PhotoGallery photos={profile.photos} />}
          <ServicesList services={profile.services} profileId={profile.id} />
          <ReviewsList reviews={profile.reviews} avgRating={profile.avgRating} total={profile.totalReviews} />
        </div>
        {/* Sticky sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 rounded-xl border bg-card p-6 shadow-sm">
            <p className="mb-4 text-lg font-semibold">Book a session</p>
            <p className="mb-6 text-sm text-muted-foreground">
              Starting from{" "}
              <span className="font-bold text-foreground">
                KES {Math.min(...profile.services.map((s) => Number(s.price))).toLocaleString()}
              </span>
            </p>
            <a
              href={`/booking/${profile.id}`}
              className="block w-full rounded-lg bg-primary px-4 py-3 text-center text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Book Now
            </a>
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
