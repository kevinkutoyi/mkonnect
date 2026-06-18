// lib/tokens.ts
// Secure token generation and verification helpers

import crypto from "crypto";
import { prisma } from "@/lib/prisma";

// ─── Auto-login token (post-email-verification) ───────────────────────────────
// HMAC-signed, stateless, 5-minute expiry. No DB required.
// Format (before base64url): `userId:role:expiry:hmac`

const AUTO_LOGIN_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

export function createAutoLoginToken(userId: string, role: string): string {
  const expiry = Date.now() + AUTO_LOGIN_EXPIRY_MS;
  const payload = `${userId}:${role}:${expiry}`;
  const hmac = crypto
    .createHmac("sha256", process.env.NEXTAUTH_SECRET!)
    .update(payload)
    .digest("hex");
  return Buffer.from(`${payload}:${hmac}`).toString("base64url");
}

export function verifyAutoLoginToken(token: string): { userId: string; role: string } {
  let decoded: string;
  try {
    decoded = Buffer.from(token, "base64url").toString();
  } catch {
    throw new Error("AUTO_LOGIN_INVALID");
  }

  // Split from the right to isolate hmac (which has no colons)
  const lastColon = decoded.lastIndexOf(":");
  const payload = decoded.slice(0, lastColon);
  const hmac = decoded.slice(lastColon + 1);

  const expectedHmac = crypto
    .createHmac("sha256", process.env.NEXTAUTH_SECRET!)
    .update(payload)
    .digest("hex");

  if (hmac !== expectedHmac) throw new Error("AUTO_LOGIN_INVALID");

  const parts = payload.split(":");
  const expiry = parseInt(parts[2], 10);
  if (Date.now() > expiry) throw new Error("AUTO_LOGIN_EXPIRED");

  return { userId: parts[0], role: parts[1] };
}

const RESET_EXPIRY_HOURS = 1;
const VERIFY_EXPIRY_HOURS = 24;

// ─── Generate a cryptographically random URL-safe token ──────────────────────
function generateRawToken(): string {
  return crypto.randomBytes(32).toString("hex"); // 64-char hex string
}

// ─── Hash a raw token for DB storage ─────────────────────────────────────────
export function hashToken(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

// ─── Password Reset Token ─────────────────────────────────────────────────────

/**
 * Creates a new password reset token, invalidating any existing ones.
 * Returns the RAW token (to embed in the email link).
 */
export async function createPasswordResetToken(userId: string): Promise<string> {
  // Invalidate previous tokens for this user
  await prisma.passwordResetToken.deleteMany({ where: { userId } });

  const raw = generateRawToken();
  const hashed = hashToken(raw);
  const expiresAt = new Date(Date.now() + RESET_EXPIRY_HOURS * 60 * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: { userId, token: hashed, expiresAt },
  });

  return raw; // send this in the email
}

/**
 * Validates a raw reset token. Returns the userId if valid, throws otherwise.
 */
export async function validatePasswordResetToken(raw: string): Promise<string> {
  const hashed = hashToken(raw);

  const record = await prisma.passwordResetToken.findUnique({
    where: { token: hashed },
    include: { user: { select: { id: true, email: true } } },
  });

  if (!record) throw new Error("TOKEN_INVALID");
  if (record.usedAt) throw new Error("TOKEN_ALREADY_USED");
  if (record.expiresAt < new Date()) throw new Error("TOKEN_EXPIRED");

  return record.user.id;
}

/**
 * Marks a reset token as used (call after password is changed).
 */
export async function consumePasswordResetToken(raw: string): Promise<void> {
  const hashed = hashToken(raw);
  await prisma.passwordResetToken.update({
    where: { token: hashed },
    data: { usedAt: new Date() },
  });
}

// ─── Email Verification Token ─────────────────────────────────────────────────

/**
 * Creates a new email verification token. Returns the RAW token.
 */
export async function createEmailVerificationToken(userId: string): Promise<string> {
  await prisma.emailVerificationToken.deleteMany({ where: { userId } });

  const raw = generateRawToken();
  const hashed = hashToken(raw);
  const expiresAt = new Date(Date.now() + VERIFY_EXPIRY_HOURS * 60 * 60 * 1000);

  await prisma.emailVerificationToken.create({
    data: { userId, token: hashed, expiresAt },
  });

  return raw;
}

/**
 * Validates and consumes an email verification token.
 * Returns the userId on success.
 */
export async function verifyEmailToken(raw: string): Promise<string> {
  const hashed = hashToken(raw);

  const record = await prisma.emailVerificationToken.findUnique({
    where: { token: hashed },
    include: { user: { select: { id: true } } },
  });

  if (!record) throw new Error("TOKEN_INVALID");
  if (record.usedAt) throw new Error("TOKEN_ALREADY_USED");
  if (record.expiresAt < new Date()) throw new Error("TOKEN_EXPIRED");

  // Mark used + set emailVerified on User atomically
  await prisma.$transaction([
    prisma.emailVerificationToken.update({
      where: { token: hashed },
      data: { usedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: record.user.id },
      data: { emailVerified: new Date() },
    }),
  ]);

  return record.user.id;
}
