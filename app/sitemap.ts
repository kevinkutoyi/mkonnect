// app/sitemap.ts
import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXTAUTH_URL ?? "https://mconnect.co.ke";

  const masseuses = await prisma.masseuseProfile.findMany({
    where: { status: "APPROVED" },
    select: { slug: true, updatedAt: true },
  });

  const locations = await prisma.location.findMany({ select: { slug: true } });

  return [
    { url: base, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${base}/search`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    ...locations.map((loc) => ({
      url: `${base}/search?location=${loc.slug}`,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...masseuses.map((m) => ({
      url: `${base}/masseuse/${m.slug}`,
      lastModified: m.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
