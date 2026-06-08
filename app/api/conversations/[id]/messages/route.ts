// app/api/conversations/[id]/messages/route.ts
import { NextResponse } from "next/server";
import { auth }         from "@/lib/auth";
import { prisma }       from "@/lib/prisma";

interface Ctx { params: { id: string } }

// GET /api/conversations/[id]/messages — poll for new messages (since cursor)
export async function GET(req: Request, { params }: Ctx) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const conv = await prisma.conversation.findUnique({
    where: { id: params.id },
    select: { clientId: true, masseuse: { select: { userId: true } } },
  });
  if (!conv) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const uid = session.user.id;
  if (conv.clientId !== uid && conv.masseuse.userId !== uid) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url    = new URL(req.url);
  const since  = url.searchParams.get("since");

  const messages = await prisma.message.findMany({
    where: {
      conversationId: params.id,
      ...(since ? { createdAt: { gt: new Date(since) } } : {}),
    },
    orderBy: { createdAt: "asc" },
    include: { sender: { select: { id: true, name: true, avatarUrl: true } } },
  });

  // Mark received messages as read
  await prisma.message.updateMany({
    where: { conversationId: params.id, senderId: { not: uid }, read: false },
    data:  { read: true },
  });

  return NextResponse.json(messages);
}

// POST /api/conversations/[id]/messages — send a message
export async function POST(req: Request, { params }: Ctx) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { content } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: "content required" }, { status: 400 });

  const conv = await prisma.conversation.findUnique({
    where: { id: params.id },
    select: { clientId: true, masseuse: { select: { userId: true } } },
  });
  if (!conv) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const uid = session.user.id;
  if (conv.clientId !== uid && conv.masseuse.userId !== uid) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [message] = await prisma.$transaction([
    prisma.message.create({
      data: { conversationId: params.id, senderId: uid, content: content.trim() },
      include: { sender: { select: { id: true, name: true, avatarUrl: true } } },
    }),
    prisma.conversation.update({
      where: { id: params.id },
      data:  { updatedAt: new Date() },
    }),
  ]);

  return NextResponse.json(message, { status: 201 });
}
