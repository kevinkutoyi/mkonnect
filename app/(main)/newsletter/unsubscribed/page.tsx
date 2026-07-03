// app/(main)/newsletter/unsubscribed/page.tsx
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Unsubscribed — modelsraha" };

export default function UnsubscribedPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
          <CheckCircle2 className="h-7 w-7 text-green-600 dark:text-green-400" />
        </div>
        <h1 className="text-2xl font-bold">You've been unsubscribed</h1>
        <p className="mt-2 text-muted-foreground">
          You won't receive any more newsletter emails from modelsraha.
          You'll still receive important account and transactional emails.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Back to modelsraha
        </Link>
      </div>
    </div>
  );
}
