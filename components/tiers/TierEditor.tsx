"use client";
// components/tiers/TierEditor.tsx
// Admin inline editor for a single tier card

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Check, X, Loader2, Plus, Trash2 } from "lucide-react";
import { UpdateTierSchema, type UpdateTierInput } from "@/lib/validations/tier";
import { formatKES } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { TierName } from "@prisma/client";

interface TierData {
  id: number;
  name: TierName;
  displayName: string;
  price: string | number;
  durationDays: number;
  badge: string;
  description: string;
  perks: string[];
  searchBoost: number;
  featuredSlots: number;
  isActive: boolean;
  activeSubscriptions: number;
  totalRevenue: number;
  totalSubscriptions: number;
}

interface TierEditorProps {
  tier:      TierData;
  onUpdated: (updated: TierData) => void;
}

const ACCENT: Record<TierName, string> = {
  REGULAR: "border-l-green-500",
  VIP:     "border-l-blue-500",
  PREMIUM: "border-l-purple-500",
  VVIP:    "border-l-amber-500",
};

export function TierEditor({ tier, onUpdated }: TierEditorProps) {
  const [editing,  setEditing]  = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [saveErr,  setSaveErr]  = useState<string | null>(null);

  const {
    register, handleSubmit, watch, setValue,
    reset, formState: { errors, isDirty },
  } = useForm<UpdateTierInput>({
    resolver: zodResolver(UpdateTierSchema),
    defaultValues: {
      price:         Number(tier.price),
      durationDays:  tier.durationDays,
      displayName:   tier.displayName,
      description:   tier.description ?? "",
      badge:         tier.badge ?? "",
      perks:         tier.perks as string[],
      searchBoost:   tier.searchBoost,
      featuredSlots: tier.featuredSlots,
      isActive:      tier.isActive,
    },
  });

  const perks = watch("perks") as string[];

  const onSubmit = async (data: UpdateTierInput) => {
    setSaving(true);
    setSaveErr(null);
    const res  = await fetch(`/api/admin/tiers/${tier.id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) {
      setSaveErr(json.error ?? "Save failed.");
      setSaving(false);
      return;
    }
    onUpdated({ ...tier, ...json });
    setSaving(false);
    setEditing(false);
  };

  const handleCancel = () => { reset(); setEditing(false); setSaveErr(null); };

  const addPerk  = () => setValue("perks", [...perks, ""], { shouldDirty: true });
  const removePerk = (i: number) =>
    setValue("perks", perks.filter((_, idx) => idx !== i), { shouldDirty: true });

  return (
    <div className={cn("rounded-xl border-l-4 border border-border bg-card", ACCENT[tier.name])}>
      {/* Header row */}
      <div className="flex items-center justify-between px-5 py-4 border-b">
        <div className="flex items-center gap-3">
          <span className="text-xl">{tier.badge}</span>
          <div>
            <h3 className="font-bold">{tier.displayName}</h3>
            <p className="text-xs text-muted-foreground">{tier.name}</p>
          </div>
          {!tier.isActive && (
            <span className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground">Inactive</span>
          )}
        </div>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" /> Edit
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
            >
              <X className="h-3.5 w-3.5" /> Cancel
            </button>
            <button
              type="submit"
              form={`tier-form-${tier.id}`}
              disabled={saving || !isDirty}
              className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 divide-x border-b">
        {[
          { label: "Active subs",  value: tier.activeSubscriptions },
          { label: "Total subs",   value: tier.totalSubscriptions  },
          { label: "Revenue",      value: `KES ${Number(tier.totalRevenue).toLocaleString()}` },
        ].map(({ label, value }) => (
          <div key={label} className="px-4 py-3 text-center">
            <p className="text-lg font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* View mode */}
      {!editing && (
        <div className="px-5 py-4 space-y-3 text-sm">
          <div className="flex flex-wrap gap-x-8 gap-y-2">
            <div><span className="text-muted-foreground">Price:</span> <strong>{formatKES(tier.price)}</strong></div>
            <div><span className="text-muted-foreground">Duration:</span> <strong>{tier.durationDays} days</strong></div>
            <div><span className="text-muted-foreground">Search boost:</span> <strong>+{tier.searchBoost}</strong></div>
            <div><span className="text-muted-foreground">Featured slots:</span> <strong>{tier.featuredSlots}</strong></div>
          </div>
          <div>
            <p className="text-muted-foreground text-xs mb-1.5">Perks</p>
            <ul className="space-y-1">
              {(tier.perks as string[]).map((p, i) => (
                <li key={i} className="flex items-center gap-2 text-xs">
                  <Check className="h-3 w-3 text-primary shrink-0" /> {p}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Edit form */}
      {editing && (
        <form id={`tier-form-${tier.id}`} onSubmit={handleSubmit(onSubmit)} className="px-5 py-4 space-y-4">
          {saveErr && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{saveErr}</p>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Price */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Price (KES)</label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-semibold">KES</span>
                <input
                  {...register("price", { valueAsNumber: true })}
                  type="number"
                  min={0}
                  className="w-full rounded-lg border bg-background pl-10 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
            </div>

            {/* Duration */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Duration (days)</label>
              <input
                {...register("durationDays", { valueAsNumber: true })}
                type="number"
                min={1}
                max={365}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
              {errors.durationDays && <p className="text-xs text-destructive">{errors.durationDays.message}</p>}
            </div>

            {/* Search boost */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Search boost</label>
              <input
                {...register("searchBoost", { valueAsNumber: true })}
                type="number"
                min={0}
                max={100}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Featured slots */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Featured slots</label>
              <input
                {...register("featuredSlots", { valueAsNumber: true })}
                type="number"
                min={0}
                max={10}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Description</label>
            <input
              {...register("description")}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              placeholder="Short description shown on tier card"
            />
          </div>

          {/* Perks */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-muted-foreground">Perks (bullet list)</label>
              <button type="button" onClick={addPerk}
                className="flex items-center gap-1 text-xs text-primary hover:underline">
                <Plus className="h-3 w-3" /> Add perk
              </button>
            </div>
            <div className="space-y-2">
              {perks.map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    {...register(`perks.${i}`)}
                    className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                    placeholder={`Perk ${i + 1}`}
                  />
                  <button type="button" onClick={() => removePerk(i)}
                    className="rounded-lg p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Active toggle */}
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register("isActive")} className="rounded" />
            Tier is active (visible to masseuses)
          </label>
        </form>
      )}
    </div>
  );
}
