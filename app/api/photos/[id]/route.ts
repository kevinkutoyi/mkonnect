// app/api/photos/[id]/route.ts
// DELETE — remove a photo | PATCH — set as cover or update sortOrder
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { unlink } from "fs/promises";
import { join } from "path";

async function deleteFileFromDisk(url: string) {
  if (!url.startsWith("/uploads/")) return; // skip Cloudinary / external URLs
  try {
    await unlink(join(process.cwd(), "public", url));
  } catch {
    // File already gone — not an error
  }
}

async function getPhotoForUser(photoId: string, userId: string) {
  const photo = await prisma.profilePhoto.findUnique({
    where:   { id: photoId },
    include: { profile: { select: { id: true, userId: true } } },
  });
  if (!photo || photo.profile.userId !== userId) return null;
  return photo;
}

// ── DELETE /api/photos/[id] ───────────────────────────────────────────────────
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session || session.user.role !== "MASSEUSE") {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }

  const photo = await getPhotoForUser(params.id, session.user.id);
  if (!photo) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.profilePhoto.delete({ where: { id: params.id } });
  await deleteFileFromDisk(photo.url);

  // If deleted photo was the cover, promote the next one
  if (photo.isCover) {
    const next = await prisma.profilePhoto.findFirst({
      where:   { profileId: photo.profile.id },
      orderBy: { sortOrder: "asc" },
    });
    if (next) {
      await prisma.profilePhoto.update({
        where: { id: next.id },
        data:  { isCover: true },
      });
      await prisma.masseuseProfile.update({
        where: { id: photo.profile.id },
        data:  { avatarUrl: next.url },
      });
    } else {
      // No photos left — clear avatarUrl
      await prisma.masseuseProfile.update({
        where: { id: photo.profile.id },
        data:  { avatarUrl: null },
      });
    }
  }

  return new NextResponse(null, { status: 204 });
}

// ── PATCH /api/photos/[id] ────────────────────────────────────────────────────
// Body: { isCover?: boolean, sortOrder?: number }
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session || session.user.role !== "MASSEUSE") {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }

  const photo = await getPhotoForUser(params.id, session.user.id);
  if (!photo) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();

  if (body.isCover === true) {
    // Demote current cover, promote this one
    await prisma.profilePhoto.updateMany({
      where: { profileId: photo.profile.id, isCover: true },
      data:  { isCover: false },
    });
    await prisma.profilePhoto.update({
      where: { id: params.id },
      data:  { isCover: true },
    });
    await prisma.masseuseProfile.update({
      where: { id: photo.profile.id },
      data:  { avatarUrl: photo.url },
    });
  }

  if (typeof body.sortOrder === "number") {
    await prisma.profilePhoto.update({
      where: { id: params.id },
      data:  { sortOrder: body.sortOrder },
    });
  }

  return NextResponse.json({ ok: true });
}
