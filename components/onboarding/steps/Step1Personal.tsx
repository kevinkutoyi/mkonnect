"use client";
// components/onboarding/steps/Step1Personal.tsx
import { useEffect } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { OnboardingInput } from "@/lib/validations/onboarding";
import { Field, Input } from "@/components/onboarding/FormField";
import { Phone, Mail, MessageCircle, User } from "lucide-react";

const CONTACT_OPTIONS = [
  { value: "PHONE",    label: "Phone call",   icon: "📞" },
  { value: "WHATSAPP", label: "WhatsApp",      icon: "💬" },
  { value: "EMAIL",    label: "Email",         icon: "✉️" },
] as const;

interface Props {
  form: UseFormReturn<OnboardingInput>;
}

export function Step1Personal({ form }: Props) {
  const { register, watch, setValue, formState: { errors } } = form;
  const phone = watch("phone");
  const sameAsPhone = watch("sameAsPhone");
  const contactPrefs = watch("contactPreference") ?? [];

  // Auto-sync WhatsApp when "same as phone" is checked
  useEffect(() => {
    if (sameAsPhone) setValue("whatsapp", phone, { shouldValidate: true });
  }, [sameAsPhone, phone, setValue]);

  const toggleContact = (val: typeof CONTACT_OPTIONS[number]["value"]) => {
    const current = contactPrefs;
    if (current.includes(val)) {
      setValue("contactPreference", (current as string[]).filter((v: string) => v !== val) as ("PHONE" | "WHATSAPP" | "EMAIL")[], { shouldValidate: true });
    } else {
      setValue("contactPreference", [...current, val], { shouldValidate: true });
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold">Personal information</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Tell clients who you are and how to reach you.
        </p>
      </div>

      {/* Full name */}
      <Field label="Full name" error={errors.fullName?.message} required>
        <div className="relative">
          <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            {...register("fullName")}
            placeholder="Jane Wanjiku"
            className="pl-9"
            error={!!errors.fullName}
            autoComplete="name"
          />
        </div>
      </Field>

      {/* Phone */}
      <Field
        label="Phone number"
        error={errors.phone?.message}
        hint="Kenyan number — e.g. 0712 345 678 or +254712345678"
        required
      >
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            {...register("phone")}
            type="tel"
            placeholder="0712 345 678"
            className="pl-9"
            error={!!errors.phone}
            autoComplete="tel"
          />
        </div>
      </Field>

      {/* WhatsApp */}
      <Field label="WhatsApp number" error={errors.whatsapp?.message} hint="Leave blank if same as phone">
        <label className="mb-2 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            {...register("sameAsPhone")}
            className="rounded"
          />
          Same as phone number
        </label>
        <div className="relative">
          <MessageCircle className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            {...register("whatsapp")}
            type="tel"
            placeholder="0712 345 678"
            className="pl-9"
            disabled={sameAsPhone}
            error={!!errors.whatsapp}
          />
        </div>
      </Field>

      {/* Email */}
      <Field label="Email address" error={errors.email?.message} required>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            {...register("email")}
            type="email"
            placeholder="jane@example.com"
            className="pl-9"
            error={!!errors.email}
            autoComplete="email"
          />
        </div>
      </Field>

      {/* Contact preference */}
      <Field
        label="How should clients contact you?"
        error={(errors.contactPreference as any)?.message}
        required
      >
        <div className="flex flex-wrap gap-3">
          {CONTACT_OPTIONS.map((opt) => {
            const active = contactPrefs.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggleContact(opt.value)}
                className={`flex items-center gap-2 rounded-xl border-2 px-4 py-2.5 text-sm font-medium transition-all ${
                  active
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/40"
                }`}
              >
                <span>{opt.icon}</span>
                {opt.label}
              </button>
            );
          })}
        </div>
      </Field>
    </div>
  );
}
