"use client";
// app/(auth)/auth/refresh/page.tsx
// Forces a session token refresh after role changes (e.g. post-Google sign-up),
// then redirects to the intended destination.

import { useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

function RefreshContent() {
  const { update } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const dest = searchParams.get("dest") ?? "/";
  const role = searchParams.get("role");

  useEffect(() => {
    // Push the new role into the JWT, then navigate
    update(role ? { role } : undefined).then(() => {
      router.replace(dest);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );
}

export default function RefreshPage() {
  return (
    <Suspense>
      <RefreshContent />
    </Suspense>
  );
}
