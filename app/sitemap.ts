// app/sitemap.ts
import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const BASE = process.env.NEXTAUTH_URL ?? "https://mconnect.co.ke";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const [masseuses, cities, counties, categories] = await Promise.all([
    prisma.masseuseProfile.findMany({
      where:   { status: "APPROVED", listingActive: true },  // only live profiles
      select:  { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.city.findMany({
      where:  { isMajor: true },
      select: { slug: true },
    }),
    prisma.county.findMany({
      select: { slug: true },
    }),
    prisma.category.findMany({
      where:  { isActive: true },
      select: { slug: true, updatedAt: true },
    }),
  ]);

  return [
    // ── Core pages ─────────────────────────────────────────────────────────
    {
      url:             BASE,
      lastModified:    now,
      changeFrequency: "daily",
      priority:        1.0,
    },
    {
      url:             `${BASE}/search`,
      lastModified:    now,
      changeFrequency: "hourly",
      priority:        0.9,
    },

    // ── City search pages ───────────────────────────────────────────────────
    ...cities.map((c) => ({
      url:             `${BASE}/search?location=${c.slug}`,
      lastModified:    now,
      changeFrequency: "daily" as const,
      priority:        0.85,
    })),

    // ── County search pages ─────────────────────────────────────────────────
    ...counties.map((c) => ({
      url:             `${BASE}/search?county=${c.slug}`,
      lastModified:    now,
      changeFrequency: "daily" as const,
      priority:        0.75,
    })),

    // ── Category search pages ───────────────────────────────────────────────
    ...categories.map((c) => ({
      url:             `${BASE}/search?category=${c.slug}`,
      lastModified:    c.updatedAt ?? now,
      changeFrequency: "daily" as const,
      priority:        0.75,
    })),

    // ── Individual model profiles ────────────────────────────────────────
    ...masseuses.map((m) => ({
      url:             `${BASE}/model/${m.slug}`,
      lastModified:    m.updatedAt,
      changeFrequency: "weekly" as const,
      priority:        0.7,
    })),
  ];
}
