// app/api/photos/route.ts
// POST — save a Cloudinary photo URL to the profile's gallery
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const MAX_PHOTOS = 12;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "MASSEUSE") {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }

  const { url, width, height, sizeBytes } = await req.json();
  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "url is required" }, { status: 422 });
  }

  const profile = await prisma.masseuseProfile.findUnique({
    where:  { userId: session.user.id },
    select: { id: true, _count: { select: { photos: true } } },
  });
  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }
  if (profile._count.photos >= MAX_PHOTOS) {
    return NextResponse.json(
      { error: `Maximum ${MAX_PHOTOS} photos allowed.` },
      { status: 422 }
    );
  }

  // First photo automatically becomes cover
  const isCover = profile._count.photos === 0;

  const photo = await prisma.profilePhoto.create({
    data: {
      profileId: profile.id,
      url,
      isCover,
      sortOrder: profile._count.photos,
      width:     width  ?? null,
      height:    height ?? null,
      sizeBytes: sizeBytes ?? null,
    },
  });

  // Keep avatarUrl in sync with the cover photo
  if (isCover) {
    await prisma.masseuseProfile.update({
      where: { id: profile.id },
      data:  { avatarUrl: url },
    });
  }

  return NextResponse.json(photo, { status: 201 });
}
