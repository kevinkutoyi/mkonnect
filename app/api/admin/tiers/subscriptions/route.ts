// app/api/admin/tiers/subscriptions/route.ts — ADMIN: list all subscriptions
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const status = req.nextUrl.searchParams.get("status");
  const page   = Number(req.nextUrl.searchParams.get("page") ?? 1);
  const limit  = 20;

  const where: any = {};
  if (status) where.status = status;

  const [subs, total] = await Promise.all([
    prisma.profileSubscription.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        tier: { select: { displayName: true, badge: true, color: true } },
        profile: {
          select: {
            slug: true,
            user: { select: { name: true, email: true } },
          },
        },
      },
    }),
    prisma.profileSubscription.count({ where }),
  ]);

  return NextResponse.json({ subs, total, page, pageSize: limit });
}

// Admin can manually grant a subscription
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const { profileId, tierId, days, reason } = await req.json();
  if (!profileId || !tierId) {
    return NextResponse.json({ error: "profileId and tierId required" }, { status: 400 });
  }

  const tier   = await prisma.listingTier.findUnique({ where: { id: tierId } });
  if (!tier)   return NextResponse.json({ error: "Tier not found" }, { status: 404 });

  const durationDays = days ?? tier.durationDays;
  const now          = new Date();
  const expiresAt    = new Date(now.getTime() + durationDays * 86_400_000);

  // Expire existing active subs
  await prisma.profileSubscription.updateMany({
    where: { profileId, status: "ACTIVE" },
    data:  { status: "EXPIRED" },
  });

  const sub = await prisma.profileSubscription.create({
    data: {
      profileId,
      tierId,
      status:           "ACTIVE",
      startsAt:         now,
      expiresAt,
      merchantReference: `ADMIN-GRANT-${Date.now()}`,
      grantedByAdmin:   true,
      grantedReason:    reason ?? "Admin manual grant",
      amountPaid:       0,
      paidAt:           now,
    },
  });

  await prisma.masseuseProfile.update({
    where: { id: profileId },
    data: {
      activeTierId:   tierId,
      activeTierName: tier.name,
      isFeatured:     tier.featuredSlots > 0,
      featuredUntil:  tier.featuredSlots > 0 ? expiresAt : undefined,
      profileScore:   tier.searchBoost,
    },
  });

  await prisma.adminAction.create({
    data: {
      adminId:         session.user.id,
      actionType:      "NOTE_ADDED",
      targetProfileId: profileId,
      notes:           `Granted ${tier.displayName} tier for ${durationDays} days. Reason: ${reason ?? "N/A"}`,
    },
  });

  return NextResponse.json(sub, { status: 201 });
}
