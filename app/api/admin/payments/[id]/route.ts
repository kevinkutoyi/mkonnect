// app/api/admin/payments/[id]/route.ts
// PATCH — toggle grantedByAdmin on a subscription to include/exclude it from revenue

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const BodySchema = z.object({
  grantedByAdmin: z.boolean(),
});

interface RouteParams {
  params: { id: string };
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const body   = await req.json().catch(() => ({}));
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const sub = await prisma.profileSubscription.findUnique({ where: { id: params.id } });
  if (!sub) {
    return NextResponse.json({ error: "Subscription not found." }, { status: 404 });
  }

  const updated = await prisma.profileSubscription.update({
    where: { id: params.id },
    data:  { grantedByAdmin: parsed.data.grantedByAdmin },
  });

  await prisma.adminAction.create({
    data: {
      adminId:         session.user.id,
      targetProfileId: sub.profileId,
      actionType:      "PROFILE_REINSTATED",
      reason:          parsed.data.grantedByAdmin
        ? "Excluded from revenue reporting"
        : "Included in revenue reporting",
      notes: `Subscription ${sub.id} revenue inclusion toggled by admin`,
    },
  });

  return NextResponse.json({ id: updated.id, grantedByAdmin: updated.grantedByAdmin });
}
