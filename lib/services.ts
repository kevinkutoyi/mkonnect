// lib/services.ts
// Shared helpers for service management

import { prisma } from "@/lib/prisma";

/** Recalculate and persist minPrice/maxPrice on the profile from active services. */
export async function updateProfilePriceRange(profileId: string) {
  const agg = await prisma.service.aggregate({
    where: { profileId, isActive: true },
    _min: { price: true },
    _max: { price: true },
  });
  await prisma.masseuseProfile.update({
    where: { id: profileId },
    data: {
      minPrice: agg._min.price ?? undefined,
      maxPrice: agg._max.price ?? undefined,
    },
  });
}
