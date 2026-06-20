// app/api/profile/video/route.ts
// PATCH — save or remove the profile video URL
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { unlink } from "fs/promises";
import { join } from "path";

async function deleteFileFromDisk(url: string | null) {
  if (!url || !url.startsWith("/uploads/")) return;
  try { await unlink(join(process.cwd(), "public", url)); } catch {}
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "MASSEUSE") {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }

  const { videoUrl } = await req.json();
  const value = videoUrl && typeof videoUrl === "string" ? videoUrl : null;

  const profile = await prisma.masseuseProfile.findUnique({
    where:  { userId: session.user.id },
    select: { id: true, videoUrl: true },
  });
  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  // Delete old video file from disk if it's being replaced or removed
  if (profile.videoUrl !== value) {
    await deleteFileFromDisk(profile.videoUrl);
  }

  await prisma.masseuseProfile.update({
    where: { id: profile.id },
    data:  { videoUrl: value },
  });

  return NextResponse.json({ ok: true });
}
