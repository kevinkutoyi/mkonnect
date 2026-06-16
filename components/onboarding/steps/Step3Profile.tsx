"use client";
// components/onboarding/steps/Step3Profile.tsx
import type { UseFormReturn } from "react-hook-form";
import type { OnboardingInput } from "@/lib/validations/onboarding";
import { Field, Input, Textarea } from "@/components/onboarding/FormField";
import { PhotoUploader } from "@/components/onboarding/PhotoUploader";
import { useState } from "react";

const LANGUAGES = [
  "English", "Swahili", "Kikuyu", "Luo", "Luhya", "Kamba", "Kalenjin",
  "Meru", "Somali", "Arabic", "French", "Other",
];

interface Props {
  form: UseFormReturn<OnboardingInput>;
}

export function Step3Profile({ form }: Props) {
  const { register, watch, setValue, formState: { errors } } = form;
  const bio = watch("bio") ?? "";
  const langs = watch("languages") ?? [];
  const avatarUrl = watch("avatarUrl") ?? "";
  const [photoError, setPhotoError] = useState<string | null>(null);

  const toggleLang = (lang: string) => {
    setValue(
      "languages",
      langs.includes(lang) ? langs.filter((l) => l !== lang) : [...langs, lang],
      { shouldValidate: true }
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Your profile</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          A strong profile helps clients choose you. Be authentic and detailed.
        </p>
      </div>

      {/* Profile photo */}
      <Field
        label="Profile photo"
        hint="A clear, professional face photo significantly increases bookings."
        error={photoError ?? undefined}
      >
        <PhotoUploader
          value={avatarUrl}
          onChange={(url) => { setValue("avatarUrl", url, { shouldValidate: true }); setPhotoError(null); }}
          onError={setPhotoError}
        />
      </Field>

      {/* Tagline */}
      <Field
        label="Tagline"
        error={errors.tagline?.message}
        hint="A short headline shown on your card in search results (max 160 chars)"
      >
        <div className="relative">
          <Input
            {...register("tagline")}
            placeholder="e.g. Relaxing your body and mind since 2015"
            error={!!errors.tagline}
            maxLength={160}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            {(watch("tagline") ?? "").length}/160
          </span>
        </div>
      </Field>

      {/* Bio */}
      <Field
        label="About you"
        error={errors.bio?.message}
        hint="Describe your experience, training, and approach. Min 80 characters."
        required
      >
        <Textarea
          {...register("bio")}
          rows={6}
          placeholder="Tell clients about your massage training, specialities, and what makes your sessions unique..."
          error={!!errors.bio}
        />
        <div className={`mt-1 text-right text-xs ${bio.length < 80 ? "text-muted-foreground" : "text-green-600"}`}>
          {bio.length}/1000 {bio.length < 80 && `(${80 - bio.length} more to go)`}
        </div>
      </Field>

      {/* Years of experience */}
      <Field
        label="Years of experience"
        error={errors.yearsExperience?.message}
        required
      >
        <Input
          {...register("yearsExperience", { valueAsNumber: true })}
          type="number"
          min={0}
          max={60}
          placeholder="e.g. 5"
          error={!!errors.yearsExperience}
          className="w-32"
        />
      </Field>

      {/* Languages */}
      <Field
        label="Languages you speak"
        error={(errors.languages as any)?.message}
        required
      >
        <div className="flex flex-wrap gap-2">
          {LANGUAGES.map((lang) => {
            const active = langs.includes(lang);
            return (
              <button
                key={lang}
                type="button"
                onClick={() => toggleLang(lang)}
                className={`rounded-full border px-3 py-1 text-sm font-medium transition-colors ${
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:border-primary/40"
                }`}
              >
                {lang}
              </button>
            );
          })}
        </div>
      </Field>
    </div>
  );
}
