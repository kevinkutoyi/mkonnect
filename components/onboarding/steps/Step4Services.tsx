"use client";
// components/onboarding/steps/Step4Services.tsx
import { useFieldArray, type UseFormReturn } from "react-hook-form";
import type { OnboardingInput } from "@/lib/validations/onboarding";
import { Field, Input, Textarea, Select } from "@/components/onboarding/FormField";
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { formatKES } from "@/lib/utils";

interface Category { id: number; name: string; type: string }

interface Props {
  form: UseFormReturn<OnboardingInput>;
  categories: Category[];
}

const DURATION_PRESETS = [
  { label: "30 min",  value: 30 },
  { label: "45 min",  value: 45 },
  { label: "1 hr",    value: 60 },
  { label: "90 min",  value: 90 },
  { label: "2 hr",    value: 120 },
];

function ServiceCard({
  index,
  form,
  categories,
  onRemove,
}: {
  index: number;
  form: UseFormReturn<OnboardingInput>;
  categories: Category[];
  onRemove: () => void;
}) {
  const { register, watch, setValue, formState: { errors } } = form;
  const [expanded, setExpanded] = useState(true);
  const svcErrors = (errors.services as any)?.[index];
  const requiresDeposit = watch(`services.${index}.requiresDeposit`);
  const price = watch(`services.${index}.price`) ?? 0;
  const duration = watch(`services.${index}.duration`) ?? 0;

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      {/* Card header */}
      <div className="flex items-center justify-between px-4 py-3 bg-muted/30">
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="flex flex-1 items-center gap-2 text-sm font-semibold text-left"
        >
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          Service #{index + 1}
          {watch(`services.${index}.name`) && (
            <span className="text-muted-foreground font-normal">
              — {watch(`services.${index}.name`)}
            </span>
          )}
          {price > 0 && (
            <span className="ml-auto mr-2 text-primary font-semibold">{formatKES(price)}</span>
          )}
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="rounded-lg p-1.5 text-destructive hover:bg-destructive/10 transition-colors"
          aria-label="Remove service"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {expanded && (
        <div className="p-4 space-y-4">
          {/* Category */}
          <Field label="Category" error={svcErrors?.categoryId?.message} required>
            <Select
              {...register(`services.${index}.categoryId`, { valueAsNumber: true })}
              placeholder="— Select category —"
              options={categories.map((c) => ({ value: c.id, label: c.name }))}
              error={!!svcErrors?.categoryId}
            />
          </Field>

          {/* Service name */}
          <Field label="Service name" error={svcErrors?.name?.message} required>
            <Input
              {...register(`services.${index}.name`)}
              placeholder="e.g. Swedish Full Body Massage"
              error={!!svcErrors?.name}
            />
          </Field>

          {/* Description */}
          <Field label="Description" error={svcErrors?.description?.message} hint="Optional — up to 300 characters">
            <Textarea
              {...register(`services.${index}.description`)}
              rows={2}
              placeholder="Briefly describe what's included..."
              error={!!svcErrors?.description}
            />
          </Field>

          {/* Duration */}
          <Field label="Duration" error={svcErrors?.duration?.message} required>
            {/* Presets */}
            <div className="mb-2 flex flex-wrap gap-2">
              {DURATION_PRESETS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setValue(`services.${index}.duration`, p.value, { shouldValidate: true })}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    duration === p.value
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Input
                {...register(`services.${index}.duration`, { valueAsNumber: true })}
                type="number"
                min={15}
                max={480}
                placeholder="60"
                error={!!svcErrors?.duration}
                className="w-28"
              />
              <span className="text-sm text-muted-foreground">minutes</span>
            </div>
          </Field>

          {/* Price */}
          <Field label="Price (KES)" error={svcErrors?.price?.message} required>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                KES
              </span>
              <Input
                {...register(`services.${index}.price`, { valueAsNumber: true })}
                type="number"
                min={100}
                placeholder="2500"
                error={!!svcErrors?.price}
                className="pl-14 w-40"
              />
            </div>
          </Field>

          {/* Deposit */}
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              {...register(`services.${index}.requiresDeposit`)}
              className="rounded"
            />
            Require a deposit to confirm bookings
          </label>
          {requiresDeposit && (
            <Field label="Deposit amount (KES)" error={svcErrors?.depositAmount?.message}>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                  KES
                </span>
                <Input
                  {...register(`services.${index}.depositAmount`, { valueAsNumber: true })}
                  type="number"
                  min={1}
                  max={price || undefined}
                  placeholder="500"
                  error={!!svcErrors?.depositAmount}
                  className="pl-14 w-40"
                />
              </div>
            </Field>
          )}
        </div>
      )}
    </div>
  );
}

export function Step4Services({ form, categories }: Props) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "services",
  });

  const servicesError = (form.formState.errors.services as any)?.message
    ?? (form.formState.errors.services as any)?.root?.message;

  const addService = () =>
    append({
      categoryId: 0 as any,
      name: "",
      description: "",
      duration: 60,
      price: 0 as any,
      requiresDeposit: false,
      depositAmount: undefined,
    });

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold">Services offered</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Add the massage services you offer with durations and prices in KES.
        </p>
      </div>

      {servicesError && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {servicesError}
        </p>
      )}

      <div className="space-y-3">
        {fields.map((field, i) => (
          <ServiceCard
            key={field.id}
            index={i}
            form={form}
            categories={categories}
            onRemove={() => remove(i)}
          />
        ))}
      </div>

      {fields.length < 20 && (
        <button
          type="button"
          onClick={addService}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/40 py-3 text-sm font-medium text-primary hover:border-primary hover:bg-primary/5 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add {fields.length === 0 ? "your first" : "another"} service
        </button>
      )}

      {fields.length === 0 && (
        <p className="text-center text-xs text-muted-foreground">
          You need at least one service to proceed.
        </p>
      )}
    </div>
  );
}
