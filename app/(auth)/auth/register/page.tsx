"use client";
// app/(auth)/auth/register/page.tsx
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { RegisterSchema, type RegisterInput } from "@/lib/validations/auth";

type RegistrationStep = "form" | "success";

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [step, setStep] = useState<RegistrationStep>("form");
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: { role: "VISITOR" },
  });

  const password = watch("password", "");
  const role = watch("role");

  // Password strength checks
  const checks = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^a-zA-Z0-9]/.test(password),
  };
  const strengthPct =
    (Object.values(checks).filter(Boolean).length / 4) * 100;

  const onSubmit = async (data: RegisterInput) => {
    setServerError(null);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();

    if (!res.ok) {
      if (res.status === 409) {
        setServerError("An account with this email already exists.");
      } else if (json.fields) {
        // Field errors already handled by RHF
        setServerError("Please fix the errors above.");
      } else {
        setServerError(json.message ?? "Something went wrong. Please try again.");
      }
      return;
    }

    setStep("success");
  };

  if (step === "success") {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
          <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>
        <h1 className="text-2xl font-bold">Check your email</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          We've sent a verification link to your email address.
          Click the link to activate your account.
        </p>
        <p className="text-xs text-muted-foreground">
          Didn't receive it?{" "}
          <button className="text-primary hover:underline">Resend verification email</button>
        </p>
        <Link
          href="/auth/login"
          className="block rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 text-center transition-colors"
        >
          Go to login
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create an account</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Join Kenya's professional massage marketplace
        </p>
      </div>

      {/* Role selector */}
      <div className="grid grid-cols-2 gap-3">
        {(["VISITOR", "MASSEUSE"] as const).map((r) => (
          <label
            key={r}
            className={`flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border-2 p-4 text-center text-sm transition-colors ${
              role === r
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/40"
            }`}
          >
            <input type="radio" value={r} {...register("role")} className="sr-only" />
            <span className="text-2xl">{r === "VISITOR" ? "🛁" : "💆"}</span>
            <span className="font-semibold">{r === "VISITOR" ? "Client" : "Model"}</span>
            <span className="text-xs text-muted-foreground leading-tight">
              {r === "VISITOR" ? "Book massage sessions" : "Offer massage services"}
            </span>
          </label>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {serverError && (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
            <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
            {serverError}
          </div>
        )}

        {/* Name */}
        <div className="space-y-1.5">
          <label htmlFor="name" className="text-sm font-medium">Full name</label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            {...register("name")}
            className={`w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary ${errors.name ? "border-destructive" : ""}`}
            placeholder="Jane Wanjiku"
          />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium">Email address</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            {...register("email")}
            className={`w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary ${errors.email ? "border-destructive" : ""}`}
            placeholder="jane@example.com"
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <label htmlFor="password" className="text-sm font-medium">Password</label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              {...register("password")}
              className={`w-full rounded-lg border bg-background px-3 py-2.5 pr-10 text-sm outline-none focus:ring-2 focus:ring-primary ${errors.password ? "border-destructive" : ""}`}
              placeholder="Min 8 characters"
            />
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {/* Strength bar */}
          {password.length > 0 && (
            <div className="space-y-2">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full transition-all ${
                    strengthPct <= 25 ? "bg-destructive" :
                    strengthPct <= 50 ? "bg-orange-400" :
                    strengthPct <= 75 ? "bg-yellow-400" : "bg-green-500"
                  }`}
                  style={{ width: `${strengthPct}%` }}
                />
              </div>
              <ul className="grid grid-cols-2 gap-x-4 gap-y-1">
                {[
                  { key: "length", label: "8+ characters" },
                  { key: "upper",  label: "Uppercase letter" },
                  { key: "number", label: "Number" },
                  { key: "special",label: "Special character" },
                ].map(({ key, label }) => (
                  <li key={key} className={`flex items-center gap-1 text-xs ${checks[key as keyof typeof checks] ? "text-green-600" : "text-muted-foreground"}`}>
                    {checks[key as keyof typeof checks]
                      ? <CheckCircle2 className="h-3 w-3" />
                      : <span className="h-3 w-3 rounded-full border border-current inline-block" />}
                    {label}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>

        {/* Confirm Password */}
        <div className="space-y-1.5">
          <label htmlFor="confirmPassword" className="text-sm font-medium">Confirm password</label>
          <div className="relative">
            <input
              id="confirmPassword"
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
              {...register("confirmPassword")}
              className={`w-full rounded-lg border bg-background px-3 py-2.5 pr-10 text-sm outline-none focus:ring-2 focus:ring-primary ${errors.confirmPassword ? "border-destructive" : ""}`}
              placeholder="Repeat password"
            />
            <button
              type="button"
              onClick={() => setShowConfirm((p) => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              tabIndex={-1}
            >
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
          )}
        </div>

        {/* Terms */}
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" {...register("agreeToTerms")} className="mt-0.5 rounded" />
          <span className="text-muted-foreground leading-snug">
            I agree to modelsraha's{" "}
            <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link>
            {" "}and{" "}
            <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
          </span>
        </label>
        {errors.agreeToTerms && (
          <p className="text-xs text-destructive">{errors.agreeToTerms.message}</p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
        >
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {isSubmitting ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/auth/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
