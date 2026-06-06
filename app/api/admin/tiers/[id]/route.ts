// app/api/admin/tiers/[id]/route.ts — ADMIN: edit tier price, duration, perks
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UpdateTierSchema } from "@/lib/validations/tier";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const body   = await req.json();
  const parsed = UpdateTierSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "VALIDATION_ERROR", fields: parsed.error.flatten() }, { status: 422 });
  }

  const id = parseInt(params.id, 10);
  if (isNaN(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const tier = await prisma.listingTier.findUnique({ where: { id } });
  if (!tier) return NextResponse.json({ error: "Tier not found" }, { status: 404 });

  const updated = await prisma.listingTier.update({
    where: { id },
    data:  parsed.data,
  });

  // Log admin action
  await prisma.adminAction.create({
    data: {
      adminId:    session.user.id,
      actionType: "NOTE_ADDED",
      notes:      `Updated ${tier.displayName} tier: ${JSON.stringify(parsed.data)}`,
    },
  });

  return NextResponse.json(updated);
}
