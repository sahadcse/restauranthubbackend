import { z } from "zod";
import { InventoryStatus } from "../../../../prisma/generated/prisma";

// Inventory validation schemas
export const createInventorySchema = z.object({
  menuItemId: z.string().uuid({ message: "Menu item ID must be a valid UUID" }),

  variantId: z
    .string()
    .uuid({ message: "Variant ID must be a valid UUID" })
    .optional(),

  quantity: z.number().int().min(0, { message: "Quantity cannot be negative" }),

  reorderThreshold: z
    .number()
    .int()
    .min(0, { message: "Reorder threshold cannot be negative" }),

  supplierId: z
    .string()
    .uuid({ message: "Supplier ID must be a valid UUID" })
    .optional(),

  restaurantId: z
    .string()
    .uuid({ message: "Restaurant ID must be a valid UUID" }),

  location: z
    .string()
    .min(1, { message: "Location cannot be empty" })
    .max(100, { message: "Location cannot exceed 100 characters" })
    .optional(),
});

export const updateInventorySchema = z.object({
  quantity: z
    .number()
    .int()
    .min(0, { message: "Quantity cannot be negative" })
    .optional(),

  reorderThreshold: z
    .number()
    .int()
    .min(0, { message: "Reorder threshold cannot be negative" })
    .optional(),

  status: z
    .enum([
      InventoryStatus.IN_STOCK,
      InventoryStatus.LOW_STOCK,
      InventoryStatus.OUT_OF_STOCK,
      InventoryStatus.DISCONTINUED,
    ] as const)
    .optional(),

  supplierId: z
    .string()
    .uuid({ message: "Supplier ID must be a valid UUID" })
    .optional(),

  location: z
    .string()
    .min(1, { message: "Location cannot be empty" })
    .max(100, { message: "Location cannot exceed 100 characters" })
    .optional(),
});

export const inventoryAdjustmentSchema = z.object({
  menuItemId: z.string().uuid({ message: "Menu item ID must be a valid UUID" }),

  variantId: z
    .string()
    .uuid({ message: "Variant ID must be a valid UUID" })
    .optional(),

  quantityChange: z
    .number()
    .int()
    .refine((val) => val !== 0, {
      message: "Quantity change cannot be zero",
    }),

  reason: z
    .string()
    .min(3, { message: "Reason must be at least 3 characters long" })
    .max(200, { message: "Reason cannot exceed 200 characters" }),

  notes: z
    .string()
    .max(500, { message: "Notes cannot exceed 500 characters" })
    .optional(),
});

// Supplier validation schemas
export const createSupplierSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Supplier name must be at least 2 characters long" })
    .max(100, { message: "Supplier name cannot exceed 100 characters" })
    .trim(),

  email: z.string().email({ message: "Invalid email format" }),

  phone: z
    .string()
    .regex(/^\+?[0-9]{10,15}$/, {
      message: "Phone number must be between 10-15 digits",
    })
    .optional(),

  address: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      postalCode: z.string().optional(),
      country: z.string().optional(),
    })
    .optional(),

  tenantId: z.string().uuid({ message: "Tenant ID must be a valid UUID" }),
});

export const updateSupplierSchema = createSupplierSchema.partial().extend({
  isActive: z.boolean().optional(),
});

// Query validation schemas
export const inventoryQuerySchema = z.object({
  page: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .refine((val) => val > 0, { message: "Page must be greater than 0" })
    .optional(),

  limit: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .refine((val) => val > 0 && val <= 100, {
      message: "Limit must be between 1 and 100",
    })
    .optional(),

  restaurantId: z
    .string()
    .uuid({ message: "Restaurant ID must be a valid UUID" })
    .optional(),

  menuItemId: z
    .string()
    .uuid({ message: "Menu item ID must be a valid UUID" })
    .optional(),

  status: z
    .enum([
      InventoryStatus.IN_STOCK,
      InventoryStatus.LOW_STOCK,
      InventoryStatus.OUT_OF_STOCK,
      InventoryStatus.DISCONTINUED,
    ] as const)
    .optional(),

  belowThreshold: z
    .string()
    .transform((val) => val === "true")
    .optional(),

  supplierId: z
    .string()
    .uuid({ message: "Supplier ID must be a valid UUID" })
    .optional(),

  location: z.string().optional(),
});

export const supplierQuerySchema = z.object({
  page: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .refine((val) => val > 0, { message: "Page must be greater than 0" })
    .optional(),

  limit: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .refine((val) => val > 0 && val <= 100, {
      message: "Limit must be between 1 and 100",
    })
    .optional(),

  isActive: z
    .string()
    .transform((val) => val === "true")
    .optional(),

  search: z
    .string()
    .min(1, { message: "Search term cannot be empty" })
    .optional(),
});
