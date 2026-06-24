// app/api/videos/route.ts
// GET  — list premium videos (public browse, with unlock status for logged-in users)
// POST — model uploads a new premium video

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// ── GET: public list ─────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const session = await auth();
  const userId  = session?.user?.id ?? null;

  const { searchParams } = new URL(req.url);
  const profileId = searchParams.get("profileId"); // optional — filter by profile

  const videos = await prisma.premiumVideo.findMany({
    where: {
      isActive:  true,
      ...(profileId ? { profileId } : {}),
      profile: { listingActive: true, status: "APPROVED" },
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
      // Count only — we don't expose unlock records
      _count: { select: { unlocks: true } },
    },
    orderBy: { createdAt: "desc" },
    take:    50,
  });

  // If user is logged in, check which videos they've unlocked
  let unlockedIds = new Set<string>();
  if (userId) {
    const unlocks = await prisma.videoUnlock.findMany({
      where:  { userId, status: "COMPLETED" },
      select: { videoId: true },
    });
    unlockedIds = new Set(unlocks.map((u) => u.videoId));
  }

  const result = videos.map((v) => ({
    id:          v.id,
    title:       v.title,
    description: v.description,
    price:       Number(v.price),
    unlockCount: v._count.unlocks,
    createdAt:   v.createdAt,
    isUnlocked:  unlockedIds.has(v.id),
    // Only expose videoUrl if unlocked
    videoUrl:    unlockedIds.has(v.id) ? v.videoUrl : null,
    profile: {
      slug:     v.profile.slug,
      name:     v.profile.user.name,
      avatarUrl: v.profile.avatarUrl,
      city:     v.profile.city?.name ?? null,
    },
  }));

  return NextResponse.json(result);
}

// ── POST: model creates a video ──────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "MASSEUSE") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, description, videoUrl } = await req.json();
  if (!title?.trim() || !videoUrl) {
    return NextResponse.json({ error: "title and videoUrl required" }, { status: 422 });
  }

  const profile = await prisma.masseuseProfile.findUnique({
    where:  { userId: session.user.id },
    select: { id: true },
  });
  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const video = await prisma.premiumVideo.create({
    data: {
      profileId:   profile.id,
      title:       title.trim().slice(0, 120),
      description: description?.trim() || null,
      videoUrl,
      price:       100,
    },
  });

  return NextResponse.json(video, { status: 201 });
}
