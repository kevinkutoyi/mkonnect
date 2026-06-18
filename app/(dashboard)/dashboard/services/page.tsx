// app/(dashboard)/dashboard/services/page.tsx
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ServicesManager } from "@/components/services/ServicesManager";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "My Services — modelsraha" };

export default async function ServicesPage() {
  const session = await auth();

  const [rawCategories, profile] = await Promise.all([
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, icon: true, type: true },
    }),
    prisma.masseuseProfile.findUnique({
      where: { userId: session!.user.id },
      select: {
        id: true, status: true,
        services: {
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
          include: {
            category: { select: { id: true, name: true, icon: true, type: true } },
          },
        },
      },
    }),
  ]);

  // Coerce icon: null → "" to satisfy the Category type
  const categories = rawCategories.map((c) => ({ ...c, icon: c.icon ?? "" }));

  return (
    <ServicesManager
      initialServices={profile?.services ?? []}
      categories={categories}
      profileStatus={profile?.status ?? null}
    />
  );
}
