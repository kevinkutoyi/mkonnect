// app/unauthorized/page.tsx
import Link from "next/link";
import { ShieldX } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Access Denied",
  robots: { index: false },
};

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 mb-6">
        <ShieldX className="h-10 w-10 text-destructive" />
      </div>
      <h1 className="text-3xl font-bold mb-2">Access Denied</h1>
      <p className="text-muted-foreground max-w-sm mb-8">
        You don't have permission to view this page. If you believe this is an error,
        please contact support.
      </p>
      <div className="flex gap-3">
        <Link
          href="/"
          className="rounded-lg border px-5 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
        >
          Go home
        </Link>
        <Link
          href="/auth/login"
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}
