// app/api/tiers/route.ts — PUBLIC: list all active tiers
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const tiers = await prisma.listingTier.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json(tiers);
}
