// lib/validations/onboarding.ts
import { z } from "zod";

// ─── Reusable field rules ─────────────────────────────────────────────────────

const kenyanPhone = z
  .string()
  .min(1, "Phone number is required")
  .regex(
    /^(\+254|0)(7\d{8}|1\d{8})$/,
    "Enter a valid Kenyan phone number (e.g. 0712 345678 or +254712345678)"
  )
  .transform((v) =>
    // Normalise to +254 format
    v.startsWith("0") ? "+254" + v.slice(1) : v
  );

const optionalPhone = z
  .string()
  .optional()
  .refine(
    (v) => !v || /^(\+254|0)(7\d{8}|1\d{8})$/.test(v),
    "Enter a valid Kenyan phone number"
  )
  .transform((v) => {
    if (!v) return v;
    return v.startsWith("0") ? "+254" + v.slice(1) : v;
  });

// ─── Step 1 — Personal Info ───────────────────────────────────────────────────
export const Step1Schema = z.object({
  fullName: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name is too long")
    .regex(/^[a-zA-Z\s'\-]+$/, "Full name may only contain letters, spaces, hyphens and apostrophes"),
  phone: kenyanPhone,
  whatsapp: optionalPhone,
  sameAsPhone: z.boolean().default(false),
  email: z
    .string()
    .email("Enter a valid email address")
    .min(1, "Email is required"),
  contactPreference: z
    .array(z.enum(["PHONE", "WHATSAPP", "EMAIL"]))
    .min(1, "Select at least one contact preference"),
});

// ─── Step 2 — Location ───────────────────────────────────────────────────────
export const Step2Schema = z.object({
  countyId: z
    .number({ required_error: "Please select a county" })
    .int()
    .positive("Please select a county"),
  cityId: z
    .number({ required_error: "Please select a town/city" })
    .int()
    .positive("Please select a town/city"),
  neighbourhood: z
    .string()
    .max(100, "Neighbourhood too long")
    .optional(),
});

// ─── Step 3 — Profile & Bio ──────────────────────────────────────────────────
export const Step3Schema = z.object({
  avatarUrl: z
    .string()
    .url("Invalid photo URL")
    .optional()
    .or(z.literal("")),
  tagline: z
    .string()
    .max(160, "Tagline must be 160 characters or less")
    .optional(),
  bio: z
    .string()
    .min(80, "Bio must be at least 80 characters — tell clients about yourself")
    .max(1000, "Bio must be 1,000 characters or less"),
  yearsExperience: z
    .number({ required_error: "Years of experience is required", invalid_type_error: "Enter a valid number" })
    .int("Must be a whole number")
    .min(0, "Cannot be negative")
    .max(60, "Please enter a realistic value"),
  languages: z
    .array(z.string())
    .min(1, "Select at least one language"),
  mobileService: z.boolean().default(false),
  spaService: z.boolean().default(false),
});

// ─── Step 4 — Services ───────────────────────────────────────────────────────
export const Step4Schema = z.object({
  offeredServices: z.array(z.string()).default([]),
  customServices: z
    .array(z.string().trim().max(100, "Max 100 characters per service"))
    .max(5, "Maximum 5 custom services")
    .default([]),
});

// ─── Step 5 — Availability & Preferences ────────────────────────────────────
const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/; // HH:MM 24-hour

export const Step5Schema = z
  .object({
    availableMon: z.boolean().default(false),
    availableTue: z.boolean().default(false),
    availableWed: z.boolean().default(false),
    availableThu: z.boolean().default(false),
    availableFri: z.boolean().default(false),
    availableSat: z.boolean().default(false),
    availableSun: z.boolean().default(false),
    availableFrom: z
      .string()
      .regex(TIME_REGEX, "Use HH:MM format (e.g. 08:00)")
      .default("08:00"),
    availableTo: z
      .string()
      .regex(TIME_REGEX, "Use HH:MM format (e.g. 20:00)")
      .default("20:00"),
  })
  .refine(
    (d) =>
      [d.availableMon, d.availableTue, d.availableWed, d.availableThu, d.availableFri, d.availableSat, d.availableSun].some(Boolean),
    { message: "Select at least one working day", path: ["availableMon"] }
  )
  .refine(
    (d) => d.availableFrom < d.availableTo,
    { message: "Start time must be before end time", path: ["availableTo"] }
  );

// ─── Combined full schema ─────────────────────────────────────────────────────
export const OnboardingSchema = Step1Schema
  .merge(Step2Schema)
  .merge(Step3Schema)
  .merge(Step4Schema)
  .merge(Step5Schema);

export type OnboardingInput  = z.infer<typeof OnboardingSchema>;
export type Step1Input       = z.infer<typeof Step1Schema>;
export type Step2Input       = z.infer<typeof Step2Schema>;
export type Step3Input       = z.infer<typeof Step3Schema>;
export type Step4Input       = z.infer<typeof Step4Schema>;
export type Step5Input       = z.infer<typeof Step5Schema>;
