// lib/validations/tier.ts
import { z } from "zod";

export const UpdateTierSchema = z.object({
  price:        z.number().min(0,  "Price cannot be negative").max(999999),
  durationDays: z.number().int().min(1, "Min 1 day").max(365, "Max 365 days"),
  displayName:  z.string().min(1).max(50).optional(),
  description:  z.string().max(500).optional(),
  badge:        z.string().max(10).optional(),
  perks:        z.array(z.string().max(200)).min(1).max(20).optional(),
  searchBoost:  z.number().int().min(0).max(100).optional(),
  featuredSlots:z.number().int().min(0).max(10).optional(),
  isActive:     z.boolean().optional(),
});

export const SubscribeTierSchema = z.object({
  tierId: z.number().int().positive("Select a valid tier"),
});

export type UpdateTierInput      = z.infer<typeof UpdateTierSchema>;
export type SubscribeTierInput   = z.infer<typeof SubscribeTierSchema>;
