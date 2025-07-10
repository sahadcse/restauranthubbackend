import * as notificationRepo from "../repositories/notification.repository";
import {
  NotificationCreateDto,
  NotificationFilters,
  NotificationResponseDto,
  NotificationPaginationResult,
  BulkNotificationDto,
} from "../types/notification.types";
import {
  NotificationType,
  NotificationChannel,
} from "../../../../prisma/generated/prisma";
import logger from "../../../utils/logger";
import AppError from "../../../utils/AppError";

const DEFAULT_TENANT_ID = "00000000-0000-0000-0000-000000000000";

export const createNotification = async (
  data: NotificationCreateDto,
  tenantId: string = DEFAULT_TENANT_ID
): Promise<NotificationResponseDto> => {
  try {
    logger.info(`Creating notification for user ${data.userId}`);

    const notification = await notificationRepo.createNotification(
      data,
      tenantId
    );

    // Here you could add logic to actually send the notification
    // via email, SMS, push notification, etc. based on the channel
    await processNotificationDelivery(notification);

    return notification;
  } catch (error) {
    logger.error("Service error in createNotification:", error);
    throw error;
  }
};

export const getUserNotifications = async (
  userId: string,
  filters: NotificationFilters = {},
  page: number = 1,
  limit: number = 20
): Promise<NotificationPaginationResult> => {
  try {
    if (page < 1 || limit < 1 || limit > 100) {
      throw new AppError("Invalid pagination parameters", 400);
    }

    const result = await notificationRepo.getUserNotifications(
      userId,
      filters,
      page,
      limit
    );

    const totalPages = Math.ceil(result.total / limit);

    return {
      notifications: result.notifications,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages,
      },
      unreadCount: result.unreadCount,
    };
  } catch (error) {
    logger.error("Service error in getUserNotifications:", error);
    throw error;
  }
};

export const markNotificationAsRead = async (
  notificationId: string,
  userId: string
): Promise<NotificationResponseDto> => {
  try {
    const notification = await notificationRepo.markNotificationAsRead(
      notificationId,
      userId
    );

    if (!notification) {
      throw new AppError("Notification not found or unauthorized", 404);
    }

    return notification;
  } catch (error) {
    logger.error("Service error in markNotificationAsRead:", error);
    throw error;
  }
};

export const markAllNotificationsAsRead = async (
  userId: string
): Promise<{ updatedCount: number }> => {
  try {
    const updatedCount = await notificationRepo.markAllNotificationsAsRead(
      userId
    );

    return { updatedCount };
  } catch (error) {
    logger.error("Service error in markAllNotificationsAsRead:", error);
    throw error;
  }
};

export const deleteNotification = async (
  notificationId: string,
  userId: string
): Promise<void> => {
  try {
    const deleted = await notificationRepo.deleteNotification(
      notificationId,
      userId
    );

    if (!deleted) {
      throw new AppError("Notification not found or unauthorized", 404);
    }
  } catch (error) {
    logger.error("Service error in deleteNotification:", error);
    throw error;
  }
};

export const getNotificationById = async (
  notificationId: string,
  userId?: string
): Promise<NotificationResponseDto> => {
  try {
    const notification = await notificationRepo.getNotificationById(
      notificationId,
      userId
    );

    if (!notification) {
      throw new AppError("Notification not found", 404);
    }

    return notification;
  } catch (error) {
    logger.error("Service error in getNotificationById:", error);
    throw error;
  }
};

export const createBulkNotifications = async (
  data: BulkNotificationDto,
  tenantId: string = DEFAULT_TENANT_ID
): Promise<{ createdCount: number }> => {
  try {
    if (!data.userIds || data.userIds.length === 0) {
      throw new AppError("User IDs are required for bulk notifications", 400);
    }

    if (data.userIds.length > 1000) {
      throw new AppError(
        "Cannot send bulk notifications to more than 1000 users at once",
        400
      );
    }

    const notifications = data.userIds.map((userId) => ({
      userId,
      type: data.type,
      channel: data.channel,
      title: data.title,
      message: data.message,
      metadata: data.metadata,
      tenantId,
    }));

    const createdCount = await notificationRepo.createBulkNotifications(
      notifications
    );

    // Process bulk notification delivery
    await Promise.all(
      notifications.map((notification) =>
        processNotificationDelivery(notification as NotificationResponseDto)
      )
    );

    return { createdCount };
  } catch (error) {
    logger.error("Service error in createBulkNotifications:", error);
    throw error;
  }
};

export const getNotificationStats = async (
  userId?: string,
  tenantId?: string
): Promise<{
  total: number;
  unread: number;
  byType: Record<NotificationType, number>;
  byChannel: Record<NotificationChannel, number>;
}> => {
  try {
    return await notificationRepo.getNotificationStats(userId, tenantId);
  } catch (error) {
    logger.error("Service error in getNotificationStats:", error);
    throw error;
  }
};

// Helper function to process notification delivery
const processNotificationDelivery = async (
  notification: NotificationResponseDto
): Promise<void> => {
  try {
    switch (notification.channel) {
      case NotificationChannel.EMAIL:
        // Here you would integrate with your email service
        logger.info(
          `Sending email notification to user ${notification.userId}`
        );
        // await emailService.sendNotification(notification);
        break;

      case NotificationChannel.SMS:
        // Here you would integrate with your SMS service
        logger.info(`Sending SMS notification to user ${notification.userId}`);
        // await smsService.sendNotification(notification);
        break;

      case NotificationChannel.PUSH:
        // Here you would integrate with your push notification service
        logger.info(`Sending push notification to user ${notification.userId}`);
        // await pushService.sendNotification(notification);
        break;

      case NotificationChannel.IN_APP:
        // In-app notifications are already stored in the database
        logger.info(
          `In-app notification created for user ${notification.userId}`
        );
        break;
    }
  } catch (error) {
    logger.error("Error processing notification delivery:", error);
    // Don't throw here as the notification is already saved
  }
};

// Utility functions for creating specific types of notifications
export const createOrderStatusNotification = async (
  userId: string,
  orderId: string,
  status: string,
  tenantId?: string
): Promise<NotificationResponseDto> => {
  const notification: NotificationCreateDto = {
    userId,
    type: NotificationType.ORDER_STATUS,
    channel: NotificationChannel.IN_APP,
    title: "Order Status Update",
    message: `Your order status has been updated to: ${status}`,
    metadata: { orderId, status },
  };

  return createNotification(notification, tenantId);
};

export const createPromotionNotification = async (
  userId: string,
  title: string,
  message: string,
  promotionData?: Record<string, any>,
  tenantId?: string
): Promise<NotificationResponseDto> => {
  const notification: NotificationCreateDto = {
    userId,
    type: NotificationType.PROMOTION,
    channel: NotificationChannel.IN_APP,
    title,
    message,
    metadata: promotionData,
  };

  return createNotification(notification, tenantId);
};

export const createSystemAlertNotification = async (
  userId: string,
  title: string,
  message: string,
  alertData?: Record<string, any>,
  tenantId?: string
): Promise<NotificationResponseDto> => {
  const notification: NotificationCreateDto = {
    userId,
    type: NotificationType.SYSTEM_ALERT,
    channel: NotificationChannel.IN_APP,
    title,
    message,
    metadata: alertData,
  };

  return createNotification(notification, tenantId);
};
