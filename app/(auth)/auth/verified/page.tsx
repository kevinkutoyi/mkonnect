"use client";
// app/(auth)/auth/verified/page.tsx
// Auto-logs in the user immediately after email verification.

import { useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { CheckCircle2, Loader2 } from "lucide-react";

function VerifiedContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const t = searchParams.get("t");

  useEffect(() => {
    if (!t) {
      router.replace("/auth/login");
      return;
    }

    signIn("credentials", { autoLoginToken: t, redirect: false }).then((result) => {
      if (result?.ok) {
        // Redirect based on role encoded in token — fall back to dashboard
        // The dashboard layout will bounce non-masseuses to /
        router.replace("/dashboard/onboarding");
      } else {
        // Token expired or invalid — send to login
        router.replace("/auth/login");
      }
    });
  }, [t, router]);

  return (
    <div className="space-y-5 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
        <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
      </div>
      <div>
        <h1 className="text-2xl font-bold">Email verified!</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Logging you in automatically…
        </p>
      </div>
      <Loader2 className="h-5 w-5 animate-spin mx-auto text-primary" />
    </div>
  );
}

export default function VerifiedPage() {
  return (
    <Suspense>
      <VerifiedContent />
    </Suspense>
  );
}
