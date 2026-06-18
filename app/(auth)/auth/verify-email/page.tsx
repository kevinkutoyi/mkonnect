"use client";
// app/(auth)/auth/verify-email/page.tsx
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, AlertTriangle, MailCheck, Loader2 } from "lucide-react";
import { useState, Suspense } from "react";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const success = searchParams.get("success");
  const error = searchParams.get("error");
  const [resent, setResent] = useState(false);
  const [resending, setResending] = useState(false);

  const handleResend = async () => {
    setResending(true);
    const email = prompt("Enter your email address to resend verification:");
    if (!email) { setResending(false); return; }
    await fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setResent(true);
    setResending(false);
  };

  // Verification success
  if (success) {
    return (
      <div className="space-y-5 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
          <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Email verified!</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your email address has been confirmed. You're all set — welcome to modelsraha!
          </p>
        </div>
        <Link
          href="/auth/login"
          className="block rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 text-center transition-colors"
        >
          Sign in to your account
        </Link>
      </div>
    );
  }

  // Token error
  if (error) {
    const messages: Record<string, string> = {
      TOKEN_INVALID: "This verification link is invalid.",
      TOKEN_EXPIRED: "This verification link has expired. Please request a new one.",
      TOKEN_ALREADY_USED: "This verification link has already been used.",
      TOKEN_MISSING: "No verification token was provided.",
    };
    return (
      <div className="space-y-5 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-8 w-8 text-destructive" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Verification failed</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {messages[error] ?? "Something went wrong with your verification link."}
          </p>
        </div>
        {resent ? (
          <p className="text-sm text-green-600">New verification email sent!</p>
        ) : (
          <button
            onClick={handleResend}
            disabled={resending}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
          >
            {resending && <Loader2 className="h-4 w-4 animate-spin" />}
            Resend verification email
          </button>
        )}
        <Link href="/auth/login" className="block text-sm text-primary hover:underline">
          Back to login
        </Link>
      </div>
    );
  }

  // Pending state — user just registered, shown after redirect
  return (
    <div className="space-y-5 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        <MailCheck className="h-8 w-8 text-primary" />
      </div>
      <div>
        <h1 className="text-2xl font-bold">Verify your email</h1>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          We've sent a verification link to your email address.
          Click it to activate your account. The link expires in 24 hours.
        </p>
      </div>
      {resent ? (
        <p className="text-sm text-green-600">Verification email resent!</p>
      ) : (
        <button
          onClick={handleResend}
          disabled={resending}
          className="text-sm text-primary hover:underline disabled:opacity-60"
        >
          {resending ? "Sending…" : "Resend verification email"}
        </button>
      )}
      <Link href="/auth/login" className="block text-sm text-muted-foreground hover:underline">
        Already verified? Sign in
      </Link>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}
