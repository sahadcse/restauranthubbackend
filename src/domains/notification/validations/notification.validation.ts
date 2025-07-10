import { z } from "zod";
import {
  NotificationType,
  NotificationChannel,
  FeedbackType,
} from "../../../../prisma/generated/prisma";

// Notification validation schemas
export const createNotificationSchema = z.object({
  body: z.object({
    userId: z.string().uuid("Invalid user ID format"),
    type: z.nativeEnum(NotificationType, {
      errorMap: () => ({ message: "Invalid notification type" }),
    }),
    channel: z.nativeEnum(NotificationChannel, {
      errorMap: () => ({ message: "Invalid notification channel" }),
    }),
    title: z.string().min(1, "Title is required").max(255, "Title too long"),
    message: z
      .string()
      .min(1, "Message is required")
      .max(1000, "Message too long"),
    metadata: z.record(z.any()).optional(),
  }),
});

export const updateNotificationSchema = z.object({
  body: z.object({
    isRead: z.boolean().optional(),
  }),
});

export const bulkNotificationSchema = z.object({
  body: z.object({
    userIds: z
      .array(z.string().uuid("Invalid user ID format"))
      .min(1, "At least one user ID is required")
      .max(1000, "Cannot send to more than 1000 users at once"),
    type: z.nativeEnum(NotificationType, {
      errorMap: () => ({ message: "Invalid notification type" }),
    }),
    channel: z.nativeEnum(NotificationChannel, {
      errorMap: () => ({ message: "Invalid notification channel" }),
    }),
    title: z.string().min(1, "Title is required").max(255, "Title too long"),
    message: z
      .string()
      .min(1, "Message is required")
      .max(1000, "Message too long"),
    metadata: z.record(z.any()).optional(),
  }),
});

export const notificationQuerySchema = z.object({
  type: z.nativeEnum(NotificationType).optional(),
  channel: z.nativeEnum(NotificationChannel).optional(),
  isRead: z
    .string()
    .transform((val) => val === "true")
    .optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default("1"),
  limit: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default("20"),
});

export const notificationParamsSchema = z.object({
  id: z.string().uuid("Invalid notification ID format"),
});

// Feedback validation schemas
export const createFeedbackSchema = z.object({
  body: z.object({
    orderId: z.string().uuid("Invalid order ID format"),
    userId: z.string().uuid("Invalid user ID format"),
    type: z.nativeEnum(FeedbackType, {
      errorMap: () => ({ message: "Invalid feedback type" }),
    }),
    comment: z.string().max(1000, "Comment too long").optional(),
    rating: z
      .number()
      .int("Rating must be an integer")
      .min(1, "Rating must be at least 1")
      .max(5, "Rating must be at most 5"),
  }),
});

export const feedbackQuerySchema = z.object({
  type: z.nativeEnum(FeedbackType).optional(),
  rating: z
    .string()
    .transform((val) => parseInt(val, 10))
    .optional(),
  minRating: z
    .string()
    .transform((val) => parseInt(val, 10))
    .optional(),
  maxRating: z
    .string()
    .transform((val) => parseInt(val, 10))
    .optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  restaurantId: z.string().uuid().optional(),
  page: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default("1"),
  limit: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default("20"),
});

export const feedbackParamsSchema = z.object({
  id: z.string().uuid("Invalid feedback ID format"),
});

export const orderFeedbackParamsSchema = z.object({
  orderId: z.string().uuid("Invalid order ID format"),
});

// Additional validation for stats endpoints
export const statsQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  restaurantId: z.string().uuid().optional(),
  type: z.nativeEnum(FeedbackType).optional(),
});

// User-specific query validation
export const userQuerySchema = z.object({
  page: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default("1"),
  limit: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default("20"),
});
