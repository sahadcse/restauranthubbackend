import { z } from "zod";
import {
  WeightUnit,
  InventoryStatus,
} from "../../../../prisma/generated/prisma";

// Helper validation schemas for reusable components
const locationSchema = z.object({
  latitude: z
    .number()
    .min(-90, { message: "Latitude must be between -90 and 90" })
    .max(90, { message: "Latitude must be between -90 and 90" }),
  longitude: z
    .number()
    .min(-180, { message: "Longitude must be between -180 and 180" })
    .max(180, { message: "Longitude must be between -180 and 180" }),
  formattedAddress: z.string().optional(),
  placeId: z.string().optional(),
});

const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

// Fixed business day schema to use superRefine for context
const businessDaySchema = z
  .object({
    isOpen: z.boolean(),
    openTime: z.string().regex(timeRegex).optional(),
    closeTime: z.string().regex(timeRegex).optional(),
  })
  .superRefine((data, ctx) => {
    // Handle open time validation
    if (data.isOpen && !data.openTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Open time is required when open",
        path: ["openTime"],
      });
    }

    // Handle close time validation
    if (data.isOpen && !data.closeTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Close time is required when open",
        path: ["closeTime"],
      });
    }

    return z.NEVER;
  });

const businessHoursSchema = z.object({
  monday: businessDaySchema,
  tuesday: businessDaySchema,
  wednesday: businessDaySchema,
  thursday: businessDaySchema,
  friday: businessDaySchema,
  saturday: businessDaySchema,
  sunday: businessDaySchema,
});

// Updated helper function to parse JSON string or pass through object
const parseJsonIfString = <T extends z.ZodTypeAny>(schema: T) => {
  return z.preprocess(
    (value) => {
      if (typeof value === "string") {
        try {
          return JSON.parse(value);
        } catch (e) {
          return value; // Return original value to let schema validation fail properly
        }
      }
      return value;
    },
    z.union([
      schema,
      z.string().transform((val) => {
        try {
          return JSON.parse(val);
        } catch {
          // Let schema validation fail
          return val;
        }
      }),
    ])
  );
};

// Restaurant validation schemas
export const createRestaurantSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Restaurant name must be at least 2 characters long" })
    .max(100, { message: "Restaurant name cannot exceed 100 characters" })
    .trim(),

  imageUrl: z.string().url({ message: "Invalid image URL format" }),

  restaurantPageUrl: z
    .string()
    .url({ message: "Invalid restaurant page URL format" })
    .nullable()
    .optional(),

  phone: z.string().regex(/^\+?[0-9]{10,15}$/, {
    message: "Phone number must be between 10-15 digits",
  }),

  email: z.string().email({ message: "Invalid email format" }),

  address: z
    .string()
    .min(5, { message: "Address must be at least 5 characters long" })
    .max(200, { message: "Address cannot exceed 200 characters" })
    .trim(),

  description: z
    .string()
    .min(10, { message: "Description must be at least 10 characters long" })
    .trim(),

  timezone: z.string(),

  currency: z
    .string()
    .length(3, { message: "Currency code must be 3 characters (ISO format)" }),

  location: parseJsonIfString(locationSchema),

  businessHours: parseJsonIfString(businessHoursSchema),

  brandId: z
    .string()
    .uuid({ message: "Brand ID must be a valid UUID" })
    .nullable()
    .optional(),

  /**
   * Customizable UI theme configuration (colors, fonts, etc.)
   * Stored as a flexible JSON object to accommodate different theme structures
   */
  theme: z.record(z.any()).nullable().optional(),

  /**
   * Configuration for delivery fee calculation
   * Can include distance-based fees, minimum order thresholds, etc.
   */
  deliveryFeeStructure: z.record(z.any()).nullable().optional(),

  /**
   * Indicates if the restaurant is currently operational
   * Controls visibility in search results and ability to accept orders
   */
  isActive: z.boolean().default(true),
});

/**
 * Schema for updating an existing restaurant
 * Makes all fields from createRestaurantSchema optional and requires a valid UUID
 * Allows partial updates without requiring all fields to be present
 */
export const updateRestaurantSchema = createRestaurantSchema.partial().extend({
  id: z.string().uuid({ message: "Restaurant ID must be a valid UUID" }),
});

/**
 * Schema for creating a menu
 * Defines the structure and validation rules for restaurant menus
 * Menus can be time-bound (e.g., breakfast, lunch, dinner) or always available
 */
export const createMenuSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Menu name must be at least 2 characters long" })
    .max(100, { message: "Menu name cannot exceed 100 characters" })
    .trim(),

  /**
   * Optional description of the menu
   * Can contain details about the menu theme, availability, etc.
   */
  description: z.string().nullable().optional(),

  /**
   * Controls whether the menu is currently available to customers
   * Inactive menus are not displayed in the restaurant's menu list
   */
  isActive: z.boolean().default(true),

  /**
   * ISO datetime string representing when the menu becomes available
   * Used for time-limited menus (e.g., breakfast from 7am-11am)
   */
  startTime: z
    .string()
    .datetime({ message: "Start time must be a valid ISO date string" })
    .nullable()
    .optional(),

  /**
   * ISO datetime string representing when the menu stops being available
   * Must be after startTime if both are provided
   */
  endTime: z
    .string()
    .datetime({ message: "End time must be a valid ISO date string" })
    .nullable()
    .optional(),
});

// Add super-refinement for date comparison
createMenuSchema.superRefine((data, ctx) => {
  if (data.startTime && data.endTime) {
    const start = new Date(data.startTime);
    const end = new Date(data.endTime);

    if (end <= start) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "End time must be after start time",
        path: ["endTime"],
      });
    }
  }
});

export const updateMenuSchema = createMenuSchema.partial().extend({
  menuId: z
    .string()
    .uuid({ message: "Menu ID must be a valid UUID" })
    .optional(),
});

// Menu Item validation schemas
const menuItemVariantSchema = z.object({
  id: z
    .string()
    .uuid({ message: "Variant ID must be a valid UUID" })
    .optional(),
  weight: z.string(),
  isActive: z.boolean(),
});

const menuItemImageSchema = z.object({
  id: z.string().uuid({ message: "Image ID must be a valid UUID" }).optional(),
  imageUrl: z.string().url({ message: "Image URL must be a valid URL" }),
  isPrimary: z.boolean(),
  altText: z.string().nullable().optional(),
  order: z.number().int().min(0).default(0),
});

const menuItemSpecificationSchema = z.object({
  id: z
    .string()
    .uuid({ message: "Specification ID must be a valid UUID" })
    .optional(),
  specKey: z.string(),
  specValue: z.string(),
});

export const createMenuItemSchema = z.object({
  title: z
    .string()
    .min(2, { message: "Menu item title must be at least 2 characters long" })
    .max(100, { message: "Menu item title cannot exceed 100 characters" })
    .trim(),

  description: z.string().nullable().optional(),

  sku: z.string().regex(/^[A-Za-z0-9-_]{3,20}$/, {
    message: "SKU must be 3-20 alphanumeric characters, hyphens or underscores",
  }),

  finalPrice: z.number().min(0, { message: "Final price cannot be negative" }),

  mrp: z.number().min(0, { message: "MRP cannot be negative" }),

  discountPercentage: z
    .number()
    .min(0, { message: "Discount percentage cannot be negative" })
    .max(100, { message: "Discount percentage cannot exceed 100" })
    .optional(),

  stockStatus: z
    .enum([
      InventoryStatus.IN_STOCK,
      InventoryStatus.LOW_STOCK,
      InventoryStatus.OUT_OF_STOCK,
      InventoryStatus.DISCONTINUED,
    ] as const)
    .default(InventoryStatus.IN_STOCK),

  categoryId: z.string().uuid({ message: "Category ID must be a valid UUID" }),

  menuId: z.string().uuid({ message: "Menu ID must be a valid UUID" }),

  currency: z
    .string()
    .length(3, { message: "Currency code must be 3 characters (ISO format)" }),

  weightUnit: z.enum([
    WeightUnit.GRAM,
    WeightUnit.KILOGRAM,
    WeightUnit.OUNCE,
    WeightUnit.POUND,
  ] as const),

  isActive: z.boolean().default(true),

  isVisible: z.boolean().default(true),

  isFeatured: z.boolean().default(false),

  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, {
      message: "Color must be a valid hex color code (e.g., #FF5733)",
    })
    .nullable()
    .optional(),

  prepTime: z
    .number()
    .int()
    .min(0, { message: "Prep time cannot be negative" })
    .nullable()
    .optional(),

  maxOrderQuantity: z
    .number()
    .int()
    .min(1, { message: "Max order quantity must be at least 1" })
    .nullable()
    .optional(),

  minOrderQuantity: z
    .number()
    .int()
    .min(1, { message: "Min order quantity must be at least 1" })
    .default(1),

  taxRateId: z
    .string()
    .uuid({ message: "Tax rate ID must be a valid UUID" })
    .nullable()
    .optional(),

  brandId: z
    .string()
    .uuid({ message: "Brand ID must be a valid UUID" })
    .nullable()
    .optional(),

  nutritionInfo: parseJsonIfString(z.record(z.any())).nullable().optional(),

  allergens: parseJsonIfString(z.array(z.string())).nullable().optional(),

  availabilitySchedule: parseJsonIfString(z.record(z.any()))
    .nullable()
    .optional(),

  variants: z.array(menuItemVariantSchema).optional(),

  images: z.array(menuItemImageSchema).optional(),

  specifications: z.array(menuItemSpecificationSchema).optional(),

  searchKeywords: parseJsonIfString(z.array(z.string())).nullable().optional(),

  flags: z.array(z.string()).nullable().optional(),

  dietaryLabel: z.string().nullable().optional(),

  quantityLabel: z.string().nullable().optional(),

  /**
   * Initial inventory setup for the menu item
   * Optional object containing initial stock information
   */
  initialStock: z
    .object({
      quantity: z
        .number()
        .int()
        .min(0, { message: "Initial quantity cannot be negative" })
        .default(0),

      reorderThreshold: z
        .number()
        .int()
        .min(0, { message: "Reorder threshold cannot be negative" })
        .default(10),

      supplierId: z
        .string()
        .uuid({ message: "Supplier ID must be a valid UUID" })
        .optional(),

      location: z
        .string()
        .min(1, { message: "Location cannot be empty" })
        .max(100, { message: "Location cannot exceed 100 characters" })
        .optional(),
    })
    .optional(),
});

// Add price comparison validation using superRefine
createMenuItemSchema.superRefine((data, ctx) => {
  if (data.finalPrice !== undefined && data.mrp !== undefined) {
    if (data.mrp <= data.finalPrice) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "MRP must be greater than final price",
        path: ["mrp"],
      });
    }
  }
});

export const updateMenuItemSchema = createMenuItemSchema.partial().extend({
  id: z.string().uuid({ message: "Menu item ID must be a valid UUID" }),
});

// Category validation schemas
export const createCategorySchema = z.object({
  name: z
    .string()
    .min(2, { message: "Category name must be at least 2 characters long" })
    .max(50, { message: "Category name cannot exceed 50 characters" })
    .trim(),

  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/, {
      message: "Slug can only contain lowercase letters, numbers, and hyphens",
    })
    .min(2, { message: "Slug must be at least 2 characters long" })
    .max(50, { message: "Slug cannot exceed 50 characters" }),

  description: z.string().nullable().optional(),

  restaurantId: z
    .string()
    .uuid({
      message: "Restaurant ID must be a valid UUID",
    })
    .optional(), // Make restaurantId optional

  imageUrl: z
    .string()
    .url({ message: "Image URL must be a valid URL" })
    .nullable()
    .optional(),

  isActive: z.boolean().default(true),

  order: z.number().int().min(0).default(0),

  parentId: z
    .string()
    .uuid({ message: "Parent category ID must be a valid UUID" })
    .nullable()
    .optional(),

  discountPercentage: z
    .number()
    .min(0, { message: "Discount percentage cannot be negative" })
    .max(100, { message: "Discount percentage cannot exceed 100" })
    .nullable()
    .optional(),
});

export const updateCategorySchema = createCategorySchema.partial().extend({
  id: z.string().uuid({ message: "Category ID must be a valid UUID" }),
});
