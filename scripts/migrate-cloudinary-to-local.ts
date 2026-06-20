/**
 * scripts/migrate-cloudinary-to-local.ts
 *
 * Downloads every Cloudinary-hosted image/video from the database,
 * saves it to public/uploads/ on the server, and updates the DB record
 * to point to the new local URL.
 *
 * Safe to run multiple times — skips URLs that are already local.
 *
 * Run on the server:
 *   npx ts-node --skip-project scripts/migrate-cloudinary-to-local.ts
 */

import { PrismaClient } from "@prisma/client";
import { writeFile, mkdir } from "fs/promises";
import { join, extname } from "path";
import crypto from "crypto";
import https from "https";
import http from "http";

const prisma = new PrismaClient();
const PUBLIC_DIR = join(process.cwd(), "public");

// ── Helpers ───────────────────────────────────────────────────────────────────

function isCloudinary(url: string | null | undefined): url is string {
  return typeof url === "string" && url.includes("cloudinary.com");
}

function isVideo(url: string): boolean {
  return (
    url.includes("/video/") ||
    /\.(mp4|mov|webm|avi)(\?|$)/i.test(url)
  );
}

async function download(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const get = url.startsWith("https") ? https.get : http.get;
    get(url, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        // Follow redirect
        return download(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      const chunks: Buffer[] = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end",  () => resolve(Buffer.concat(chunks)));
      res.on("error", reject);
    }).on("error", reject);
  });
}

async function saveFile(buffer: Buffer, subdir: string, originalUrl: string): Promise<string> {
  const ext = extname(new URL(originalUrl).pathname).split("?")[0] || (isVideo(originalUrl) ? ".mp4" : ".jpg");
  const filename = `${crypto.randomUUID()}${ext}`;
  const dir = join(PUBLIC_DIR, "uploads", subdir);
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, filename), buffer);
  return `/uploads/${subdir}/${filename}`;
}

async function migrate(label: string, originalUrl: string, subdir = "photos"): Promise<string> {
  console.log(`  ↓ ${label}: ${originalUrl.slice(0, 80)}…`);
  const buffer   = await download(originalUrl);
  const localUrl = await saveFile(buffer, subdir, originalUrl);
  console.log(`  ✓ saved → ${localUrl}`);
  return localUrl;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  let total = 0;
  let skipped = 0;
  let failed = 0;

  // ── 1. ProfilePhoto.url ────────────────────────────────────────────────────
  console.log("\n── ProfilePhoto rows ──");
  const photos = await prisma.profilePhoto.findMany({
    select: { id: true, url: true, thumbnailUrl: true },
  });

  for (const photo of photos) {
    // url
    if (isCloudinary(photo.url)) {
      try {
        const subdir   = isVideo(photo.url) ? "videos" : "photos";
        const localUrl = await migrate(`photo ${photo.id}`, photo.url, subdir);
        const thumbUrl = isCloudinary(photo.thumbnailUrl)
          ? await migrate(`thumb ${photo.id}`, photo.thumbnailUrl, "photos").catch(() => null)
          : photo.thumbnailUrl;
        await prisma.profilePhoto.update({
          where: { id: photo.id },
          data:  { url: localUrl, thumbnailUrl: thumbUrl },
        });
        total++;
      } catch (e: any) {
        console.error(`  ✗ FAILED photo ${photo.id}:`, e.message);
        failed++;
      }
    } else {
      skipped++;
    }
  }

  // ── 2. MasseuseProfile.avatarUrl / coverPhotoUrl / videoUrl ───────────────
  console.log("\n── MasseuseProfile media fields ──");
  const profiles = await prisma.masseuseProfile.findMany({
    select: { id: true, avatarUrl: true, coverPhotoUrl: true, videoUrl: true },
  });

  for (const p of profiles) {
    const updates: Record<string, string | null> = {};

    if (isCloudinary(p.avatarUrl)) {
      try {
        updates.avatarUrl = await migrate(`avatarUrl profile ${p.id}`, p.avatarUrl, "photos");
        total++;
      } catch (e: any) { console.error(`  ✗ avatarUrl ${p.id}:`, e.message); failed++; }
    }

    if (isCloudinary(p.coverPhotoUrl)) {
      try {
        updates.coverPhotoUrl = await migrate(`coverPhotoUrl profile ${p.id}`, p.coverPhotoUrl, "photos");
        total++;
      } catch (e: any) { console.error(`  ✗ coverPhotoUrl ${p.id}:`, e.message); failed++; }
    }

    if (isCloudinary(p.videoUrl)) {
      try {
        updates.videoUrl = await migrate(`videoUrl profile ${p.id}`, p.videoUrl, "videos");
        total++;
      } catch (e: any) { console.error(`  ✗ videoUrl ${p.id}:`, e.message); failed++; }
    }

    if (Object.keys(updates).length > 0) {
      await prisma.masseuseProfile.update({ where: { id: p.id }, data: updates });
    }
  }

  // ── 3. User.avatarUrl (only Cloudinary ones — skip Google avatars) ─────────
  console.log("\n── User.avatarUrl ──");
  const users = await prisma.user.findMany({
    select: { id: true, avatarUrl: true },
  });

  for (const u of users) {
    if (isCloudinary(u.avatarUrl)) {
      try {
        const localUrl = await migrate(`user ${u.id} avatar`, u.avatarUrl, "photos");
        await prisma.user.update({ where: { id: u.id }, data: { avatarUrl: localUrl } });
        total++;
      } catch (e: any) { console.error(`  ✗ user ${u.id} avatar:`, e.message); failed++; }
    } else {
      skipped++;
    }
  }

  console.log(`\n✅ Done. Migrated: ${total} | Skipped (non-Cloudinary): ${skipped} | Failed: ${failed}`);
  if (failed > 0) {
    console.log("⚠️  Some files failed — check errors above. Original URLs still in DB for those rows.");
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
