// app/api/conversations/route.ts
import { NextResponse } from "next/server";
import { auth }         from "@/lib/auth";
import { prisma }       from "@/lib/prisma";

// GET /api/conversations — list conversations for logged-in user
export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const isM    = session.user.role === "MASSEUSE";

  const convs = await prisma.conversation.findMany({
    where: isM
      ? { masseuse: { userId } }
      : { clientId: userId },
    include: {
      client:   { select: { id: true, name: true, avatarUrl: true } },
      masseuse: { select: { id: true, slug: true, user: { select: { name: true, isOnline: true } }, avatarUrl: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(convs);
}

// POST /api/conversations — get-or-create conversation with a masseuse
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { profileId } = await req.json();
  if (!profileId) return NextResponse.json({ error: "profileId required" }, { status: 400 });

  const conv = await prisma.conversation.upsert({
    where:  { clientId_profileId: { clientId: session.user.id, profileId } },
    update: {},
    create: { clientId: session.user.id, profileId },
    include: {
      messages: { orderBy: { createdAt: "asc" }, take: 50 },
    },
  });

  return NextResponse.json(conv);
}
