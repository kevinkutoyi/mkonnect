// app/api/reviews/route.ts
import { NextResponse } from "next/server";
import { z }            from "zod";
import { auth }         from "@/lib/auth";
import { prisma }       from "@/lib/prisma";

const Schema = z.object({
  profileId:   z.string().min(1),
  rating:      z.number().int().min(1).max(5),
  comment:     z.string().max(2000).optional(),
  isAnonymous: z.boolean().default(false),
});

export async function POST(req: Request) {
  const session = await auth();
  const body    = await req.json().catch(() => null);
  const parsed  = Schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { profileId, rating, comment, isAnonymous } = parsed.data;

  // Verify profile exists and is public
  const profile = await prisma.masseuseProfile.findUnique({
    where:  { id: profileId, status: "APPROVED", listingActive: true },
    select: { id: true },
  });
  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  // Prevent owners from reviewing themselves
  if (session?.user) {
    const own = await prisma.masseuseProfile.findUnique({
      where:  { id: profileId },
      select: { userId: true },
    });
    if (own?.userId === session.user.id) {
      return NextResponse.json({ error: "Cannot review your own profile" }, { status: 403 });
    }
  }

  const review = await prisma.review.create({
    data: {
      profileId,
      ratingOverall: rating,
      comment:       comment?.trim() || null,
      isAnonymous,
      clientId:      (!isAnonymous && session?.user?.id) ? session.user.id : null,
      status:        "HIDDEN", // always starts hidden — admin must approve
    },
  });

  return NextResponse.json({ id: review.id }, { status: 201 });
}
