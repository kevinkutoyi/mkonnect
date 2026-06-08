// app/api/admin/reviews/[id]/route.ts
import { NextResponse } from "next/server";
import { z }            from "zod";
import { auth }         from "@/lib/auth";
import { prisma }       from "@/lib/prisma";

interface Ctx { params: { id: string } }

const Schema = z.object({
  action: z.enum(["approve", "hide", "remove"]),
  reason: z.string().optional(),
});

export async function PATCH(req: Request, { params }: Ctx) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body   = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { action, reason } = parsed.data;

  const statusMap = {
    approve: "VISIBLE",
    hide:    "HIDDEN",
    remove:  "REMOVED",
  } as const;

  const review = await prisma.review.update({
    where: { id: params.id },
    data:  {
      status:   statusMap[action],
      hiddenAt: action !== "approve" ? new Date() : null,
      hiddenBy: action !== "approve" ? session.user.id : null,
      flagReason: reason ?? null,
    },
    include: {
      profile: { select: { id: true, avgRating: true, totalReviews: true } },
    },
  });

  // If approved, recalculate profile avgRating + totalReviews
  if (action === "approve") {
    const stats = await prisma.review.aggregate({
      where:   { profileId: review.profileId, status: "VISIBLE" },
      _avg:    { ratingOverall: true },
      _count:  { id: true },
    });
    await prisma.masseuseProfile.update({
      where: { id: review.profileId },
      data:  {
        avgRating:    stats._avg.ratingOverall ?? 0,
        totalReviews: stats._count.id,
      },
    });
  }

  // If hiding/removing a previously visible review, recalculate too
  if (action !== "approve" && review.profile.totalReviews > 0) {
    const stats = await prisma.review.aggregate({
      where:   { profileId: review.profileId, status: "VISIBLE" },
      _avg:    { ratingOverall: true },
      _count:  { id: true },
    });
    await prisma.masseuseProfile.update({
      where: { id: review.profileId },
      data:  {
        avgRating:    stats._avg.ratingOverall ?? 0,
        totalReviews: stats._count.id,
      },
    });
  }

  return NextResponse.json({ ok: true, status: statusMap[action] });
}
