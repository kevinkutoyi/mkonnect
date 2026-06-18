// lib/auth.ts
// NextAuth v5 (Auth.js) configuration
// JWT strategy — role, id, emailVerified embedded in token

import NextAuth, { type DefaultSession } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";

// ─── Type augmentation ────────────────────────────────────────────────────────
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      image?: string | null;
      role: Role;
      emailVerified: Date | null;
    } & DefaultSession["user"];
  }

  interface User {
    role: Role;
    emailVerified: Date | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    emailVerified: Date | null;
  }
}

// ─── Auth config ──────────────────────────────────────────────────────────────
export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  adapter: PrismaAdapter(prisma) as any,

  // JWT sessions — stateless, role embedded in token
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 }, // 30 days

  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },

  providers: [
    // ── Google OAuth ────────────────────────────────────────────────────────
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // Allow linking Google to an existing email/password account
      allowDangerousEmailAccountLinking: true,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          role: "VISITOR" as Role,
          emailVerified: new Date(), // Google guarantees email ownership
        };
      },
    }),

    // ── Email / Password ────────────────────────────────────────────────────
    CredentialsProvider({
      id: "credentials",
      name: "Email & Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("EMAIL_PASSWORD_REQUIRED");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          select: {
            id: true,
            email: true,
            name: true,
            avatarUrl: true,
            password: true,
            role: true,
            emailVerified: true,
            isActive: true,
            isBanned: true,
          },
        });

        if (!user || !user.password) {
          throw new Error("INVALID_CREDENTIALS");
        }

        if (user.isBanned) {
          throw new Error("ACCOUNT_BANNED");
        }

        if (!user.isActive) {
          throw new Error("ACCOUNT_INACTIVE");
        }

        const passwordMatch = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!passwordMatch) {
          throw new Error("INVALID_CREDENTIALS");
        }

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: {
            lastLoginAt: new Date(),
            loginCount: { increment: 1 },
          },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.avatarUrl ?? null,
          role: user.role,
          emailVerified: user.emailVerified,
        };
      },
    }),
  ],

  callbacks: {
    // ── JWT: embed role + id on every token ──────────────────────────────────
    async jwt({ token, user, trigger, session }) {
      // Initial sign-in — `user` is populated
      if (user) {
        token.id = user.id!;
        token.role = (user as any).role as Role;
        token.emailVerified = (user as any).emailVerified ?? null;
      }

      // Session update triggered by update() call
      if (trigger === "update" && session) {
        if (session.role) token.role = session.role;
        if (session.emailVerified) token.emailVerified = session.emailVerified;
      }

      // Refresh role from DB every 5 minutes to pick up admin changes
      const REFRESH_INTERVAL = 5 * 60; // seconds
      const now = Math.floor(Date.now() / 1000);
      if (token.id && (!token.lastRefresh || now - (token.lastRefresh as number) > REFRESH_INTERVAL)) {
        const fresh = await prisma.user.findUnique({
          where: { id: token.id },
          select: { role: true, isActive: true, isBanned: true, emailVerified: true },
        });
        if (!fresh || !fresh.isActive || fresh.isBanned) {
          // Force sign-out by returning null-like (throw causes session invalidation)
          return { ...token, role: "VISITOR" as Role, _forceSignOut: true };
        }
        token.role = fresh.role;
        token.emailVerified = fresh.emailVerified;
        (token as any).lastRefresh = now;
      }

      return token;
    },

    // ── Session: expose token fields to the client ────────────────────────────
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.emailVerified = token.emailVerified;
      }
      return session;
    },

    // ── SignIn: block banned/inactive accounts from OAuth too ─────────────────
    async signIn({ user, account }) {
      // For OAuth sign-ins, check the DB record
      if (account?.provider !== "credentials") {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email! },
          select: { isBanned: true, isActive: true, emailVerified: true },
        });
        if (dbUser?.isBanned || dbUser?.isActive === false) return false;

        // If linking to an existing account, mark email as verified
        // (Google guarantees email ownership)
        if (dbUser && !dbUser.emailVerified) {
          await prisma.user.update({
            where: { email: user.email! },
            data: { emailVerified: new Date() },
          });
        }
      }
      return true;
    },
  },

  events: {
    // When a new OAuth user is created, set their default role
    async createUser({ user }) {
      await prisma.user.update({
        where: { id: user.id },
        data: { role: "VISITOR" },
      });
    },
  },
});

// ─── Server-side role helper ──────────────────────────────────────────────────
/**
 * Use in Server Components / Route Handlers to assert required roles.
 * Throws a redirect if the session doesn't satisfy the requirement.
 *
 * @example
 *   const session = await requireRole(["ADMIN", "MASSEUSE"])
 */
export async function requireRole(
  allowedRoles: Role[],
  redirectTo = "/login"
): Promise<NonNullable<Awaited<ReturnType<typeof auth>>>> {
  const { redirect } = await import("next/navigation");
  const session = await auth();

  if (!session) {
    redirect(`${redirectTo}?callbackUrl=${encodeURIComponent(redirectTo)}`);
  }

  if (!allowedRoles.includes(session.user.role)) {
    redirect("/unauthorized");
  }

  return session;
}

// ─── Permission matrix ────────────────────────────────────────────────────────
export const PERMISSIONS = {
  // What each role can do
  VISITOR: [
    "browse_profiles",
    "view_profile",
    "search",
  ],
  CLIENT: [
    "browse_profiles",
    "view_profile",
    "search",
    "create_booking",
    "view_own_bookings",
    "write_review",
  ],
  MASSEUSE: [
    "browse_profiles",
    "view_profile",
    "search",
    "manage_own_profile",
    "manage_own_services",
    "view_own_bookings",
    "update_booking_status",
  ],
  ADMIN: [
    "browse_profiles",
    "view_profile",
    "search",
    "create_booking",
    "view_own_bookings",
    "write_review",
    "manage_own_profile",
    "manage_own_services",
    "update_booking_status",
    "approve_profiles",
    "suspend_users",
    "view_all_bookings",
    "manage_categories",
    "view_payments",
    "issue_refunds",
  ],
} as const satisfies Record<Role, readonly string[]>;

export type Permission = (typeof PERMISSIONS)[Role][number];

export function hasPermission(role: Role, permission: string): boolean {
  return (PERMISSIONS[role] as readonly string[]).includes(permission);
}
