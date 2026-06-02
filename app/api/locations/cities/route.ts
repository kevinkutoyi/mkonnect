// app/api/locations/cities/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const countyId = Number(req.nextUrl.searchParams.get("countyId"));
  if (!countyId || isNaN(countyId)) {
    return NextResponse.json({ error: "countyId required" }, { status: 400 });
  }

  const cities = await prisma.city.findMany({
    where: { countyId },
    orderBy: [{ isMajor: "desc" }, { name: "asc" }],
    select: { id: true, name: true, countyId: true, isMajor: true, isCapital: true },
  });

  return NextResponse.json(cities);
}
