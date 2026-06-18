// lib/auth.config.ts
// Minimal NextAuth config for use in the Edge Runtime (Next.js Middleware).
// MUST NOT import Prisma or any Node.js-only module — Edge Runtime will crash.
// The full auth config in lib/auth.ts extends this and adds Prisma callbacks.

import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  trustHost: true,
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
  providers: [], // providers not needed in middleware
  session: { strategy: "jwt" as const, maxAge: 30 * 24 * 60 * 60 },

  callbacks: {
    // Lite jwt — reads role/id from the token itself; NO Prisma, Edge-safe.
    // The full jwt callback in auth.ts (with the 5-min DB refresh) runs only
    // in Node.js route-handler / server-component contexts.
    jwt({ token, user, trigger, session }: any) {
      if (user) {
        token.id = user.id ?? token.sub;
        token.role = user.role ?? "VISITOR";
        token.emailVerified = user.emailVerified ?? null;
      }
      if (trigger === "update" && session) {
        if (session.role) token.role = session.role;
        if (session.emailVerified) token.emailVerified = session.emailVerified;
      }
      return token;
    },

    session({ session, token }: any) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.emailVerified = token.emailVerified;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
