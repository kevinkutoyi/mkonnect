// lib/location.ts
// Location utilities — Haversine distance, bounding box, formatters

import { prisma } from "@/lib/prisma";

// ─── Haversine distance (km) between two lat/lng points ──────────────────────
export function haversineKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg: number) { return (deg * Math.PI) / 180; }

// ─── Bounding box for a given radius around a point ──────────────────────────
// Returns min/max lat/lng to use as a cheap pre-filter before exact distance
export function boundingBox(lat: number, lng: number, radiusKm: number) {
  const latDelta = radiusKm / 111; // 1 degree lat ≈ 111 km
  const lngDelta = radiusKm / (111 * Math.cos(toRad(lat)));
  return {
    minLat: lat - latDelta,
    maxLat: lat + latDelta,
    minLng: lng - lngDelta,
    maxLng: lng + lngDelta,
  };
}

// ─── Format location for display ─────────────────────────────────────────────
export function formatLocation(city: { name: string }, county: { name: string }): string {
  return `${city.name}, ${county.name}`;
}

export function formatLocationShort(city: { name: string }): string {
  return city.name;
}

// ─── Fetch cities within radius of a given city ──────────────────────────────
export async function getNearbyCities(
  cityId: number,
  radiusKm = 30,
  limit = 10
): Promise<{ id: number; name: string; slug: string; distanceKm: number }[]> {
  const origin = await prisma.city.findUnique({
    where: { id: cityId },
    select: { latitude: true, longitude: true },
  });

  if (!origin?.latitude || !origin?.longitude) return [];

  const lat = Number(origin.latitude);
  const lng = Number(origin.longitude);
  const box = boundingBox(lat, lng, radiusKm);

  const candidates = await prisma.city.findMany({
    where: {
      id: { not: cityId },
      latitude:  { gte: box.minLat, lte: box.maxLat },
      longitude: { gte: box.minLng, lte: box.maxLng },
    },
    select: { id: true, name: true, slug: true, latitude: true, longitude: true },
  });

  return candidates
    .map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      distanceKm: haversineKm(lat, lng, Number(c.latitude), Number(c.longitude)),
    }))
    .filter((c) => c.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit);
}

// ─── Fetch masseuse profiles within radius ────────────────────────────────────
export async function getMasseusesByProximity(params: {
  lat: number;
  lng: number;
  radiusKm: number;
  limit?: number;
}) {
  const { lat, lng, radiusKm, limit = 20 } = params;
  const box = boundingBox(lat, lng, radiusKm);

  const cities = await prisma.city.findMany({
    where: {
      latitude:  { gte: box.minLat, lte: box.maxLat },
      longitude: { gte: box.minLng, lte: box.maxLng },
    },
    select: { id: true, latitude: true, longitude: true },
  });

  const nearbyCityIds = cities
    .filter((c) =>
      c.latitude && c.longitude &&
      haversineKm(lat, lng, Number(c.latitude), Number(c.longitude)) <= radiusKm
    )
    .map((c) => c.id);

  return prisma.masseuseProfile.findMany({
    where: {
      status: "APPROVED",
      cityId: { in: nearbyCityIds },
    },
    orderBy: { avgRating: "desc" },
    take: limit,
    include: {
      user:     { select: { name: true } },
      city:     { include: { county: true } },
      services: { where: { isActive: true }, take: 3 },
      photos:   { where: { isCover: true }, take: 1 },
    },
  });
}
