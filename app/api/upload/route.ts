// app/api/upload/route.ts
// Accepts a multipart file upload, saves it to public/uploads/ on the server,
// and returns the public URL. No third-party storage needed.
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import { join, extname } from "path";
import crypto from "crypto";

const ALLOWED_IMAGE = new Set([
  "image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif",
]);
const ALLOWED_VIDEO = new Set([
  "video/mp4", "video/quicktime", "video/webm", "video/x-msvideo",
]);

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;  // 10 MB
const MAX_VIDEO_BYTES = 100 * 1024 * 1024; // 100 MB

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 422 });
  }

  const isImage = ALLOWED_IMAGE.has(file.type);
  const isVideo = ALLOWED_VIDEO.has(file.type);

  if (!isImage && !isVideo) {
    return NextResponse.json(
      { error: "File type not allowed. Use JPG, PNG, WEBP, MP4 or MOV." },
      { status: 422 }
    );
  }

  const maxBytes = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
  if (file.size > maxBytes) {
    return NextResponse.json(
      { error: `File too large. Max ${isVideo ? "100" : "10"} MB.` },
      { status: 422 }
    );
  }

  // Determine extension from original filename, fall back to MIME type
  const originalExt = extname(file.name).toLowerCase();
  const fallbackExt = isVideo ? ".mp4" : ".jpg";
  const ext = originalExt || fallbackExt;

  const subdir   = isVideo ? "videos" : "photos";
  const filename = `${crypto.randomUUID()}${ext}`;
  const uploadDir = join(process.cwd(), "public", "uploads", subdir);

  await mkdir(uploadDir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(join(uploadDir, filename), buffer);

  return NextResponse.json({
    url:   `/uploads/${subdir}/${filename}`,
    type:  isVideo ? "video" : "image",
  });
}
