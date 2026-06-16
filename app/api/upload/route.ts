// app/api/upload/route.ts
// Returns a Cloudinary signed upload URL — keeps API secret server-side
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }

  const { folder = "modelsraha/profiles", transformation } = await req.json().catch(() => ({}));

  const timestamp = Math.round(Date.now() / 1000);

  // Build params object — ALL params sent to Cloudinary must be signed, sorted alphabetically
  const params: Record<string, string> = { folder, timestamp: String(timestamp) };
  if (transformation) params.transformation = transformation;

  const paramsToSign = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");

  // Cloudinary's default signature algorithm is SHA-1
  const signature = crypto
    .createHash("sha1")
    .update(paramsToSign + process.env.CLOUDINARY_API_SECRET)
    .digest("hex");

  return NextResponse.json({
    signature,
    timestamp,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    folder,
  });
}
