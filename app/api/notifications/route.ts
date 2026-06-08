// app/api/notifications/route.ts
// GET  — list notifications for current user (newest first, optionally unread-only)
// PATCH — mark a single notification as read  (?id=<notificationId>)

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const unreadOnly = searchParams.get("unread") === "1";
  const limit      = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 50);

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: {
        userId: session.user.id,
        ...(unreadOnly ? { read: false } : {}),
      },
      orderBy: { createdAt: "desc" },
      take:    limit,
    }),
    prisma.notification.count({
      where: { userId: session.user.id, read: false },
    }),
  ]);

  return NextResponse.json({ notifications, unreadCount });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const id = searchParams.get("id");

  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const notification = await prisma.notification.findUnique({ where: { id } });

  if (!notification || notification.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.notification.update({ where: { id }, data: { read: true } });

  return NextResponse.json({ ok: true });
}
