/**
 * scripts/migrate-cloudinary-to-local.js
 * Run: node scripts/migrate-cloudinary-to-local.js
 */
"use strict";

const { PrismaClient } = require("@prisma/client");
const { writeFile, mkdir } = require("fs/promises");
const { join, extname } = require("path");
const crypto = require("crypto");
const https  = require("https");
const http   = require("http");

const prisma     = new PrismaClient();
const PUBLIC_DIR = join(process.cwd(), "public");

function isCloudinary(url) {
  return typeof url === "string" && url.includes("cloudinary.com");
}

function isVideo(url) {
  return url.includes("/video/") || /\.(mp4|mov|webm|avi)(\?|$)/i.test(url);
}

// Load Cloudinary creds from .env for authenticated downloads
const fs = require("fs");
try {
  const env = fs.readFileSync(join(process.cwd(), ".env"), "utf8");
  for (const line of env.split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)\s*=\s*"?([^"\n]+)"?\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
} catch {}
const CLOUDINARY_AUTH = process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET
  ? Buffer.from(`${process.env.CLOUDINARY_API_KEY}:${process.env.CLOUDINARY_API_SECRET}`).toString("base64")
  : null;

function download(url, useAuth = false) {
  return new Promise((resolve, reject) => {
    const get = url.startsWith("https") ? https.get : http.get;
    const options = { headers: {} };
    if (useAuth && CLOUDINARY_AUTH) {
      options.headers["Authorization"] = `Basic ${CLOUDINARY_AUTH}`;
    }
    get(url, options, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return download(res.headers.location, useAuth).then(resolve).catch(reject);
      }
      if (res.statusCode === 401 && !useAuth) {
        // Retry with Cloudinary credentials
        return download(url, true).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end",  () => resolve(Buffer.concat(chunks)));
      res.on("error", reject);
    }).on("error", reject);
  });
}

async function saveFile(buffer, subdir, originalUrl) {
  let ext = ".jpg";
  try {
    const pathname = new URL(originalUrl).pathname;
    ext = extname(pathname).split("?")[0] || (isVideo(originalUrl) ? ".mp4" : ".jpg");
  } catch {}
  const filename = `${crypto.randomUUID()}${ext}`;
  const dir = join(PUBLIC_DIR, "uploads", subdir);
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, filename), buffer);
  return `/uploads/${subdir}/${filename}`;
}

async function migrate(label, originalUrl, subdir = "photos") {
  console.log(`  ↓ ${label}`);
  const buffer   = await download(originalUrl);
  const localUrl = await saveFile(buffer, subdir, originalUrl);
  console.log(`  ✓ → ${localUrl}`);
  return localUrl;
}

async function main() {
  let total = 0, skipped = 0, failed = 0;

  // ── ProfilePhoto rows ───────────────────────────────────────────────────────
  console.log("\n── ProfilePhoto rows ──");
  const photos = await prisma.profilePhoto.findMany({
    select: { id: true, url: true, thumbnailUrl: true },
  });
  for (const photo of photos) {
    if (isCloudinary(photo.url)) {
      try {
        const subdir   = isVideo(photo.url) ? "videos" : "photos";
        const localUrl = await migrate(`photo ${photo.id}`, photo.url, subdir);
        let thumbUrl   = photo.thumbnailUrl;
        if (isCloudinary(photo.thumbnailUrl)) {
          thumbUrl = await migrate(`thumb ${photo.id}`, photo.thumbnailUrl, "photos").catch(() => null);
        }
        await prisma.profilePhoto.update({
          where: { id: photo.id },
          data:  { url: localUrl, thumbnailUrl: thumbUrl },
        });
        total++;
      } catch (e) {
        console.error(`  ✗ photo ${photo.id}:`, e.message);
        failed++;
      }
    } else { skipped++; }
  }

  // ── MasseuseProfile media fields ────────────────────────────────────────────
  console.log("\n── MasseuseProfile media ──");
  const profiles = await prisma.masseuseProfile.findMany({
    select: { id: true, avatarUrl: true, coverPhotoUrl: true, videoUrl: true },
  });
  for (const p of profiles) {
    const updates = {};
    if (isCloudinary(p.avatarUrl)) {
      try { updates.avatarUrl = await migrate(`avatarUrl ${p.id}`, p.avatarUrl, "photos"); total++; }
      catch (e) { console.error(`  ✗ avatarUrl ${p.id}:`, e.message); failed++; }
    }
    if (isCloudinary(p.coverPhotoUrl)) {
      try { updates.coverPhotoUrl = await migrate(`coverPhotoUrl ${p.id}`, p.coverPhotoUrl, "photos"); total++; }
      catch (e) { console.error(`  ✗ coverPhotoUrl ${p.id}:`, e.message); failed++; }
    }
    if (isCloudinary(p.videoUrl)) {
      try { updates.videoUrl = await migrate(`videoUrl ${p.id}`, p.videoUrl, "videos"); total++; }
      catch (e) { console.error(`  ✗ videoUrl ${p.id}:`, e.message); failed++; }
    }
    if (Object.keys(updates).length > 0) {
      await prisma.masseuseProfile.update({ where: { id: p.id }, data: updates });
    }
  }

  // ── User.avatarUrl (Cloudinary only — skip Google avatars) ──────────────────
  console.log("\n── User avatarUrl ──");
  const users = await prisma.user.findMany({
    select: { id: true, avatarUrl: true },
  });
  for (const u of users) {
    if (isCloudinary(u.avatarUrl)) {
      try {
        const localUrl = await migrate(`user ${u.id}`, u.avatarUrl, "photos");
        await prisma.user.update({ where: { id: u.id }, data: { avatarUrl: localUrl } });
        total++;
      } catch (e) { console.error(`  ✗ user ${u.id}:`, e.message); failed++; }
    } else { skipped++; }
  }

  console.log(`\n✅  Migrated: ${total} | Skipped (non-Cloudinary): ${skipped} | Failed: ${failed}`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
