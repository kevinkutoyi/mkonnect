// app/api/profile/video/route.ts
// PATCH — save or remove the profile video URL
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "MASSEUSE") {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }

  const { videoUrl } = await req.json();
  // Allow null/empty string to clear the video
  const value = videoUrl && typeof videoUrl === "string" ? videoUrl : null;

  const profile = await prisma.masseuseProfile.findUnique({
    where:  { userId: session.user.id },
    select: { id: true },
  });
  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  await prisma.masseuseProfile.update({
    where: { id: profile.id },
    data:  { videoUrl: value },
  });

  return NextResponse.json({ ok: true });
}
