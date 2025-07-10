import {
  NotificationType,
  NotificationChannel,
  FeedbackType,
} from "../../../../prisma/generated/prisma";
import { NotificationCreateDto } from "../types/notification.types";

/**
 * Utility functions for notification management
 */

/**
 * Generate notification title based on type and context
 */
export const generateNotificationTitle = (
  type: NotificationType,
  context: Record<string, any> = {}
): string => {
  switch (type) {
    case NotificationType.ORDER_STATUS:
      return `Order ${context.status ? `${context.status}` : "Update"}`;
    case NotificationType.PROMOTION:
      return context.title || "Special Offer Available!";
    case NotificationType.PASSWORD_RESET:
      return "Password Reset Request";
    case NotificationType.ACCOUNT_UPDATE:
      return "Account Information Updated";
    case NotificationType.NEW_MESSAGE:
      return "New Message Received";
    case NotificationType.SYSTEM_ALERT:
      return context.title || "System Alert";
    default:
      return "Notification";
  }
};

/**
 * Generate notification message based on type and context
 */
export const generateNotificationMessage = (
  type: NotificationType,
  context: Record<string, any> = {}
): string => {
  switch (type) {
    case NotificationType.ORDER_STATUS:
      return `Your order ${
        context.orderId ? `#${context.orderId}` : ""
      } status has been updated${
        context.status ? ` to ${context.status}` : ""
      }.`;
    case NotificationType.PROMOTION:
      return context.message || "Check out our latest offers and promotions!";
    case NotificationType.PASSWORD_RESET:
      return "A password reset request has been made for your account. If this wasn't you, please ignore this message.";
    case NotificationType.ACCOUNT_UPDATE:
      return (
        context.message ||
        "Your account information has been successfully updated."
      );
    case NotificationType.NEW_MESSAGE:
      return (
        context.message ||
        "You have received a new message. Please check your inbox."
      );
    case NotificationType.SYSTEM_ALERT:
      return (
        context.message ||
        "Important system notification requires your attention."
      );
    default:
      return "You have a new notification.";
  }
};

/**
 * Determine appropriate notification channel based on type and user preferences
 */
export const getDefaultNotificationChannel = (
  type: NotificationType,
  userPreferences?: Record<string, any>
): NotificationChannel => {
  // If user has specific preferences, use them
  if (userPreferences && userPreferences[type]) {
    return userPreferences[type] as NotificationChannel;
  }

  // Default channel based on notification type
  switch (type) {
    case NotificationType.ORDER_STATUS:
      return NotificationChannel.IN_APP;
    case NotificationType.PROMOTION:
      return NotificationChannel.EMAIL;
    case NotificationType.PASSWORD_RESET:
      return NotificationChannel.EMAIL;
    case NotificationType.ACCOUNT_UPDATE:
      return NotificationChannel.EMAIL;
    case NotificationType.NEW_MESSAGE:
      return NotificationChannel.IN_APP;
    case NotificationType.SYSTEM_ALERT:
      return NotificationChannel.IN_APP;
    default:
      return NotificationChannel.IN_APP;
  }
};

/**
 * Create a standardized notification for order status updates
 */
export const createOrderStatusNotification = (
  userId: string,
  orderId: string,
  status: string,
  additionalData?: Record<string, any>
): NotificationCreateDto => {
  const context = { orderId, status, ...additionalData };

  return {
    userId,
    type: NotificationType.ORDER_STATUS,
    channel: getDefaultNotificationChannel(NotificationType.ORDER_STATUS),
    title: generateNotificationTitle(NotificationType.ORDER_STATUS, context),
    message: generateNotificationMessage(
      NotificationType.ORDER_STATUS,
      context
    ),
    metadata: context,
  };
};

/**
 * Create a standardized notification for promotions
 */
export const createPromotionNotification = (
  userId: string,
  title: string,
  message: string,
  promotionData?: Record<string, any>
): NotificationCreateDto => {
  const context = { title, message, ...promotionData };

  return {
    userId,
    type: NotificationType.PROMOTION,
    channel: getDefaultNotificationChannel(NotificationType.PROMOTION),
    title,
    message,
    metadata: context,
  };
};

/**
 * Validate feedback rating
 */
export const isValidRating = (rating: number): boolean => {
  return Number.isInteger(rating) && rating >= 1 && rating <= 5;
};

/**
 * Get feedback type display name
 */
export const getFeedbackTypeDisplayName = (type: FeedbackType): string => {
  switch (type) {
    case FeedbackType.RESTAURANT:
      return "Restaurant";
    case FeedbackType.DELIVERY:
      return "Delivery";
    case FeedbackType.MENU_ITEM:
      return "Menu Item";
    case FeedbackType.SERVICE:
      return "Service";
    default:
      return "Unknown";
  }
};

/**
 * Calculate rating distribution percentages
 */
export const calculateRatingDistribution = (
  ratingCounts: Record<number, number>,
  total: number
): Record<number, { count: number; percentage: number }> => {
  const distribution: Record<number, { count: number; percentage: number }> =
    {};

  for (let rating = 1; rating <= 5; rating++) {
    const count = ratingCounts[rating] || 0;
    const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
    distribution[rating] = { count, percentage };
  }

  return distribution;
};

/**
 * Format notification for display
 */
export const formatNotificationForDisplay = (notification: any) => {
  return {
    id: notification.id,
    title: notification.title,
    message: notification.message,
    type: notification.type,
    channel: notification.channel,
    isRead: notification.isRead,
    createdAt: notification.createdAt,
    readAt: notification.readAt,
    metadata: notification.metadata,
    timeAgo: getTimeAgo(notification.createdAt),
    priority: getNotificationPriority(notification.type),
  };
};

/**
 * Get human-readable time ago string
 */
export const getTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "Just now";
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? "s" : ""} ago`;
  } else {
    return date.toLocaleDateString();
  }
};

/**
 * Get notification priority level
 */
export const getNotificationPriority = (
  type: NotificationType
): "high" | "normal" | "low" => {
  switch (type) {
    case NotificationType.SYSTEM_ALERT:
    case NotificationType.PASSWORD_RESET:
      return "high";
    case NotificationType.ORDER_STATUS:
    case NotificationType.ACCOUNT_UPDATE:
    case NotificationType.NEW_MESSAGE:
      return "normal";
    case NotificationType.PROMOTION:
      return "low";
    default:
      return "normal";
  }
};

/**
 * Batch notifications by user and channel for efficient delivery
 */
export const batchNotificationsByUserAndChannel = (
  notifications: NotificationCreateDto[]
): Record<string, Record<NotificationChannel, NotificationCreateDto[]>> => {
  const batched: Record<
    string,
    Record<NotificationChannel, NotificationCreateDto[]>
  > = {};

  notifications.forEach((notification) => {
    if (!batched[notification.userId]) {
      batched[notification.userId] = {} as Record<
        NotificationChannel,
        NotificationCreateDto[]
      >;
    }

    if (!batched[notification.userId][notification.channel]) {
      batched[notification.userId][notification.channel] = [];
    }

    batched[notification.userId][notification.channel].push(notification);
  });

  return batched;
};
