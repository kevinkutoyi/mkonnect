// app/api/favorites/[profileId]/route.ts
import { NextResponse } from "next/server";
import { auth }         from "@/lib/auth";
import { prisma }       from "@/lib/prisma";

interface Ctx { params: { profileId: string } }

export async function POST(_: Request, { params }: Ctx) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.favorite.upsert({
    where:  { userId_profileId: { userId: session.user.id, profileId: params.profileId } },
    update: {},
    create: { userId: session.user.id, profileId: params.profileId },
  });

  return NextResponse.json({ saved: true });
}

export async function DELETE(_: Request, { params }: Ctx) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.favorite.deleteMany({
    where: { userId: session.user.id, profileId: params.profileId },
  });

  return NextResponse.json({ saved: false });
}
