// app/api/masseuses/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createSlug } from "@/lib/utils";
import { z } from "zod";

const CreateProfileSchema = z.object({
  bio: z.string().min(50).max(1000),
  locationId: z.string(),
  address: z.string().optional(),
  yearsExp: z.number().int().min(0).max(50).optional(),
  languages: z.array(z.string()).optional(),
  availability: z.record(z.boolean()).optional(),
});

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const page = Number(searchParams.get("page") ?? 1);
  const pageSize = 12;

  const where: any = { status: "APPROVED" };
  const location = searchParams.get("location");
  const service = searchParams.get("service");
  const minRating = searchParams.get("minRating");

  if (location) where.location = { slug: location };
  if (minRating) where.avgRating = { gte: Number(minRating) };
  if (service) {
    where.services = { some: { isActive: true, name: { contains: service, mode: "insensitive" } } };
  }

  const [data, total] = await Promise.all([
    prisma.masseuseProfile.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { avgRating: "desc" },
      include: {
        user: { select: { name: true } },
        location: true,
        services: { where: { isActive: true }, take: 3 },
        photos: { where: { isCover: true }, take: 1 },
      },
    }),
    prisma.masseuseProfile.count({ where }),
  ]);

  return NextResponse.json({ data, total, page, pageSize });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "MASSEUSE") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await prisma.masseuseProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (existing) {
    return NextResponse.json({ error: "Profile already exists" }, { status: 409 });
  }

  const body = await req.json();
  const parsed = CreateProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  const slug = await generateUniqueSlug(user!.name);

  const profile = await prisma.masseuseProfile.create({
    data: {
      userId: session.user.id,
      slug,
      bio: parsed.data.bio,
      locationId: parsed.data.locationId,
      address: parsed.data.address,
      yearsExp: parsed.data.yearsExp,
      languages: parsed.data.languages ?? [],
      availability: parsed.data.availability,
    },
    include: { location: true },
  });

  return NextResponse.json(profile, { status: 201 });
}

async function generateUniqueSlug(name: string): Promise<string> {
  const base = createSlug(name);
  let slug = base;
  let i = 1;
  while (await prisma.masseuseProfile.findUnique({ where: { slug } })) {
    slug = `${base}-${i++}`;
  }
  return slug;
}
