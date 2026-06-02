"use client";
// hooks/useAuth.ts
// Client-side auth hooks

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { hasPermission, type Permission } from "@/lib/auth";
import type { Role } from "@prisma/client";

// ─── Basic session hook ───────────────────────────────────────────────────────
export function useAuth() {
  const { data: session, status, update } = useSession();

  return {
    session,
    user: session?.user ?? null,
    role: session?.user?.role as Role | undefined,
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated",
    isVisitor: session?.user?.role === "VISITOR",
    isClient: session?.user?.role === "CLIENT",
    isMasseuse: session?.user?.role === "MASSEUSE",
    isAdmin: session?.user?.role === "ADMIN",
    emailVerified: !!session?.user?.emailVerified,
    can: (permission: Permission) =>
      session ? hasPermission(session.user.role, permission) : false,
    update, // to refresh session after role change
  };
}

// ─── Require authentication (client-side redirect) ───────────────────────────
export function useRequireAuth(redirectTo = "/auth/login") {
  const { session, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !session) {
      router.replace(`${redirectTo}?callbackUrl=${window.location.pathname}`);
    }
  }, [session, isLoading, router, redirectTo]);

  return { session, isLoading };
}

// ─── Require specific role (client-side redirect) ────────────────────────────
export function useRequireRole(
  allowedRoles: Role[],
  options: { redirectTo?: string; onUnauthorized?: () => void } = {}
) {
  const { session, isLoading, role } = useAuth();
  const router = useRouter();

  const isAllowed = !isLoading && session && allowedRoles.includes(role!);

  useEffect(() => {
    if (isLoading) return;
    if (!session) {
      router.replace(`/auth/login?callbackUrl=${window.location.pathname}`);
      return;
    }
    if (!allowedRoles.includes(role!)) {
      options.onUnauthorized?.();
      router.replace(options.redirectTo ?? "/unauthorized");
    }
  }, [session, isLoading, role, router]);

  return { session, isLoading, isAllowed };
}

// ─── Permission check hook ────────────────────────────────────────────────────
export function usePermission(permission: Permission): boolean {
  const { can } = useAuth();
  return can(permission);
}
