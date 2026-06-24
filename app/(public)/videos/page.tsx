// app/(public)/videos/page.tsx — premium video discovery page
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PremiumVideoCard } from "@/components/videos/PremiumVideoCard";
import { Lock } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Premium Videos — modelsraha",
  description: "Unlock exclusive short videos from models. KSH 100 per video.",
};
export const dynamic = "force-dynamic";

export default async function VideosPage({
  searchParams,
}: {
  searchParams: { status?: string; videoId?: string };
}) {
  const session = await auth();
  const userId  = session?.user?.id ?? null;

  const videos = await prisma.premiumVideo.findMany({
    where: {
      isActive: true,
      profile:  { listingActive: true, status: "APPROVED" },
    },
    include: {
      profile: {
        select: {
          slug:     true,
          avatarUrl: true,
          user:     { select: { name: true } },
          city:     { select: { name: true } },
        },
      },
      _count: { select: { unlocks: { where: { status: "COMPLETED" } } } },
    },
    orderBy: { createdAt: "desc" },
    take:    60,
  });

  // Check unlocked videos for logged-in user
  const unlockedIds = new Set<string>();
  if (userId) {
    const unlocks = await prisma.videoUnlock.findMany({
      where:  { userId, status: "COMPLETED" },
      select: { videoId: true },
    });
    unlocks.forEach((u) => unlockedIds.add(u.videoId));
  }

  const serialized = videos.map((v) => ({
    id:          v.id,
    title:       v.title,
    description: v.description,
    price:       100,
    unlockCount: v._count.unlocks,
    isUnlocked:  unlockedIds.has(v.id),
    videoUrl:    unlockedIds.has(v.id) ? v.videoUrl : null,
    profile: {
      slug:     v.profile.slug,
      name:     v.profile.user.name,
      avatarUrl: v.profile.avatarUrl,
      city:     v.profile.city?.name ?? null,
    },
  }));

  const justUnlocked = searchParams.status === "success" && searchParams.videoId
    ? serialized.find((v) => v.id === searchParams.videoId)
    : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Lock className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">Premium Videos</h1>
        </div>
        <p className="text-muted-foreground">
          Unlock exclusive short videos from our models — KSH 100 per video, yours to rewatch anytime.
        </p>
      </div>

      {/* Payment success banner */}
      {searchParams.status === "success" && (
        <div className="mb-6 rounded-2xl border border-green-300 bg-green-50 px-5 py-4 text-green-800 dark:border-green-700 dark:bg-green-950/30 dark:text-green-300">
          <p className="font-semibold">
            {justUnlocked ? `"${justUnlocked.title}" unlocked!` : "Video unlocked!"} 🎉
          </p>
          <p className="text-sm mt-0.5">You can now watch it below.</p>
        </div>
      )}
      {searchParams.status === "failed" && (
        <div className="mb-6 rounded-2xl border border-destructive/30 bg-destructive/10 px-5 py-4 text-destructive">
          <p className="font-semibold">Payment failed or was cancelled.</p>
          <p className="text-sm mt-0.5">Please try again.</p>
        </div>
      )}

      {/* Grid */}
      {serialized.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border bg-card py-24 text-center text-muted-foreground">
          <Lock className="h-12 w-12 opacity-20" />
          <p className="font-semibold text-lg">No premium videos yet</p>
          <p className="text-sm">Check back soon — models are uploading content.</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {serialized.map((video) => (
            <PremiumVideoCard
              key={video.id}
              video={video}
              isLoggedIn={!!session}
            />
          ))}
        </div>
      )}
    </div>
  );
}
