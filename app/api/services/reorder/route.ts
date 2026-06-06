// app/api/services/reorder/route.ts
// PATCH — update sortOrder for multiple services at once (drag-to-reorder)

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ReorderServicesSchema } from "@/lib/validations/service";

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "MASSEUSE") {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }

  const profile = await prisma.masseuseProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const body = await req.json();
  const parsed = ReorderServicesSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "VALIDATION_ERROR", fields: parsed.error.flatten() }, { status: 422 });
  }

  // Verify all service IDs belong to this masseuse
  const ids = parsed.data.order.map((o) => o.id);
  const owned = await prisma.service.count({
    where: { id: { in: ids }, profileId: profile.id },
  });
  if (owned !== ids.length) {
    return NextResponse.json({ error: "Forbidden: one or more services not owned by you" }, { status: 403 });
  }

  // Batch update sortOrder
  await Promise.all(
    parsed.data.order.map(({ id, sortOrder }) =>
      prisma.service.update({ where: { id }, data: { sortOrder } })
    )
  );

  return NextResponse.json({ message: "Order updated." });
}
