// lib/validations/service.ts
import { z } from "zod";

// ─── Studio location sub-schema ───────────────────────────────────────────────
export const StudioLocationSchema = z.object({
  buildingName: z.string().max(120, "Too long").optional(),
  floor:        z.string().max(20,  "Too long").optional(),
  street:       z.string().max(200, "Too long").optional(),
  area:         z.string().max(100, "Area/neighbourhood too long").optional(),
  directions:   z.string().max(500, "Max 500 characters").optional(),
  googleMapsUrl: z
    .string()
    .url("Enter a valid Google Maps URL")
    .optional()
    .or(z.literal("")),
});

export type StudioLocation = z.infer<typeof StudioLocationSchema>;

// ─── Duration presets (minutes) ───────────────────────────────────────────────
export const DURATION_PRESETS = [15, 30, 45, 60, 90, 120, 150, 180, 240, 300, 360] as const;

// ─── Create service ───────────────────────────────────────────────────────────
const CreateServiceBase = z
  .object({
    categoryId: z
      .number({ required_error: "Select a service category" })
      .int()
      .positive("Select a category"),

    name: z
      .string()
      .min(2,   "Service name must be at least 2 characters")
      .max(100, "Service name must be 100 characters or less"),

    description: z
      .string()
      .max(500, "Description must be 500 characters or less")
      .optional(),

    duration: z
      .number({ required_error: "Duration is required", invalid_type_error: "Enter a valid number" })
      .int("Duration must be a whole number")
      .min(15,  "Minimum session length is 15 minutes")
      .max(480, "Maximum session length is 8 hours (480 minutes)"),

    price: z
      .number({ required_error: "Price is required", invalid_type_error: "Enter a valid price" })
      .min(100,   "Minimum price is KES 100")
      .max(99999, "Maximum price is KES 99,999"),

    discountPrice: z
      .number()
      .min(50, "Discount price must be at least KES 50")
      .optional()
      .nullable(),

    // ── Delivery modes ────────────────────────────────────────────────────────
    homeService:  z.boolean().default(false),  // masseuse visits client home
    hotelVisit:   z.boolean().default(false),  // masseuse visits hotel/Airbnb
    studioService: z.boolean().default(false), // client visits masseuse studio

    // ── Studio location (required if studioService = true) ────────────────────
    studioLocation: StudioLocationSchema.optional(),

    // ── Deposit ───────────────────────────────────────────────────────────────
    requiresDeposit: z.boolean().default(false),
    depositAmount: z
      .number()
      .min(50, "Deposit must be at least KES 50")
      .optional()
      .nullable(),

    isActive:  z.boolean().default(true),
    sortOrder: z.number().int().min(0).default(0),
  });

export const CreateServiceSchema = CreateServiceBase
  .refine(
    (d) => d.homeService || d.hotelVisit || d.studioService,
    {
      message: "Select at least one delivery mode (Home, Hotel, or Studio)",
      path: ["homeService"],
    }
  )
  .refine(
    (d) => !d.studioService || (d.studioLocation && d.studioLocation.area),
    {
      message: "Provide at least the area/neighbourhood for your studio",
      path: ["studioLocation", "area"],
    }
  )
  .refine(
    (d) => !d.discountPrice || d.discountPrice < d.price,
    {
      message: "Discount price must be less than the regular price",
      path: ["discountPrice"],
    }
  )
  .refine(
    (d) => !d.requiresDeposit || (d.depositAmount != null && d.depositAmount > 0 && d.depositAmount <= d.price),
    {
      message: "Deposit must be between KES 1 and the full service price",
      path: ["depositAmount"],
    }
  );

// ─── Update service (all fields optional) ─────────────────────────────────────
export const UpdateServiceSchema = CreateServiceBase.partial().extend({
  // When updating delivery mode, re-validate studio location if studioService is being set
});

// ─── Reorder services ─────────────────────────────────────────────────────────
export const ReorderServicesSchema = z.object({
  order: z.array(
    z.object({ id: z.string(), sortOrder: z.number().int().min(0) })
  ).min(1),
});

export type CreateServiceInput  = z.infer<typeof CreateServiceSchema>;
export type UpdateServiceInput  = z.infer<typeof UpdateServiceSchema>;
export type ReorderServicesInput = z.infer<typeof ReorderServicesSchema>;
