"use client";
// components/onboarding/steps/Step5Availability.tsx
import type { UseFormReturn } from "react-hook-form";
import type { OnboardingInput } from "@/lib/validations/onboarding";
import { Field, Input } from "@/components/onboarding/FormField";
import { Clock } from "lucide-react";

const DAYS: { field: string; short: string; long: string }[] = [
  { field: "availableMon", short: "Mon", long: "Monday" },
  { field: "availableTue", short: "Tue", long: "Tuesday" },
  { field: "availableWed", short: "Wed", long: "Wednesday" },
  { field: "availableThu", short: "Thu", long: "Thursday" },
  { field: "availableFri", short: "Fri", long: "Friday" },
  { field: "availableSat", short: "Sat", long: "Saturday" },
  { field: "availableSun", short: "Sun", long: "Sunday" },
];

const HOUR_PRESETS: { label: string; from: string; to: string }[] = [
  { label: "Morning (8am – 12pm)",    from: "08:00", to: "12:00" },
  { label: "Afternoon (12pm – 6pm)",  from: "12:00", to: "18:00" },
  { label: "Full day (8am – 8pm)",    from: "08:00", to: "20:00" },
  { label: "Evening (4pm – 10pm)",    from: "16:00", to: "22:00" },
];

interface Props {
  form: UseFormReturn<OnboardingInput>;
}

export function Step5Availability({ form }: Props) {
  const { register, watch, setValue, formState: { errors } } = form;
  const from = watch("availableFrom");
  const to = watch("availableTo");

  // Check at least one day selected for the error
  const anyDay = DAYS.some((d) => Boolean(watch(d.field as any)));
  const dayError = !anyDay && (errors as any).availableMon?.message;

  // Weekday / weekend shortcuts
  const setWeekdays = () =>
    DAYS.forEach((d) =>
      setValue(d.field as any, !["availableSat","availableSun"].includes(d.field as string) as any, { shouldValidate: true })
    );
  const setWeekend = () =>
    DAYS.forEach((d) =>
      setValue(d.field as any, ["availableSat","availableSun"].includes(d.field as string) as any, { shouldValidate: true })
    );
  const setAllDays = () =>
    DAYS.forEach((d) => setValue(d.field as any, true as any, { shouldValidate: true }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Working hours</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Let clients know when you're available for bookings.
        </p>
      </div>

      {/* Working days */}
      <Field
        label="Available days"
        error={dayError || undefined}
        required
      >
        {/* Shortcuts */}
        <div className="mb-3 flex flex-wrap gap-2">
          {[
            { label: "Weekdays",    action: setWeekdays },
            { label: "Weekends",    action: setWeekend },
            { label: "Every day",   action: setAllDays },
          ].map(({ label, action }) => (
            <button
              key={label}
              type="button"
              onClick={action}
              className="rounded-full border px-3 py-1 text-xs font-medium hover:bg-muted transition-colors"
            >
              {label}
            </button>
          ))}
        </div>

        {/* Day toggles */}
        <div className="grid grid-cols-7 gap-1.5">
          {DAYS.map(({ field, short, long }) => {
            const active = Boolean(watch(field as any));
            return (
              <label key={field} className="flex flex-col items-center gap-1" title={long}>
                <input
                  type="checkbox"
                  {...register(field as any)}
                  className="sr-only"
                />
                <div
                  className={`flex h-11 w-full cursor-pointer items-center justify-center rounded-xl border-2 text-sm font-semibold transition-all select-none ${
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:border-primary/40 text-muted-foreground"
                  }`}
                  onClick={() => setValue(field, !active as any, { shouldValidate: true })}
                >
                  {short}
                </div>
              </label>
            );
          })}
        </div>
      </Field>

      {/* Time range */}
      <Field label="Working hours" error={errors.availableTo?.message} required>
        {/* Presets */}
        <div className="mb-3 flex flex-wrap gap-2">
          {HOUR_PRESETS.map((p) => {
            const active = from === p.from && to === p.to;
            return (
              <button
                key={p.label}
                type="button"
                onClick={() => {
                  setValue("availableFrom", p.from, { shouldValidate: true });
                  setValue("availableTo",   p.to,   { shouldValidate: true });
                }}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:border-primary/40"
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
            <Input
              {...register("availableFrom")}
              type="time"
              className="w-32"
              error={!!errors.availableFrom}
            />
          </div>
          <span className="text-sm text-muted-foreground">to</span>
          <Input
            {...register("availableTo")}
            type="time"
            className="w-32"
            error={!!errors.availableTo}
          />
        </div>
        {errors.availableFrom && (
          <p className="text-xs text-destructive">{String(errors.availableFrom.message ?? "")}</p>
        )}
      </Field>

      {/* Summary preview */}
      {anyDay && (
        <div className="rounded-xl border bg-muted/40 p-4 text-sm space-y-1">
          <p className="font-semibold">Your schedule preview</p>
          <p className="text-muted-foreground">
            <span className="font-medium text-foreground">
              {DAYS.filter((d) => Boolean(watch(d.field as any))).map((d) => d.short).join(", ")}
            </span>
            {" · "}
            {from} – {to}
          </p>
        </div>
      )}
    </div>
  );
}
