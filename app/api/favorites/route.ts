// app/api/favorites/route.ts
import { NextResponse } from "next/server";
import { auth }         from "@/lib/auth";
import { prisma }       from "@/lib/prisma";
import { tierOrderBy }           from "@/lib/tier-sort";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const favs = await prisma.favorite.findMany({
    where:   { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      profile: {
        include: {
          user:       { select: { name: true } },
          city:       { include: { county: true } },
          services:   { where: { isActive: true }, orderBy: { price: "asc" }, take: 3 },
          photos:     { where: { isCover: true }, take: 1 },
          categories: { include: { category: true }, take: 3 },
        },
      },
    },
  });

  return NextResponse.json(
    favs.filter((f) => f.profile?.status === "APPROVED" && f.profile?.listingActive)
  );
}
