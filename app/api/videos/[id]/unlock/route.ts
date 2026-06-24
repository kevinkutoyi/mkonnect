// app/api/videos/[id]/unlock/route.ts
// POST — initiate a KSH 100 Paystack payment to unlock a premium video

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { initializeTransaction, PaystackError } from "@/lib/paystack";
import { generateMerchantRef } from "@/lib/utils";

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Login to unlock this video." }, { status: 401 });
  }

  const userId = session.user.id;

  // Load video
  const video = await prisma.premiumVideo.findUnique({
    where:   { id: params.id, isActive: true },
    include: { profile: { select: { listingActive: true, status: true } } },
  });
  if (!video || !video.profile.listingActive || video.profile.status !== "APPROVED") {
    return NextResponse.json({ error: "Video not found." }, { status: 404 });
  }

  // Check if already unlocked
  const existing = await prisma.videoUnlock.findUnique({
    where: { videoId_userId: { videoId: params.id, userId } },
  });
  if (existing?.status === "COMPLETED") {
    return NextResponse.json({ error: "Already unlocked." }, { status: 409 });
  }

  // Load user email
  const user = await prisma.user.findUnique({
    where:  { id: userId },
    select: { email: true, name: true },
  });
  if (!user?.email) {
    return NextResponse.json({ error: "Account email required." }, { status: 400 });
  }

  // Expire any stale pending unlock
  if (existing?.status === "PENDING") {
    await prisma.videoUnlock.update({
      where: { videoId_userId: { videoId: params.id, userId } },
      data:  { status: "FAILED" },
    });
  }

  const reference = generateMerchantRef();
  const callbackUrl = `${process.env.NEXTAUTH_URL}/api/videos/callback`;

  // Create PENDING unlock record
  await prisma.videoUnlock.create({
    data: {
      videoId:   params.id,
      userId,
      reference,
      status:    "PENDING",
      amountPaid: video.price,
    },
  });

  try {
    const result = await initializeTransaction({
      email:       user.email,
      amountKES:   Number(video.price),
      reference,
      callbackUrl,
      metadata: {
        type:      "video_unlock",
        videoId:   params.id,
        userId,
        videoTitle: video.title,
      },
    });

    return NextResponse.json({ redirectUrl: result.authorization_url });
  } catch (err) {
    await prisma.videoUnlock.update({
      where: { reference },
      data:  { status: "FAILED" },
    });

    if (err instanceof PaystackError) {
      return NextResponse.json({ error: err.message }, { status: 502 });
    }
    return NextResponse.json({ error: "Payment initiation failed." }, { status: 500 });
  }
}
