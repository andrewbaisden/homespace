import { z } from "zod";

export const propertyCreateSchema = z.object({
  name: z.string().min(1).max(120),
  address: z.string().max(240).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export const propertyUpdateSchema = propertyCreateSchema.partial();

export const roomCreateSchema = z.object({
  name: z.string().min(1).max(80),
  type: z
    .enum([
      "LIVING_ROOM",
      "KITCHEN",
      "DINING_ROOM",
      "BEDROOM",
      "BATHROOM",
      "OFFICE",
      "GARAGE",
      "HALLWAY",
      "OTHER",
    ])
    .default("OTHER"),
  sortOrder: z.number().int().optional(),
});

export const roomUpdateSchema = roomCreateSchema.partial();

export const inventoryItemSchema = z.object({
  name: z.string().min(1).max(120),
  category: z
    .enum([
      "FURNITURE",
      "ELECTRONICS",
      "APPLIANCES",
      "CLOTHING",
      "JEWELRY",
      "ART",
      "TOOLS",
      "SPORTS",
      "BOOKS",
      "KITCHENWARE",
      "OTHER",
    ])
    .default("OTHER"),
  quantity: z.number().int().positive().default(1),
  purchasePricePence: z.number().int().nonnegative().nullable().optional(),
  currentValuePence: z.number().int().nonnegative().nullable().optional(),
  replacementValuePence: z.number().int().nonnegative().default(0),
  purchaseDate: z.string().datetime().nullable().optional(),
  condition: z
    .enum(["NEW", "EXCELLENT", "GOOD", "FAIR", "POOR"])
    .default("GOOD"),
  notes: z.string().max(2000).nullable().optional(),
  serialNumber: z.string().max(120).nullable().optional(),
});

export const inventoryItemUpdateSchema = inventoryItemSchema.partial();

export const inventoryFilterSchema = z.object({
  q: z.string().optional(),
  roomId: z.string().optional(),
  category: z.string().optional(),
  condition: z.string().optional(),
  minValuePence: z.coerce.number().optional(),
  maxValuePence: z.coerce.number().optional(),
  recent: z.coerce.boolean().optional(),
});
