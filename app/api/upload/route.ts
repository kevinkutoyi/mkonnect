// app/api/upload/route.ts
// Accepts a multipart file upload, saves it to public/uploads/ on the server,
// and returns the public URL. Videos are auto-transcoded to H.264 MP4 if needed
// so HEVC (iPhone default), MOV, and AVI all play correctly in browsers.
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { writeFile, mkdir, unlink, rename } from "fs/promises";
import { join, extname } from "path";
import crypto from "crypto";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

const ALLOWED_IMAGE = new Set([
  "image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif",
]);
// Accept common video formats — browser-incompatible codecs are auto-transcoded
const ALLOWED_VIDEO = new Set([
  "video/mp4", "video/quicktime", "video/webm", "video/x-msvideo",
]);

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;  // 10 MB
const MAX_VIDEO_BYTES = 25 * 1024 * 1024; // 25 MB

/** Returns the video codec name, or null if ffprobe isn't available */
async function getVideoCodec(filePath: string): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync("ffprobe", [
      "-v", "quiet",
      "-print_format", "json",
      "-show_streams",
      "-select_streams", "v:0",
      filePath,
    ], { timeout: 10_000 });
    const info = JSON.parse(stdout) as { streams?: { codec_name?: string }[] };
    return info.streams?.[0]?.codec_name ?? null;
  } catch {
    return null;
  }
}

/** Transcode any video to browser-safe H.264 MP4 with faststart */
async function transcodeH264(inputPath: string, outputPath: string): Promise<void> {
  await execFileAsync("ffmpeg", [
    "-i", inputPath,
    "-c:v", "libx264",
    "-crf", "23",
    "-preset", "fast",
    "-c:a", "aac",
    "-movflags", "+faststart",
    "-y",
    outputPath,
  ], { timeout: 5 * 60_000 }); // 5-min max
}

/** Re-mux H.264 to add faststart without re-encoding (fast) */
async function applyFaststart(inputPath: string, outputPath: string): Promise<void> {
  await execFileAsync("ffmpeg", [
    "-i", inputPath,
    "-c", "copy",
    "-movflags", "+faststart",
    "-y",
    outputPath,
  ], { timeout: 60_000 });
}

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
      { error: "File type not allowed. Use JPG, PNG, WEBP for images; MP4 or MOV for videos." },
      { status: 422 }
    );
  }

  const maxBytes = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
  if (file.size > maxBytes) {
    return NextResponse.json(
      { error: `File too large. Max ${isVideo ? "25" : "10"} MB.` },
      { status: 422 }
    );
  }

  const subdir   = isVideo ? "videos" : "photos";
  const uploadDir = join(process.cwd(), "public", "uploads", subdir);
  await mkdir(uploadDir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());

  // ── Video: write temp, check codec, transcode if needed ─────────────────────
  if (isVideo) {
    const originalExt = extname(file.name).toLowerCase() || ".mp4";
    const tempPath  = join(uploadDir, `tmp_${crypto.randomUUID()}${originalExt}`);
    const finalName = `${crypto.randomUUID()}.mp4`;
    const finalPath = join(uploadDir, finalName);

    await writeFile(tempPath, buffer);

    try {
      const codec = await getVideoCodec(tempPath);

      if (codec === "h264") {
        // Already compatible — just ensure faststart for smooth streaming
        await applyFaststart(tempPath, finalPath);
      } else {
        // HEVC, MOV, AVI, unknown — transcode to H.264
        console.log(`[Upload] Transcoding codec="${codec ?? "unknown"}" → H.264 MP4`);
        await transcodeH264(tempPath, finalPath);
      }
    } catch (err) {
      // ffmpeg not available or failed — use original file as-is
      console.warn("[Upload] ffmpeg step failed, storing original:", (err as Error).message);
      await rename(tempPath, finalPath);
    } finally {
      await unlink(tempPath).catch(() => {});
    }

    return NextResponse.json({ url: `/uploads/${subdir}/${finalName}`, type: "video" });
  }

  // ── Image: save directly ────────────────────────────────────────────────────
  const ext      = extname(file.name).toLowerCase() || ".jpg";
  const filename = `${crypto.randomUUID()}${ext}`;
  await writeFile(join(uploadDir, filename), buffer);

  return NextResponse.json({ url: `/uploads/${subdir}/${filename}`, type: "image" });
}
