// app/api/locations/cities/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const countyId = searchParams.get("countyId");
  const search   = searchParams.get("q");
  const majorOnly = searchParams.get("majorOnly") === "true";

  if (!countyId && !search) {
    return NextResponse.json({ error: "Provide countyId or q" }, { status: 400 });
  }

  const where: any = {};
  if (countyId) where.countyId = Number(countyId);
  if (majorOnly) where.isMajor = true;
  if (search) {
    where.name = { contains: search, mode: "insensitive" };
  }

  const cities = await prisma.city.findMany({
    where,
    orderBy: [{ isMajor: "desc" }, { isCapital: "desc" }, { name: "asc" }],
    select: {
      id: true, name: true, slug: true,
      isCapital: true, isMajor: true,
      latitude: true, longitude: true,
      county: { select: { id: true, name: true, slug: true } },
    },
  });

  return NextResponse.json(cities);
}
