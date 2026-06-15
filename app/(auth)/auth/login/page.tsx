export const dynamic = "force-dynamic";
"use client";
// app/(auth)/auth/login/page.tsx
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { LoginSchema, type LoginInput } from "@/lib/validations/auth";
import type { Metadata } from "next";

// Auth error messages mapped from NextAuth error codes
const AUTH_ERRORS: Record<string, string> = {
  INVALID_CREDENTIALS: "Incorrect email or password.",
  ACCOUNT_BANNED: "Your account has been suspended. Contact support.",
  ACCOUNT_INACTIVE: "Your account is inactive. Contact support.",
  EMAIL_PASSWORD_REQUIRED: "Please enter your email and password.",
  OAuthAccountNotLinked:
    "This email is linked to a Google account. Please sign in with Google.",
  default: "Something went wrong. Please try again.",
};

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";
  const urlError = searchParams.get("error");

  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(
    urlError ? (AUTH_ERRORS[urlError] ?? AUTH_ERRORS.default) : null
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(LoginSchema) });

  const onSubmit = async (data: LoginInput) => {
    setServerError(null);
    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    if (result?.error) {
      setServerError(AUTH_ERRORS[result.error] ?? AUTH_ERRORS.default);
    } else {
      router.push(callbackUrl);
      router.refresh();
    }
  };

  const handleGoogleSignIn = () =>
    signIn("google", { callbackUrl });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sign in to your mconnect account
        </p>
      </div>

      {/* Google */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        className="flex w-full items-center justify-center gap-3 rounded-lg border bg-background px-4 py-2.5 text-sm font-medium shadow-sm hover:bg-muted transition-colors"
      >
        <GoogleIcon />
        Continue with Google
      </button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">or</span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {/* Server error */}
        {serverError && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
            {serverError}
          </div>
        )}

        {/* Email */}
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium">
            Email address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            {...register("email")}
            className={`w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:ring-2 focus:ring-primary ${
              errors.email ? "border-destructive" : ""
            }`}
            placeholder="you@example.com"
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <Link
              href="/auth/forgot-password"
              className="text-xs text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              {...register("password")}
              className={`w-full rounded-lg border bg-background px-3 py-2.5 pr-10 text-sm outline-none transition-colors focus:ring-2 focus:ring-primary ${
                errors.password ? "border-destructive" : ""
              }`}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          )}
        </div>

        {/* Remember me */}
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" {...register("rememberMe")} className="rounded" />
          Remember me for 30 days
        </label>

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
        >
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {isSubmitting ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Don't have an account?{" "}
        <Link href="/auth/register" className="font-medium text-primary hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}
