// app/api/onboarding/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { OnboardingSchema } from "@/lib/validations/onboarding";
import { createSlug } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
    }
    if (session.user.role !== "MASSEUSE") {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = OnboardingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "VALIDATION_ERROR", fields: parsed.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const d = parsed.data;

    // Sync user name + phone if changed
    await prisma.user.update({
      where: { id: session.user.id },
      data: { name: d.fullName, phone: d.phone },
    });

    // Generate unique slug from name
    const baseSlug = createSlug(d.fullName);
    let slug = baseSlug;
    let n = 1;
    while (
      await prisma.masseuseProfile.findFirst({
        where: { slug, NOT: { userId: session.user.id } },
      })
    ) {
      slug = `${baseSlug}-${n++}`;
    }

    // Merge predefined + custom services into one array
    const allOfferedServices = [
      ...(d.offeredServices ?? []),
      ...(d.customServices ?? []).filter(Boolean),
    ];

    // Upsert profile
    const profile = await prisma.masseuseProfile.upsert({
      where: { userId: session.user.id },
      create: {
        userId:           session.user.id,
        slug,
        bio:              d.bio,
        tagline:          d.tagline,
        cityId:           d.cityId,
        address:          d.neighbourhood,
        yearsExperience:  d.yearsExperience,
        languages:        d.languages,
        avatarUrl:        d.avatarUrl || null,
        mobileService:    d.mobileService,
        spaService:       d.spaService,
        availableMon:     d.availableMon,
        availableTue:     d.availableTue,
        availableWed:     d.availableWed,
        availableThu:     d.availableThu,
        availableFri:     d.availableFri,
        availableSat:     d.availableSat,
        availableSun:     d.availableSun,
        availableFrom:    d.availableFrom,
        availableTo:      d.availableTo,
        offeredServices:  allOfferedServices,
        status:           "APPROVED",
      },
      update: {
        bio:              d.bio,
        tagline:          d.tagline,
        cityId:           d.cityId,
        address:          d.neighbourhood,
        yearsExperience:  d.yearsExperience,
        languages:        d.languages,
        avatarUrl:        d.avatarUrl || undefined,
        mobileService:    d.mobileService,
        spaService:       d.spaService,
        availableMon:     d.availableMon,
        availableTue:     d.availableTue,
        availableWed:     d.availableWed,
        availableThu:     d.availableThu,
        availableFri:     d.availableFri,
        availableSat:     d.availableSat,
        availableSun:     d.availableSun,
        availableFrom:    d.availableFrom,
        availableTo:      d.availableTo,
        offeredServices:  allOfferedServices,
      },
    });

    return NextResponse.json(
      { message: "Profile saved.", slug: profile.slug },
      { status: 201 }
    );
  } catch (err) {
    console.error("[Onboarding]", err);

    // Unique constraint violation — most commonly phone number already in use
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      const target = (err.meta?.target as string[] | undefined) ?? [];
      if (target.includes("phone")) {
        return NextResponse.json(
          { error: "VALIDATION_ERROR", fields: { phone: ["This phone number is already registered to another account."] } },
          { status: 422 }
        );
      }
      if (target.includes("slug")) {
        // Slug collision edge case — retry handled by caller
        return NextResponse.json(
          { error: "VALIDATION_ERROR", fields: { fullName: ["Name conflict — please try a slight variation."] } },
          { status: 422 }
        );
      }
    }

    return NextResponse.json({ error: "INTERNAL_ERROR", message: "Submission failed. Please try again." }, { status: 500 });
  }
}

// GET — fetch existing profile data to pre-fill the form on re-visit
export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "MASSEUSE") {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }

  const profile = await prisma.masseuseProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      services: { orderBy: { sortOrder: "asc" } },
      city: { include: { county: true } },
    },
  });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, phone: true },
  });

  return NextResponse.json({ profile, user });
}
