// app/api/reviews/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const ReviewSchema = z.object({
  bookingId: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "CLIENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = ReviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({
    where: {
      id: parsed.data.bookingId,
      clientId: session.user.id,
      status: "COMPLETED",
    },
  });

  if (!booking) {
    return NextResponse.json({ error: "Booking not found or not completed" }, { status: 404 });
  }

  const existing = await prisma.review.findUnique({ where: { bookingId: booking.id } });
  if (existing) {
    return NextResponse.json({ error: "Review already submitted" }, { status: 409 });
  }

  // Create review + update denormalized avgRating on profile
  const review = await prisma.review.create({
    data: {
      bookingId: booking.id,
      clientId: session.user.id,
      profileId: booking.profileId,
      rating: parsed.data.rating,
      comment: parsed.data.comment,
    },
  });

  // Recalculate avg rating
  const agg = await prisma.review.aggregate({
    where: { profileId: booking.profileId },
    _avg: { rating: true },
    _count: { rating: true },
  });

  await prisma.masseuseProfile.update({
    where: { id: booking.profileId },
    data: {
      avgRating: agg._avg.rating ?? 0,
      totalReviews: agg._count.rating,
    },
  });

  return NextResponse.json(review, { status: 201 });
}
