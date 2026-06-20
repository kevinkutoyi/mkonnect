// app/(dashboard)/dashboard/photos/page.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PhotoManager } from "@/components/dashboard/PhotoManager";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Photos & Video — modelsraha" };

export default async function DashboardPhotosPage() {
  const session = await auth();
  if (!session || session.user.role !== "MASSEUSE") redirect("/");

  const profile = await prisma.masseuseProfile.findUnique({
    where:   { userId: session.user.id },
    select: {
      videoUrl: true,
      photos:   { orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }] },
    },
  });

  if (!profile) redirect("/dashboard/onboarding");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Photos &amp; Video</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your gallery photos and profile video. Great photos lead to more bookings.
        </p>
      </div>
      <PhotoManager
        initialPhotos={profile.photos}
        initialVideoUrl={profile.videoUrl}
      />
    </div>
  );
}
