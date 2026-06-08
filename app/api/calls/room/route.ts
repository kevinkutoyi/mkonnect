// app/api/calls/room/route.ts
import { NextResponse } from "next/server";
import { auth }         from "@/lib/auth";

const DAILY_API_KEY = process.env.DAILY_API_KEY ?? "";
const DAILY_BASE    = "https://api.daily.co/v1";

// POST /api/calls/room — create a Daily.co room for a call
// Body: { profileId: string, type: "video"|"audio" }
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!DAILY_API_KEY) {
    return NextResponse.json({ error: "Daily.co not configured" }, { status: 503 });
  }

  const { profileId, type } = await req.json();

  const roomName = `mconnect-${profileId}-${Date.now()}`;

  const res = await fetch(`${DAILY_BASE}/rooms`, {
    method:  "POST",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${DAILY_API_KEY}`,
    },
    body: JSON.stringify({
      name:       roomName,
      properties: {
        exp:              Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour
        enable_chat:      false,
        enable_screenshare: false,
        start_video_off:  type === "audio",
        start_audio_off:  false,
        max_participants: 2,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("Daily.co error:", err);
    return NextResponse.json({ error: "Failed to create room" }, { status: 500 });
  }

  const room = await res.json();

  // Track analytics
  await fetch(`${process.env.NEXTAUTH_URL}/api/analytics/contact`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ type: type === "audio" ? "audio_call" : "video_call", profileId }),
  }).catch(() => {});

  return NextResponse.json({ url: room.url, name: room.name });
}
