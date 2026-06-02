// app/(main)/booking/[id]/page.tsx
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BookingForm } from "@/components/booking/BookingForm";
import type { Metadata } from "next";

interface Props {
  params: { id: string };
}

export const metadata: Metadata = { title: "Book a Session" };

export default async function BookingPage({ params }: Props) {
  const session = await auth();
  if (!session) redirect(`/login?callbackUrl=/booking/${params.id}`);

  const profile = await prisma.masseuseProfile.findUnique({
    where: { id: params.id, status: "APPROVED" },
    include: {
      user: { select: { name: true } },
      services: { where: { isActive: true }, orderBy: { price: "asc" } },
      location: true,
    },
  });

  if (!profile) notFound();

  return (
    <div className="container mx-auto max-w-2xl px-4 py-12">
      <h1 className="mb-2 text-2xl font-bold">Book with {profile.user.name}</h1>
      <p className="mb-8 text-muted-foreground">
        {profile.location.town}, {profile.location.county}
      </p>
      <BookingForm profile={profile} clientId={session.user.id} />
    </div>
  );
}
