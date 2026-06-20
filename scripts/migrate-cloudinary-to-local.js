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
const CLD_KEY    = process.env.CLOUDINARY_API_KEY;
const CLD_SECRET = process.env.CLOUDINARY_API_SECRET;
const CLD_CLOUD  = process.env.CLOUDINARY_CLOUD_NAME;

/**
 * For ACL-restricted Cloudinary images we need a signed private download URL.
 * Format: https://api.cloudinary.com/v1_1/{cloud}/image/download?public_id=...&timestamp=...&api_key=...&signature=...
 * Signature = SHA1("public_id={id}&timestamp={ts}" + api_secret)
 */
console.log(`[DEBUG] CLD_CLOUD=${CLD_CLOUD} CLD_KEY=${CLD_KEY ? "set" : "MISSING"} CLD_SECRET=${CLD_SECRET ? "set" : "MISSING"}`);

function cloudinaryPrivateUrl(originalUrl) {
  if (!CLD_KEY || !CLD_SECRET || !CLD_CLOUD) return null;
  // Only sign res.cloudinary.com delivery URLs, not already-signed API URLs
  if (!originalUrl.includes("res.cloudinary.com")) return null;

  // Extract resource type, version, public_id from delivery URL
  const m = originalUrl.match(/res\.cloudinary\.com\/[^/]+\/(image|video|raw)\/upload\/(?:v(\d+)\/)?(.+)$/i);
  if (!m) { console.log("[DEBUG] regex no match for:", originalUrl); return null; }

  const resourceType = m[1];
  const publicIdWithExt = m[3]; // e.g. modelsraha/profiles/abc.jpg
  // Strip extension from public_id
  const publicId = publicIdWithExt.replace(/\.[a-z0-9]+$/i, "");

  const timestamp = Math.round(Date.now() / 1000);
  const toSign    = `public_id=${publicId}&timestamp=${timestamp}${CLD_SECRET}`;
  const signature = crypto.createHash("sha1").update(toSign).digest("hex");

  const url = `https://api.cloudinary.com/v1_1/${CLD_CLOUD}/${resourceType}/download?public_id=${encodeURIComponent(publicId)}&timestamp=${timestamp}&api_key=${CLD_KEY}&signature=${signature}`;
  console.log("[DEBUG] signed URL:", url);
  return url;
}

function download(url, isFallback = false) {
  return new Promise((resolve, reject) => {
    const get = url.startsWith("https") ? https.get : http.get;
    get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return download(res.headers.location, isFallback).then(resolve).catch(reject);
      }
      if ((res.statusCode === 401 || res.statusCode === 403) && !isFallback) {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          console.log("[DEBUG] 401 body:", Buffer.concat(chunks).toString().slice(0, 300));
          const signedUrl = cloudinaryPrivateUrl(url);
          if (signedUrl) return download(signedUrl, true).then(resolve).catch(reject);
          reject(new Error(`HTTP ${res.statusCode} — ACL denied and no credentials available`));
        });
        return;
      }
      if (res.statusCode !== 200) {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          reject(new Error(`HTTP ${res.statusCode}: ${Buffer.concat(chunks).toString().slice(0, 200)}`));
        });
        return;
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
