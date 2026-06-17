"use client";
// components/onboarding/steps/Step2Location.tsx
import { useEffect, useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { OnboardingInput } from "@/lib/validations/onboarding";
import { Field, Input, Select } from "@/components/onboarding/FormField";
import { MapPin } from "lucide-react";

interface County { id: number; name: string; slug: string }
interface City   { id: number; name: string; countyId: number }

interface Props {
  form: UseFormReturn<OnboardingInput>;
  counties: County[];
}

export function Step2Location({ form, counties }: Props) {
  const { register, watch, setValue, formState: { errors } } = form;
  const countyId = watch("countyId");
  const [cities, setCities] = useState<City[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);

  useEffect(() => {
    if (!countyId) { setCities([]); return; }
    setLoadingCities(true);
    fetch(`/api/locations/cities?countyId=${countyId}`)
      .then((r) => r.json())
      .then((data) => { setCities(data); setValue("cityId", 0 as any); })
      .catch(() => setCities([]))
      .finally(() => setLoadingCities(false));
  }, [countyId, setValue]);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold">Your location</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Clients will search for models by county and town.
        </p>
      </div>

      {/* County */}
      <Field label="County" error={errors.countyId?.message} required>
        <Select
          {...register("countyId", { valueAsNumber: true })}
          placeholder="— Select county —"
          options={counties.map((c) => ({ value: c.id, label: c.name }))}
          error={!!errors.countyId}
        />
      </Field>

      {/* Town / City */}
      <Field
        label="Town / City"
        error={errors.cityId?.message}
        hint={!countyId ? "Select a county first" : undefined}
        required
      >
        <Select
          {...register("cityId", { valueAsNumber: true })}
          placeholder={loadingCities ? "Loading towns…" : "— Select town/city —"}
          options={cities.map((c) => ({ value: c.id, label: c.name }))}
          error={!!errors.cityId}
          disabled={!countyId || loadingCities}
        />
      </Field>

      {/* Neighbourhood (optional) */}
      <Field
        label="Neighbourhood / Area"
        error={errors.neighbourhood?.message}
        hint="Optional — helps clients know which part of town you're in (e.g. Westlands, South B)"
      >
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            {...register("neighbourhood")}
            placeholder="e.g. Westlands"
            className="pl-9"
            error={!!errors.neighbourhood}
          />
        </div>
      </Field>

      {/* Service setting */}
      <Field label="Where do you offer your services?" required>
        <div className="grid grid-cols-2 gap-3">
          {[
            { field: "mobileService", icon: "🏠", label: "Home / Hotel visits", sub: "You travel to the client" },
            { field: "spaService",    icon: "🛁", label: "My own space",         sub: "Client comes to you" },
          ].map(({ field, icon, label, sub }) => {
            const checked = Boolean(watch(field as keyof OnboardingInput));
            return (
              <label
                key={field}
                className={`flex cursor-pointer flex-col gap-1 rounded-xl border-2 p-4 transition-colors ${
                  checked ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                }`}
              >
                <input
                  type="checkbox"
                  {...register(field as keyof OnboardingInput)}
                  className="sr-only"
                />
                <span className="text-2xl">{icon}</span>
                <span className="font-semibold text-sm">{label}</span>
                <span className="text-xs text-muted-foreground">{sub}</span>
              </label>
            );
          })}
        </div>
        {!watch("mobileService") && !watch("spaService") && (
          <p className="mt-1.5 text-xs text-destructive">Select at least one service setting</p>
        )}
      </Field>
    </div>
  );
}
