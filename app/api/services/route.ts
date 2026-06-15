// app/api/services/route.ts
// GET  — list all services for the authenticated masseuse
// POST — create a new service

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CreateServiceSchema } from "@/lib/validations/service";
import { updateProfilePriceRange } from "@/lib/services";

// ─── GET: list own services ───────────────────────────────────────────────────
export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "MASSEUSE") {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }

  const profile = await prisma.masseuseProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (!profile) {
    return NextResponse.json({ error: "Profile not found. Complete onboarding first." }, { status: 404 });
  }

  const services = await prisma.service.findMany({
    where: { profileId: profile.id },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: {
      category: { select: { id: true, name: true, icon: true, type: true } },
    },
  });

  return NextResponse.json(services);
}

// ─── POST: create service ─────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "MASSEUSE") {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }

  const profile = await prisma.masseuseProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (!profile) {
    return NextResponse.json({ error: "Complete your profile before adding services." }, { status: 404 });
  }

  const body = await req.json();
  const parsed = CreateServiceSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "VALIDATION_ERROR", fields: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  // Enforce max 20 services per profile
  const count = await prisma.service.count({ where: { profileId: profile.id } });
  if (count >= 20) {
    return NextResponse.json({ error: "Maximum 20 services allowed per profile." }, { status: 400 });
  }

  const { studioLocation, ...rest } = parsed.data;

  const service = await prisma.service.create({
    data: {
      ...rest,
      profileId:     profile.id,
      studioLocation: studioLocation ?? undefined,
      discountPrice: rest.discountPrice ?? undefined,
      depositAmount: rest.depositAmount ?? undefined,
    },
    include: {
      category: { select: { id: true, name: true, icon: true, type: true } },
    },
  });

  // Update profile price range
  await updateProfilePriceRange(profile.id);

  return NextResponse.json(service, { status: 201 });
}

