// app/(dashboard)/dashboard/videos/page.tsx
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { VideoManager } from "@/components/videos/VideoManager";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Premium Videos — modelsraha" };
export const dynamic = "force-dynamic";

export default async function DashboardVideosPage() {
  const session = await auth();
  if (!session || session.user.role !== "MASSEUSE") redirect("/");

  const profile = await prisma.masseuseProfile.findUnique({
    where:  { userId: session.user.id },
    select: { id: true },
  });

  const videos = profile
    ? await prisma.premiumVideo.findMany({
        where:   { profileId: profile.id },
        orderBy: { createdAt: "desc" },
        select: {
          id:          true,
          title:       true,
          description: true,
          videoUrl:    true,
          unlockCount: true,
          isActive:    true,
          createdAt:   true,
        },
      })
    : [];

  const serialized = videos.map((v) => ({
    ...v,
    createdAt: v.createdAt.toISOString(),
  }));

  return (
    <div className="max-w-2xl mx-auto space-y-2">
      <div>
        <h1 className="text-2xl font-bold">Premium Videos</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Clients pay KSH 100 to unlock each video. Earnings are included in your weekly M-Pesa payout.
        </p>
      </div>
      <VideoManager initial={serialized} />
    </div>
  );
}
