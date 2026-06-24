// app/api/videos/[id]/route.ts
// DELETE — model deletes their video
// PATCH  — model updates title/description

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session || session.user.role !== "MASSEUSE") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await prisma.masseuseProfile.findUnique({
    where:  { userId: session.user.id },
    select: { id: true },
  });

  const video = await prisma.premiumVideo.findUnique({
    where: { id: params.id },
    select: { profileId: true },
  });

  if (!video || video.profileId !== profile?.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.premiumVideo.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session || session.user.role !== "MASSEUSE") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await prisma.masseuseProfile.findUnique({
    where:  { userId: session.user.id },
    select: { id: true },
  });

  const video = await prisma.premiumVideo.findUnique({
    where: { id: params.id },
    select: { profileId: true },
  });

  if (!video || video.profileId !== profile?.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { title, description, isActive } = await req.json();
  const updated = await prisma.premiumVideo.update({
    where: { id: params.id },
    data: {
      ...(title       !== undefined ? { title: title.trim().slice(0, 120) } : {}),
      ...(description !== undefined ? { description: description?.trim() || null } : {}),
      ...(isActive    !== undefined ? { isActive } : {}),
    },
  });

  return NextResponse.json(updated);
}
