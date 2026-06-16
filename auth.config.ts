import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { Role } from "@prisma/client";

// Edge-compatible auth config — no Prisma adapter, used by middleware only
export const authConfig: NextAuthConfig = {
  trustHost: true,
  pages: { signIn: "/auth/login" },
  providers: [
    // Authorize is handled in auth.ts; this stub satisfies NextAuth's requirement
    Credentials({ credentials: {}, authorize: async () => null }),
  ],
  callbacks: {
    jwt({ token }) { return token; },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id    = token.id as string;
        session.user.role  = token.role as Role;
        session.user.emailVerified = token.emailVerified as Date | null;
      }
      return session;
    },
  },
};
