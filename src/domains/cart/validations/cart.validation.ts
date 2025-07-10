import { z } from "zod";

export const addToCartSchema = z.object({
  menuItemId: z.string().uuid({ message: "Menu item ID must be a valid UUID" }),

  variantId: z
    .string()
    .uuid({ message: "Variant ID must be a valid UUID" })
    .optional()
    .nullable(),

  quantity: z
    .number()
    .int()
    .min(1, { message: "Quantity must be at least 1" })
    .max(99, { message: "Quantity cannot exceed 99" }),
});

export const updateCartItemSchema = z.object({
  quantity: z
    .number()
    .int()
    .min(1, { message: "Quantity must be at least 1" })
    .max(99, { message: "Quantity cannot exceed 99" }),
});

export const cartItemParamsSchema = z.object({
  itemId: z.string().uuid({ message: "Item ID must be a valid UUID" }),
});
