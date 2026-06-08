// app/api/presence/heartbeat/route.ts
import { NextResponse } from "next/server";
import { auth }         from "@/lib/auth";
import { prisma }       from "@/lib/prisma";

// POST /api/presence/heartbeat — called every 30s by logged-in users
export async function POST() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ ok: false });

  await prisma.user.update({
    where: { id: session.user.id },
    data:  { isOnline: true, lastSeen: new Date() },
  });

  return NextResponse.json({ ok: true });
}

// GET — for cleanup: mark users offline if lastSeen > 2 min ago
// Called by a cron or on-demand
export async function GET(req: Request) {
  const secret = new URL(req.url).searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const cutoff = new Date(Date.now() - 2 * 60 * 1000); // 2 minutes
  const { count } = await prisma.user.updateMany({
    where: { isOnline: true, lastSeen: { lt: cutoff } },
    data:  { isOnline: false },
  });

  return NextResponse.json({ markedOffline: count });
}
