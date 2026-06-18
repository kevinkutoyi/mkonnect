"use client";
// components/onboarding/OnboardingWizard.tsx
// Central wizard — owns the form state and routes between steps

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, CheckCircle2, ArrowLeft, ArrowRight } from "lucide-react";

import {
  OnboardingSchema,
  Step1Schema,
  Step2Schema,
  Step3Schema,
  Step4Schema,
  Step5Schema,
  type OnboardingInput,
} from "@/lib/validations/onboarding";

import { StepIndicator } from "./StepIndicator";
import { Step1Personal }   from "./steps/Step1Personal";
import { Step2Location }   from "./steps/Step2Location";
import { Step3Profile }    from "./steps/Step3Profile";
import { Step4Services }   from "./steps/Step4Services";
import { Step5Availability } from "./steps/Step5Availability";

// ─── Types passed from Server Component ──────────────────────────────────────
interface County    { id: number; name: string; slug: string }
interface Category  { id: number; name: string; type: string }

interface Props {
  counties: County[];
  categories: Category[];
  existingProfile: any | null;
  user: { name: string; email: string; phone: string | null };
}

// ─── Step config ──────────────────────────────────────────────────────────────
const STEPS = [
  { label: "Personal",     icon: "👤", schema: Step1Schema },
  { label: "Location",     icon: "📍", schema: Step2Schema },
  { label: "Profile",      icon: "✨", schema: Step3Schema },
  { label: "Services",     icon: "💆", schema: Step4Schema },
  { label: "Availability", icon: "🗓️", schema: Step5Schema },
] as const;

// ─── Build default values from existing DB profile ───────────────────────────
function buildDefaults(user: Props["user"], profile: any): Partial<OnboardingInput> {
  if (!profile) {
    return {
      fullName: user.name,
      email: user.email,
      phone: user.phone ?? "",
      whatsapp: "",
      sameAsPhone: false,
      contactPreference: ["WHATSAPP"],
      languages: [],
      mobileService: false,
      spaService: false,
      availableMon: true,
      availableTue: true,
      availableWed: true,
      availableThu: true,
      availableFri: true,
      availableSat: false,
      availableSun: false,
      availableFrom: "08:00",
      availableTo: "20:00",
      services: [],
    };
  }

  return {
    fullName:          user.name,
    email:             user.email,
    phone:             user.phone ?? "",
    whatsapp:          "",
    sameAsPhone:       false,
    contactPreference: ["WHATSAPP"],
    countyId:          profile.city?.countyId,
    cityId:            profile.cityId,
    neighbourhood:     profile.address ?? "",
    mobileService:     profile.mobileService,
    spaService:        profile.spaService,
    avatarUrl:         profile.avatarUrl ?? "",
    tagline:           profile.tagline ?? "",
    bio:               profile.bio ?? "",
    yearsExperience:   profile.yearsExperience ?? 0,
    languages:         profile.languages ?? [],
    availableMon:      profile.availableMon,
    availableTue:      profile.availableTue,
    availableWed:      profile.availableWed,
    availableThu:      profile.availableThu,
    availableFri:      profile.availableFri,
    availableSat:      profile.availableSat,
    availableSun:      profile.availableSun,
    availableFrom:     profile.availableFrom ?? "08:00",
    availableTo:       profile.availableTo ?? "20:00",
    services:          profile.services?.map((s: any) => ({
      categoryId:      s.categoryId ?? 0,
      name:            s.name,
      description:     s.description ?? "",
      duration:        s.duration,
      price:           Number(s.price),
      requiresDeposit: s.requiresDeposit,
      depositAmount:   s.depositAmount ? Number(s.depositAmount) : undefined,
    })) ?? [],
  };
}

// ─── Component ────────────────────────────────────────────────────────────────
export function OnboardingWizard({ counties, categories, existingProfile, user }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const form = useForm<OnboardingInput>({
    resolver: zodResolver(OnboardingSchema),
    defaultValues: buildDefaults(user, existingProfile) as OnboardingInput,
    mode: "onTouched",
  });

  // ── Validate only the current step's fields before advancing ─────────────
  const validateStep = useCallback(async (): Promise<boolean> => {
    const schema = STEPS[step].schema;
    const values = form.getValues();
    const result = schema.safeParse(values);

    if (!result.success) {
      // Trigger RHF errors for all fields in this step
      const fieldErrors = result.error.flatten().fieldErrors;
      for (const [field, msgs] of Object.entries(fieldErrors)) {
        form.setError(field as any, { message: (msgs as string[])[0] });
      }
      return false;
    }
    return true;
  }, [step, form]);

  const goNext = async () => {
    const valid = await validateStep();
    if (valid) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const goBack = () => {
    setServerError(null);
    setStep((s) => Math.max(s - 1, 0));
  };

  // ── Final submit ─────────────────────────────────────────────────────────
  const onSubmit = async (data: OnboardingInput) => {
    setSubmitting(true);
    setServerError(null);

    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();

      if (!res.ok) {
        if (json.fields) {
          for (const [field, msgs] of Object.entries(json.fields)) {
            form.setError(field as any, { message: (msgs as string[])[0] });
          }
          setServerError("Please fix the errors above.");
        } else {
          setServerError(json.message ?? "Submission failed. Please try again.");
        }
        return;
      }

      setDone(true);
    } catch {
      setServerError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Success screen ────────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="flex flex-col items-center gap-6 py-12 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
          <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Profile complete!</h2>
          <p className="mt-2 text-muted-foreground max-w-sm leading-relaxed">
            Your profile is live. Subscribe to a listing plan from your dashboard to start appearing in search results.
          </p>
        </div>
        <button
          onClick={() => router.push("/dashboard")}
          className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  const isLastStep = step === STEPS.length - 1;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">
          {existingProfile ? "Update your profile" : "Set up your profile"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Complete all steps to list your services on modelsraha.
        </p>
      </div>

      {/* Step indicator */}
      <StepIndicator steps={STEPS as any} current={step} />

      {/* Step content */}
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <div className="min-h-[420px]">
          {step === 0 && <Step1Personal form={form} />}
          {step === 1 && <Step2Location form={form} counties={counties} />}
          {step === 2 && <Step3Profile  form={form} />}
          {step === 3 && <Step4Services form={form} categories={categories} />}
          {step === 4 && <Step5Availability form={form} />}
        </div>

        {/* Server error */}
        {serverError && (
          <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
            {serverError}
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-between">
          <button
            type="button"
            onClick={goBack}
            disabled={step === 0}
            className="flex items-center gap-1.5 rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-muted disabled:invisible transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          {/* Step dots (mobile navigation hint) */}
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === step ? "w-6 bg-primary" : i < step ? "w-1.5 bg-primary/40" : "w-1.5 bg-muted"
                }`}
              />
            ))}
          </div>

          {isLastStep ? (
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? "Submitting…" : "Submit profile"}
            </button>
          ) : (
            <button
              type="button"
              onClick={goNext}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
