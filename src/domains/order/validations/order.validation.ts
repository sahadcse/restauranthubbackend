import { z } from "zod";
import {
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
  OrderType,
  PriorityLevel,
  DeliveryStatus,
  OrderCancellationStatus,
  ReturnStatus,
} from "../../../../prisma/generated/prisma";

// Helper schemas
const addressSchema = z.object({
  street: z.string().min(5, "Street address must be at least 5 characters"),
  city: z.string().min(2, "City must be at least 2 characters"),
  state: z.string().min(2, "State must be at least 2 characters"),
  postalCode: z.string().min(5, "Postal code must be at least 5 characters"),
  country: z.string().min(2, "Country must be at least 2 characters"),
});

// Order Item validation
const orderItemSchema = z.object({
  menuItemId: z.string().uuid("Menu item ID must be a valid UUID"),
  quantity: z
    .number()
    .int()
    .min(1, "Quantity must be at least 1")
    .max(50, "Quantity cannot exceed 50 items"),
  unitPrice: z.number().min(0.01, "Unit price must be greater than 0"),
  notes: z
    .string()
    .max(200, "Item notes cannot exceed 200 characters")
    .optional(),
});

// Create Order validation - matching Prisma Order model
export const createOrderSchema = z
  .object({
    restaurantId: z.string().uuid("Restaurant ID must be a valid UUID"),
    items: z
      .array(orderItemSchema)
      .min(1, "Order must have at least one item")
      .max(20, "Order cannot have more than 20 items"),
    orderType: z.enum(
      [OrderType.DELIVERY, OrderType.PICKUP, OrderType.DINE_IN],
      {
        errorMap: () => ({
          message: "Order type must be DELIVERY, PICKUP, or DINE_IN",
        }),
      }
    ),
    deliveryAddress: z.preprocess((val) => {
      if (typeof val === "string") {
        try {
          return JSON.parse(val);
        } catch {
          return val;
        }
      }
      return val;
    }, addressSchema.optional()),
    notes: z
      .string()
      .max(500, "Order notes cannot exceed 500 characters")
      .optional(),
    deliveryInstructions: z
      .string()
      .max(200, "Delivery instructions cannot exceed 200 characters")
      .optional(),
    priority: z
      .enum([
        PriorityLevel.LOW,
        PriorityLevel.NORMAL,
        PriorityLevel.HIGH,
        PriorityLevel.URGENT,
      ])
      .default(PriorityLevel.NORMAL),
    source: z.string().max(50, "Source cannot exceed 50 characters").optional(),
  })
  .refine(
    (data) => {
      // Delivery orders must have delivery address
      if (data.orderType === OrderType.DELIVERY && !data.deliveryAddress) {
        return false;
      }
      return true;
    },
    {
      message: "Delivery address is required for delivery orders",
      path: ["deliveryAddress"],
    }
  );

// Update Order validation - matching Prisma Order model
export const updateOrderSchema = z.object({
  status: z
    .enum([
      OrderStatus.PENDING,
      OrderStatus.PREPARING,
      OrderStatus.SHIPPED,
      OrderStatus.DELIVERED,
      OrderStatus.CANCELLED,
      OrderStatus.REFUNDED,
    ])
    .optional(),
  notes: z.string().max(500, "Notes cannot exceed 500 characters").optional(),
  estimatedDeliveryTime: z
    .string()
    .datetime("Invalid datetime format - use ISO 8601 format")
    .optional(),
  actualDeliveryTime: z
    .string()
    .datetime("Invalid datetime format - use ISO 8601 format")
    .optional(),
  priority: z
    .enum([
      PriorityLevel.LOW,
      PriorityLevel.NORMAL,
      PriorityLevel.HIGH,
      PriorityLevel.URGENT,
    ])
    .optional(),
  cancelReason: z
    .string()
    .max(500, "Cancel reason cannot exceed 500 characters")
    .optional(),
});

// Payment validation - matching Prisma Payment model
export const createPaymentSchema = z.object({
  orderId: z.string().uuid("Order ID must be a valid UUID"),
  amount: z
    .number()
    .min(0.01, "Payment amount must be greater than 0")
    .max(10000, "Payment amount cannot exceed $10,000"),
  currency: z
    .string()
    .length(3, "Currency must be 3 characters (ISO format)")
    .regex(/^[A-Z]{3}$/, "Currency must be uppercase ISO code"),
  method: z.enum(
    [
      PaymentMethod.CREDIT_CARD,
      PaymentMethod.DEBIT_CARD,
      PaymentMethod.PAYPAL,
      PaymentMethod.STRIPE,
      PaymentMethod.CASH,
      PaymentMethod.BANK_TRANSFER,
    ],
    {
      errorMap: () => ({ message: "Invalid payment method" }),
    }
  ),
  transactionId: z
    .string()
    .max(100, "Transaction ID cannot exceed 100 characters")
    .optional(),
  gatewayResponse: z.record(z.any()).optional(),
});

export const updatePaymentSchema = z.object({
  status: z
    .enum([
      PaymentStatus.PENDING,
      PaymentStatus.AUTHORIZED,
      PaymentStatus.PAID,
      PaymentStatus.FAILED,
      PaymentStatus.REFUNDED,
      PaymentStatus.PARTIALLY_REFUNDED,
    ])
    .optional(),
  transactionId: z
    .string()
    .max(100, "Transaction ID cannot exceed 100 characters")
    .optional(),
  gatewayResponse: z.record(z.any()).optional(),
  refundStatus: z
    .enum([
      ReturnStatus.NONE,
      ReturnStatus.REQUESTED,
      ReturnStatus.APPROVED,
      ReturnStatus.REJECTED,
      ReturnStatus.COMPLETED,
    ])
    .optional(),
});

// Delivery validation - matching Prisma Delivery model
export const createDeliverySchema = z.object({
  orderId: z.string().uuid("Order ID must be a valid UUID"),
  driverId: z.string().uuid("Driver ID must be a valid UUID").optional(),
  trackingUrl: z.string().url("Invalid tracking URL").optional(),
});

export const updateDeliverySchema = z.object({
  driverId: z.string().uuid("Driver ID must be a valid UUID").optional(),
  status: z
    .enum([
      DeliveryStatus.PENDING,
      DeliveryStatus.ASSIGNED,
      DeliveryStatus.IN_TRANSIT,
      DeliveryStatus.DELIVERED,
      DeliveryStatus.FAILED,
    ])
    .optional(),
  trackingUrl: z.string().url("Invalid tracking URL").optional(),
  assignedAt: z.string().datetime("Invalid datetime format").optional(),
  pickedUpAt: z.string().datetime("Invalid datetime format").optional(),
  completedAt: z.string().datetime("Invalid datetime format").optional(),
});

// Driver validation - matching Prisma Driver model
export const createDriverSchema = z.object({
  userId: z.string().uuid("User ID must be a valid UUID"),
  vehicleInfo: z.record(z.any()).optional(),
  isActive: z.boolean().default(true),
});

export const updateDriverSchema = createDriverSchema.partial();

// Order Cancellation validation - matching Prisma OrderCancellation model
export const createOrderCancellationSchema = z.object({
  orderId: z.string().uuid("Order ID must be a valid UUID"),
  reason: z
    .string()
    .min(10, "Cancellation reason must be at least 10 characters")
    .max(500, "Reason cannot exceed 500 characters")
    .refine((val) => val.trim().length >= 10, {
      message: "Cancellation reason must have meaningful content",
    }),
});

export const updateOrderCancellationSchema = z.object({
  status: z.enum(
    [
      OrderCancellationStatus.REQUESTED,
      OrderCancellationStatus.APPROVED,
      OrderCancellationStatus.REJECTED,
    ],
    {
      errorMap: () => ({
        message: "Status must be REQUESTED, APPROVED, or REJECTED",
      }),
    }
  ),
  approvedBy: z.string().uuid("Approver ID must be a valid UUID").optional(),
});

// Query validation schemas
export const orderQuerySchema = z
  .object({
    page: z
      .string()
      .optional()
      .default("1")
      .transform((val) => parseInt(val, 10))
      .pipe(z.number().int().min(1).max(1000)),
    limit: z
      .string()
      .optional()
      .default("20")
      .transform((val) => parseInt(val, 10))
      .pipe(z.number().int().min(1).max(100)),
    status: z
      .string()
      .optional()
      .refine(
        (val) =>
          !val || Object.values(OrderStatus).includes(val as OrderStatus),
        { message: "Invalid order status" }
      ),
    restaurantId: z.string().uuid().optional().or(z.literal("")),
    userId: z.string().uuid().optional().or(z.literal("")),
    orderType: z
      .string()
      .optional()
      .refine(
        (val) => !val || Object.values(OrderType).includes(val as OrderType),
        { message: "Invalid order type" }
      ),
    paymentStatus: z
      .string()
      .optional()
      .refine(
        (val) =>
          !val || Object.values(PaymentStatus).includes(val as PaymentStatus),
        { message: "Invalid payment status" }
      ),
    priority: z
      .string()
      .optional()
      .refine(
        (val) =>
          !val || Object.values(PriorityLevel).includes(val as PriorityLevel),
        { message: "Invalid priority level" }
      ),
    startDate: z
      .string()
      .optional()
      .refine((val) => !val || !isNaN(Date.parse(val)), {
        message: "Invalid start date format",
      }),
    endDate: z
      .string()
      .optional()
      .refine((val) => !val || !isNaN(Date.parse(val)), {
        message: "Invalid end date format",
      }),
    search: z
      .string()
      .max(100, "Search term cannot exceed 100 characters")
      .optional()
      .or(z.literal(""))
      .refine((val) => !val || val.trim().length >= 3, {
        message: "Search term must be at least 3 characters",
      }),
  })
  .transform((data) => ({
    ...data,
    // Filter out empty strings and convert them to undefined
    restaurantId: data.restaurantId === "" ? undefined : data.restaurantId,
    userId: data.userId === "" ? undefined : data.userId,
    search:
      data.search === "" || !data.search?.trim()
        ? undefined
        : data.search.trim(),
    status: data.status === "" ? undefined : data.status,
    orderType: data.orderType === "" ? undefined : data.orderType,
    paymentStatus: data.paymentStatus === "" ? undefined : data.paymentStatus,
    priority: data.priority === "" ? undefined : data.priority,
    startDate: data.startDate === "" ? undefined : data.startDate,
    endDate: data.endDate === "" ? undefined : data.endDate,
  }));

export const deliveryQuerySchema = z
  .object({
    page: z
      .string()
      .optional()
      .default("1")
      .transform((val) => parseInt(val, 10))
      .pipe(z.number().int().min(1).max(1000)),
    limit: z
      .string()
      .optional()
      .default("20")
      .transform((val) => parseInt(val, 10))
      .pipe(z.number().int().min(1).max(100)),
    status: z
      .string()
      .optional()
      .refine(
        (val) =>
          !val || Object.values(DeliveryStatus).includes(val as DeliveryStatus),
        { message: "Invalid delivery status" }
      ),
    driverId: z.string().uuid().optional().or(z.literal("")),
  })
  .transform((data) => ({
    ...data,
    // Filter out empty strings
    driverId: data.driverId === "" ? undefined : data.driverId,
    status: data.status === "" ? undefined : data.status,
  }));
