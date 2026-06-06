"use client";
// components/services/ServiceForm.tsx
// Create / Edit form — rendered inside a modal

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  X, Loader2, Home, Hotel, MapPin, Clock,
  ChevronDown, CheckCircle2, AlertTriangle,
} from "lucide-react";
import {
  CreateServiceSchema,
  type CreateServiceInput,
  DURATION_PRESETS,
} from "@/lib/validations/service";
import { formatKES, formatDuration } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Category { id: number; name: string; icon: string; type: string }
interface ServiceData extends Partial<CreateServiceInput> { id?: string }

interface ServiceFormProps {
  open:       boolean;
  onClose:    () => void;
  onSaved:    (service: any) => void;
  initial?:   ServiceData;
  categories: Category[];
}

// ─── Small reusable field ─────────────────────────────────────────────────────
function Field({
  label, error, hint, required, children,
}: { label: string; error?: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium">
        {label}{required && <span className="ml-0.5 text-destructive">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

const INPUT_CLS = (err?: boolean) =>
  cn(
    "w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:ring-2 focus:ring-primary placeholder:text-muted-foreground",
    err ? "border-destructive focus:ring-destructive" : "border-input"
  );

// ─── Delivery mode toggle ─────────────────────────────────────────────────────
function DeliveryToggle({
  icon, label, description, checked, onChange, disabled,
}: {
  icon: React.ReactNode; label: string; description: string;
  checked: boolean; onChange: (v: boolean) => void; disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      className={cn(
        "flex items-start gap-3 rounded-xl border-2 p-3 text-left transition-all w-full",
        checked ? "border-primary bg-primary/5" : "border-border hover:border-primary/40",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <div className={cn("mt-0.5 shrink-0", checked ? "text-primary" : "text-muted-foreground")}>
        {icon}
      </div>
      <div>
        <p className={cn("font-medium text-sm", checked && "text-primary")}>{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className={cn(
        "ml-auto mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 transition-colors",
        checked ? "border-primary bg-primary" : "border-muted-foreground"
      )} />
    </button>
  );
}

// ─── Main form ────────────────────────────────────────────────────────────────
export function ServiceForm({ open, onClose, onSaved, initial, categories }: ServiceFormProps) {
  const isEdit = !!initial?.id;
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [showStudio, setShowStudio]   = useState(!!initial?.studioService);

  const {
    register, handleSubmit, watch, setValue,
    reset, formState: { errors },
  } = useForm<CreateServiceInput>({
    resolver: zodResolver(CreateServiceSchema),
    defaultValues: {
      categoryId:      initial?.categoryId      ?? (0 as any),
      name:            initial?.name            ?? "",
      description:     initial?.description     ?? "",
      duration:        initial?.duration        ?? 60,
      price:           initial?.price           ?? (0 as any),
      discountPrice:   initial?.discountPrice   ?? undefined,
      homeService:     initial?.homeService     ?? false,
      hotelVisit:      initial?.hotelVisit      ?? false,
      studioService:   initial?.studioService   ?? false,
      studioLocation:  initial?.studioLocation  ?? {},
      requiresDeposit: initial?.requiresDeposit ?? false,
      depositAmount:   initial?.depositAmount   ?? undefined,
      isActive:        initial?.isActive        ?? true,
      sortOrder:       initial?.sortOrder       ?? 0,
    },
  });

  const price          = watch("price")          ?? 0;
  const duration       = watch("duration")       ?? 60;
  const homeService    = watch("homeService");
  const hotelVisit     = watch("hotelVisit");
  const studioService  = watch("studioService");
  const requiresDeposit = watch("requiresDeposit");
  const description    = watch("description")   ?? "";

  // Track studio visibility
  useEffect(() => setShowStudio(studioService), [studioService]);

  // Reset when modal opens with new initial
  useEffect(() => {
    if (open) {
      reset({
        categoryId:     initial?.categoryId     ?? (0 as any),
        name:           initial?.name           ?? "",
        description:    initial?.description    ?? "",
        duration:       initial?.duration       ?? 60,
        price:          initial?.price          ?? (0 as any),
        discountPrice:  initial?.discountPrice  ?? undefined,
        homeService:    initial?.homeService    ?? false,
        hotelVisit:     initial?.hotelVisit     ?? false,
        studioService:  initial?.studioService  ?? false,
        studioLocation: (initial?.studioLocation as any) ?? {},
        requiresDeposit:initial?.requiresDeposit ?? false,
        depositAmount:  initial?.depositAmount  ?? undefined,
        isActive:       initial?.isActive       ?? true,
        sortOrder:      initial?.sortOrder      ?? 0,
      });
      setServerError(null);
    }
  }, [open, initial]);

  const onSubmit = async (data: CreateServiceInput) => {
    setSubmitting(true);
    setServerError(null);

    const url    = isEdit ? `/api/services/${initial!.id}` : "/api/services";
    const method = isEdit ? "PATCH" : "POST";

    try {
      const res  = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();

      if (!res.ok) {
        if (json.fields) {
          setServerError("Please fix the errors below.");
        } else {
          setServerError(json.error ?? "Something went wrong.");
        }
        return;
      }
      onSaved(json);
      onClose();
    } catch {
      setServerError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  // Group categories by type for optgroups
  const grouped = categories.reduce<Record<string, Category[]>>((acc, c) => {
    if (!acc[c.type]) acc[c.type] = [];
    acc[c.type].push(c);
    return acc;
  }, {});
  const TYPE_LABELS: Record<string, string> = {
    MASSAGE_STYLE: "Massage Styles",
    SPECIALTY:     "Specialties",
    SETTING:       "Settings",
    BODY_AREA:     "Body Areas",
  };

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 px-0 sm:px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full sm:max-w-2xl max-h-[92dvh] overflow-hidden rounded-t-2xl sm:rounded-2xl bg-background shadow-2xl flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4 shrink-0">
          <div>
            <h2 className="text-lg font-bold">{isEdit ? "Edit service" : "Add new service"}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isEdit ? "Update the details below" : "Fill in the service details"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <form
          id="service-form"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="flex-1 overflow-y-auto px-6 py-5 space-y-6"
        >
          {serverError && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              {serverError}
            </div>
          )}

          {/* Category */}
          <Field label="Category" error={errors.categoryId?.message} required>
            <div className="relative">
              <select
                {...register("categoryId", { valueAsNumber: true })}
                className={INPUT_CLS(!!errors.categoryId)}
              >
                <option value={0}>— Select a category —</option>
                {["MASSAGE_STYLE","SPECIALTY","SETTING","BODY_AREA"].map((type) =>
                  grouped[type] ? (
                    <optgroup key={type} label={TYPE_LABELS[type]}>
                      {grouped[type].map((c) => (
                        <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                      ))}
                    </optgroup>
                  ) : null
                )}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </Field>

          {/* Name */}
          <Field label="Service name" error={errors.name?.message} required>
            <input
              {...register("name")}
              placeholder="e.g. Swedish Full Body Massage"
              className={INPUT_CLS(!!errors.name)}
            />
          </Field>

          {/* Description */}
          <Field
            label="Description"
            error={errors.description?.message}
            hint="Optional — up to 500 characters"
          >
            <textarea
              {...register("description")}
              rows={3}
              placeholder="What's included in this session? Any special techniques?"
              className={cn(INPUT_CLS(!!errors.description), "resize-none")}
            />
            <span className={cn(
              "block text-right text-xs mt-1",
              description.length > 450 ? "text-amber-500" : "text-muted-foreground"
            )}>
              {description.length}/500
            </span>
          </Field>

          {/* Duration */}
          <Field label="Duration" error={errors.duration?.message} required>
            <div className="space-y-2">
              {/* Preset pills */}
              <div className="flex flex-wrap gap-2">
                {DURATION_PRESETS.map((min) => (
                  <button
                    key={min}
                    type="button"
                    onClick={() => setValue("duration", min, { shouldValidate: true })}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                      duration === min
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border hover:border-primary/40"
                    )}
                  >
                    {formatDuration(min)}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                <input
                  {...register("duration", { valueAsNumber: true })}
                  type="number"
                  min={15}
                  max={480}
                  placeholder="60"
                  className={cn(INPUT_CLS(!!errors.duration), "w-28")}
                />
                <span className="text-sm text-muted-foreground">minutes</span>
              </div>
            </div>
          </Field>

          {/* Price */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Price (KES)" error={errors.price?.message} required>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                  KES
                </span>
                <input
                  {...register("price", { valueAsNumber: true })}
                  type="number"
                  min={100}
                  placeholder="2500"
                  className={cn(INPUT_CLS(!!errors.price), "pl-14")}
                />
              </div>
              {price >= 100 && (
                <p className="text-xs text-primary font-medium">{formatKES(price)}</p>
              )}
            </Field>

            <Field
              label="Discount price (optional)"
              error={errors.discountPrice?.message}
              hint="Leave blank if no discount"
            >
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                  KES
                </span>
                <input
                  {...register("discountPrice", {
                    setValueAs: (v) => (v === "" || v == null ? null : Number(v)),
                  })}
                  type="number"
                  min={50}
                  placeholder="Optional"
                  className={cn(INPUT_CLS(!!errors.discountPrice), "pl-14")}
                />
              </div>
            </Field>
          </div>

          {/* ── Delivery modes ─────────────────────────────────────────────── */}
          <Field
            label="Where do you offer this service?"
            error={(errors as any).homeService?.message}
            required
          >
            <div className="space-y-2">
              <DeliveryToggle
                icon={<Home className="h-5 w-5" />}
                label="Home visit"
                description="You travel to the client's home or apartment"
                checked={homeService}
                onChange={(v) => setValue("homeService", v, { shouldValidate: true })}
              />
              <DeliveryToggle
                icon={<Hotel className="h-5 w-5" />}
                label="Hotel / Airbnb visit"
                description="You travel to the client's hotel or short-stay property"
                checked={hotelVisit}
                onChange={(v) => setValue("hotelVisit", v, { shouldValidate: true })}
              />
              <DeliveryToggle
                icon={<MapPin className="h-5 w-5" />}
                label="Studio / Spa"
                description="Client comes to your space"
                checked={studioService}
                onChange={(v) => setValue("studioService", v, { shouldValidate: true })}
              />
            </div>
          </Field>

          {/* Studio location sub-form */}
          {showStudio && (
            <div className="rounded-xl border bg-muted/30 p-4 space-y-4">
              <p className="text-sm font-semibold flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-primary" />
                Studio location
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Building name" error={errors.studioLocation?.buildingName?.message}>
                  <input
                    {...register("studioLocation.buildingName")}
                    placeholder="e.g. Westgate Mall"
                    className={INPUT_CLS(!!errors.studioLocation?.buildingName)}
                  />
                </Field>
                <Field label="Floor / Room">
                  <input
                    {...register("studioLocation.floor")}
                    placeholder="e.g. 3rd Floor, Suite 12"
                    className={INPUT_CLS()}
                  />
                </Field>
              </div>

              <Field label="Street address">
                <input
                  {...register("studioLocation.street")}
                  placeholder="e.g. Westlands Road"
                  className={INPUT_CLS()}
                />
              </Field>

              <Field
                label="Area / Neighbourhood"
                error={errors.studioLocation?.area?.message}
                required
              >
                <input
                  {...register("studioLocation.area")}
                  placeholder="e.g. Westlands, Nairobi"
                  className={INPUT_CLS(!!errors.studioLocation?.area)}
                />
              </Field>

              <Field label="Directions for clients" hint="Landmarks, parking info, etc.">
                <textarea
                  {...register("studioLocation.directions")}
                  rows={2}
                  placeholder="Turn left at the Shell petrol station, grey building…"
                  className={cn(INPUT_CLS(), "resize-none")}
                />
              </Field>

              <Field
                label="Google Maps link"
                error={errors.studioLocation?.googleMapsUrl?.message}
                hint="Optional but highly recommended"
              >
                <input
                  {...register("studioLocation.googleMapsUrl")}
                  type="url"
                  placeholder="https://maps.google.com/..."
                  className={INPUT_CLS(!!errors.studioLocation?.googleMapsUrl)}
                />
              </Field>
            </div>
          )}

          {/* Deposit */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                {...register("requiresDeposit")}
                className="rounded"
              />
              Require a deposit to confirm bookings
            </label>
            {requiresDeposit && (
              <Field
                label="Deposit amount (KES)"
                error={errors.depositAmount?.message}
                hint="Must be less than or equal to the service price"
              >
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                    KES
                  </span>
                  <input
                    {...register("depositAmount", {
                      setValueAs: (v) => (v === "" || v == null ? null : Number(v)),
                    })}
                    type="number"
                    min={50}
                    max={price || undefined}
                    placeholder="500"
                    className={cn(INPUT_CLS(!!errors.depositAmount), "pl-14 w-40")}
                  />
                </div>
              </Field>
            )}
          </div>

          {/* Active toggle */}
          <label className="flex items-center justify-between rounded-xl border bg-card px-4 py-3 cursor-pointer">
            <div>
              <p className="text-sm font-medium">Service is active</p>
              <p className="text-xs text-muted-foreground">Inactive services are hidden from your profile</p>
            </div>
            <input
              type="checkbox"
              {...register("isActive")}
              className="h-4 w-4 rounded"
            />
          </label>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-between border-t px-6 py-4 shrink-0 bg-background">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="service-form"
            disabled={submitting}
            className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitting ? "Saving…" : isEdit ? "Save changes" : "Add service"}
          </button>
        </div>
      </div>
    </div>
  );
}
