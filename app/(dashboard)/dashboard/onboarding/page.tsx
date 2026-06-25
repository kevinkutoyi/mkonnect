// app/(dashboard)/dashboard/onboarding/page.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import { PayoutPhoneForm } from "@/components/dashboard/PayoutPhoneForm";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Set Up Your Profile — modelsraha" };

export default async function OnboardingPage() {
  const session = await auth();
  if (!session || session.user.role !== "MASSEUSE") redirect("/");

  // Load counties and categories server-side (no extra client fetch)
  const [counties, categories, existingProfile] = await Promise.all([
    prisma.county.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, slug: true } }),
    prisma.category.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" }, select: { id: true, name: true, type: true } }),
    prisma.masseuseProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        services: { orderBy: { sortOrder: "asc" } },
        city: { include: { county: true } },
      },
    }).then((p) => p ? { ...p, payoutPhone: p.payoutPhone ?? null } : null),
  ]);

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, phone: true },
  });

  return (
    <div className="mx-auto max-w-2xl py-8 px-4 space-y-8">
      <OnboardingWizard
        counties={counties}
        categories={categories}
        existingProfile={existingProfile}
        user={user!}
      />
      <PayoutPhoneForm current={existingProfile?.payoutPhone ?? null} />
    </div>
  );
}
