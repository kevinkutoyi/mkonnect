// app/api/locations/counties/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const counties = await prisma.county.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true, name: true, slug: true, code: true, region: true,
      _count: { select: { cities: true } },
    },
  });

  // Group by region for UI section headers
  const grouped = counties.reduce<Record<string, typeof counties>>((acc, c) => {
    if (!acc[c.region]) acc[c.region] = [];
    acc[c.region].push(c);
    return acc;
  }, {});

  return NextResponse.json({ counties, grouped });
}
