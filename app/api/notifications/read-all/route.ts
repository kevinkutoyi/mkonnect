// app/api/notifications/read-all/route.ts
// PATCH — mark ALL unread notifications as read for current user

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const { count } = await prisma.notification.updateMany({
    where: { userId: session.user.id, read: false },
    data:  { read: true },
  });

  return NextResponse.json({ ok: true, marked: count });
}
