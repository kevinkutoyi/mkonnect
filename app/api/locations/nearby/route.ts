// app/api/locations/nearby/route.ts
// Returns cities within a radius of a given city or lat/lng point
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { haversineKm, boundingBox } from "@/lib/location";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  // Accept either cityId (look up coordinates) or raw lat/lng
  const cityId   = searchParams.get("cityId");
  const lat      = searchParams.get("lat");
  const lng      = searchParams.get("lng");
  const radius   = Math.min(Number(searchParams.get("radius") ?? 30), 200); // max 200 km
  const limit    = Math.min(Number(searchParams.get("limit")  ?? 10), 50);

  let originLat: number, originLng: number;

  if (cityId) {
    const city = await prisma.city.findUnique({
      where: { id: Number(cityId) },
      select: { latitude: true, longitude: true, name: true },
    });
    if (!city?.latitude || !city?.longitude) {
      return NextResponse.json({ error: "City not found or missing coordinates" }, { status: 404 });
    }
    originLat = Number(city.latitude);
    originLng = Number(city.longitude);
  } else if (lat && lng) {
    originLat = Number(lat);
    originLng = Number(lng);
    if (isNaN(originLat) || isNaN(originLng)) {
      return NextResponse.json({ error: "Invalid lat/lng" }, { status: 400 });
    }
  } else {
    return NextResponse.json({ error: "Provide cityId or lat+lng" }, { status: 400 });
  }

  // 1. Cheap bounding-box filter
  const box = boundingBox(originLat, originLng, radius);

  const candidates = await prisma.city.findMany({
    where: {
      ...(cityId ? { id: { not: Number(cityId) } } : {}),
      latitude:  { gte: box.minLat, lte: box.maxLat },
      longitude: { gte: box.minLng, lte: box.maxLng },
    },
    select: {
      id: true, name: true, slug: true,
      isCapital: true, isMajor: true,
      latitude: true, longitude: true,
      county: { select: { id: true, name: true, slug: true } },
    },
  });

  // 2. Exact Haversine filter + sort by distance
  const results = candidates
    .map((c) => ({
      ...c,
      distanceKm: Math.round(
        haversineKm(originLat, originLng, Number(c.latitude), Number(c.longitude))
      ),
    }))
    .filter((c) => c.distanceKm <= radius)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit);

  return NextResponse.json({ origin: { lat: originLat, lng: originLng, radiusKm: radius }, results });
}
