// app/api/analytics/contact/route.ts
import { NextResponse } from "next/server";
import { auth }         from "@/lib/auth";
import { prisma }       from "@/lib/prisma";

// POST /api/analytics/contact
// Body: { type: "whatsapp"|"phone"|"message"|"video_call"|"audio_call", profileId: string }
export async function POST(req: Request) {
  try {
    const session   = await auth();
    const { type, profileId } = await req.json();

    if (!type || !profileId) {
      return NextResponse.json({ error: "type and profileId required" }, { status: 400 });
    }

    await prisma.contactEvent.create({
      data: { type, profileId, userId: session?.user?.id ?? null },
    });

    return NextResponse.json({ ok: true });
  } catch {
    // Never let analytics failures break the UI
    return NextResponse.json({ ok: true });
  }
}
