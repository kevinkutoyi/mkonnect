// lib/auth-guards.ts
// Server-side and client-side role enforcement helpers

import { auth } from "@/lib/auth";
import { hasPermission, type Permission } from "@/lib/auth";
import type { Role } from "@prisma/client";

// ─── Server Component guard — assert session exists ───────────────────────────
/**
 * Use at the top of a Server Component or Route Handler.
 * Redirects to login if no session.
 */
export async function getSessionOrRedirect() {
  const { redirect } = await import("next/navigation");
  const session = await auth();
  if (!session) redirect("/auth/login");
  return session;
}

// ─── Server Component guard — assert specific roles ───────────────────────────
/**
 * Asserts the current user has one of `allowedRoles`.
 * Redirects to /unauthorized if role doesn't match.
 *
 * @example
 *   const session = await assertRole(["ADMIN"])
 */
export async function assertRole(allowedRoles: Role[]) {
  const { redirect } = await import("next/navigation");
  const session = await auth();

  if (!session) {
    redirect("/auth/login");
  }

  if (!allowedRoles.includes(session!.user.role)) {
    redirect("/unauthorized");
  }

  return session!;
}

// ─── Server Component guard — assert a permission ────────────────────────────
/**
 * Asserts the current user has a specific permission.
 *
 * @example
 *   const session = await assertPermission("approve_profiles")
 */
export async function assertPermission(permission: Permission) {
  const { redirect } = await import("next/navigation");
  const session = await auth();

  if (!session) redirect("/auth/login");

  if (!hasPermission(session!.user.role, permission)) {
    redirect("/unauthorized");
  }

  return session;
}

// ─── Server Component guard — assert email is verified ───────────────────────
export async function assertEmailVerified() {
  const { redirect } = await import("next/navigation");
  const session = await auth();

  if (!session) redirect("/auth/login");

  if (!session!.user.emailVerified) {
    redirect("/auth/verify-request");
  }

  return session;
}

// ─── API Route helper — return 401/403 JSON instead of redirecting ────────────
import { NextResponse } from "next/server";

export async function apiRequireAuth() {
  const session = await auth();
  if (!session) {
    return {
      session: null,
      error: NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 }),
    };
  }
  return { session, error: null };
}

export async function apiRequireRole(allowedRoles: Role[]) {
  const { session, error } = await apiRequireAuth();
  if (error || !session) return { session: null, error };

  if (!allowedRoles.includes(session!.user.role)) {
    return {
      session: null,
      error: NextResponse.json(
        { error: "FORBIDDEN", message: `Requires one of: ${allowedRoles.join(", ")}` },
        { status: 403 }
      ),
    };
  }

  return { session, error: null };
}
