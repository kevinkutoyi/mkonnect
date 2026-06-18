"use client";
// components/onboarding/steps/Step4Services.tsx
import { useState } from "react";
import { type UseFormReturn, useWatch } from "react-hook-form";
import type { OnboardingInput } from "@/lib/validations/onboarding";
import { CheckCircle2, Circle, Plus, X } from "lucide-react";

interface Props {
  form: UseFormReturn<OnboardingInput>;
}

// ─── Predefined services grouped by category ──────────────────────────────────
const SERVICE_GROUPS = [
  {
    label: "Online & Digital",
    items: ["Online chat services", "Voicenotes", "Videocalls"],
  },
  {
    label: "Companionship & Dates",
    items: [
      "Dinner dates",
      "Event companion",
      "Business event companion",
      "Social companion",
      "Fitness companion",
      "Shopping companion",
      "Overnight companion",
      "Weekend companion",
      "Available for couples",
      "Double dates",
      "Private parties",
      "Meet and greet sessions",
    ],
  },
  {
    label: "Intimate Services",
    items: [
      "Massage services",
      "Affectionate companionship",
      "Kissing",
      "Blowjob",
      "Lesbian shows",
      "Rimming",
      "Anal",
      "Roleplay",
    ],
  },
  {
    label: "Modelling & Content",
    items: [
      "Promotional Modelling",
      "Product photography",
      "Glamour Modelling",
      "Custom content requests",
      "Personalized content requests",
    ],
  },
];

export function Step4Services({ form }: Props) {
  const { setValue } = form;
  const offeredServices: string[] = useWatch({ control: form.control, name: "offeredServices" }) ?? [];
  const customServices: string[]  = useWatch({ control: form.control, name: "customServices" }) ?? [];

  const [customInputs, setCustomInputs] = useState<string[]>(
    customServices.length > 0 ? [...customServices] : []
  );

  const toggle = (service: string) => {
    const next = offeredServices.includes(service)
      ? offeredServices.filter((s) => s !== service)
      : [...offeredServices, service];
    setValue("offeredServices", next, { shouldDirty: true });
  };

  const updateCustom = (idx: number, val: string) => {
    const next = [...customInputs];
    next[idx] = val;
    setCustomInputs(next);
    setValue("customServices", next.filter(Boolean), { shouldDirty: true });
  };

  const addCustom = () => {
    if (customInputs.length < 5) setCustomInputs([...customInputs, ""]);
  };

  const removeCustom = (idx: number) => {
    const next = customInputs.filter((_, i) => i !== idx);
    setCustomInputs(next);
    setValue("customServices", next.filter(Boolean), { shouldDirty: true });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Services offered</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Select all services you offer. You can also add up to 5 custom ones at the bottom.
        </p>
      </div>

      {offeredServices.length > 0 && (
        <p className="text-xs font-medium text-primary">
          {offeredServices.length} service{offeredServices.length !== 1 ? "s" : ""} selected
        </p>
      )}

      {/* Grouped checkboxes */}
      <div className="space-y-6">
        {SERVICE_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              {group.label}
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {group.items.map((service) => {
                const checked = offeredServices.includes(service);
                return (
                  <button
                    key={service}
                    type="button"
                    onClick={() => toggle(service)}
                    className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-medium transition-all ${
                      checked
                        ? "border-primary bg-primary/5 text-foreground"
                        : "border-border hover:border-primary/40 hover:bg-muted/40 text-muted-foreground"
                    }`}
                  >
                    {checked ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                    ) : (
                      <Circle className="h-4 w-4 shrink-0 text-muted-foreground/40" />
                    )}
                    {service}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Custom services */}
      <div>
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          Custom Services (up to 5)
        </p>
        <div className="space-y-2">
          {customInputs.map((val, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                type="text"
                value={val}
                onChange={(e) => updateCustom(idx, e.target.value)}
                placeholder={`Custom service ${idx + 1}`}
                maxLength={100}
                className="flex-1 rounded-xl border bg-card px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
              <button
                type="button"
                onClick={() => removeCustom(idx)}
                className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
          {customInputs.length < 5 && (
            <button
              type="button"
              onClick={addCustom}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/30 px-4 py-2.5 text-sm font-medium text-primary hover:border-primary hover:bg-primary/5 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add custom service
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
