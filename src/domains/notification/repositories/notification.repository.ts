import prisma from "../../../db";
import {
  NotificationCreateDto,
  NotificationFilters,
  NotificationResponseDto,
} from "../types/notification.types";
import {
  NotificationType,
  NotificationChannel,
} from "../../../../prisma/generated/prisma";
import logger from "../../../utils/logger";

export const createNotification = async (
  data: NotificationCreateDto,
  tenantId: string
): Promise<NotificationResponseDto> => {
  try {
    const notification = await prisma.notification.create({
      data: {
        ...data,
        tenantId,
      },
    });

    return notification as NotificationResponseDto;
  } catch (error) {
    logger.error("Error creating notification:", error);
    throw new Error("Failed to create notification");
  }
};

export const getUserNotifications = async (
  userId: string,
  filters: NotificationFilters = {},
  page: number = 1,
  limit: number = 20
): Promise<{
  notifications: NotificationResponseDto[];
  total: number;
  unreadCount: number;
}> => {
  try {
    const skip = (page - 1) * limit;

    const whereClause: any = {
      userId,
    };

    if (filters.type) whereClause.type = filters.type;
    if (filters.channel) whereClause.channel = filters.channel;
    if (filters.isRead !== undefined) whereClause.isRead = filters.isRead;
    if (filters.startDate || filters.endDate) {
      whereClause.createdAt = {};
      if (filters.startDate) whereClause.createdAt.gte = filters.startDate;
      if (filters.endDate) whereClause.createdAt.lte = filters.endDate;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.notification.count({
        where: whereClause,
      }),
      prisma.notification.count({
        where: {
          userId,
          isRead: false,
        },
      }),
    ]);

    return {
      notifications: notifications as NotificationResponseDto[],
      total,
      unreadCount,
    };
  } catch (error) {
    logger.error("Error fetching user notifications:", error);
    throw new Error("Failed to fetch notifications");
  }
};

export const markNotificationAsRead = async (
  notificationId: string,
  userId: string
): Promise<NotificationResponseDto | null> => {
  try {
    const notification = await prisma.notification.update({
      where: {
        id: notificationId,
        userId, // Ensure user can only update their own notifications
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return notification as NotificationResponseDto;
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("Record to update not found")
    ) {
      return null;
    }
    logger.error("Error marking notification as read:", error);
    throw new Error("Failed to update notification");
  }
};

export const markAllNotificationsAsRead = async (
  userId: string
): Promise<number> => {
  try {
    const result = await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return result.count;
  } catch (error) {
    logger.error("Error marking all notifications as read:", error);
    throw new Error("Failed to update notifications");
  }
};

export const deleteNotification = async (
  notificationId: string,
  userId: string
): Promise<boolean> => {
  try {
    await prisma.notification.delete({
      where: {
        id: notificationId,
        userId, // Ensure user can only delete their own notifications
      },
    });

    return true;
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("Record to delete does not exist")
    ) {
      return false;
    }
    logger.error("Error deleting notification:", error);
    throw new Error("Failed to delete notification");
  }
};

export const getNotificationById = async (
  notificationId: string,
  userId?: string
): Promise<NotificationResponseDto | null> => {
  try {
    const whereClause: any = { id: notificationId };
    if (userId) whereClause.userId = userId;

    const notification = await prisma.notification.findUnique({
      where: whereClause,
    });

    return notification as NotificationResponseDto | null;
  } catch (error) {
    logger.error("Error fetching notification by ID:", error);
    throw new Error("Failed to fetch notification");
  }
};

export const createBulkNotifications = async (
  notifications: Array<NotificationCreateDto & { tenantId: string }>
): Promise<number> => {
  try {
    const result = await prisma.notification.createMany({
      data: notifications,
    });

    return result.count;
  } catch (error) {
    logger.error("Error creating bulk notifications:", error);
    throw new Error("Failed to create bulk notifications");
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
    const whereClause: any = {};
    if (userId) whereClause.userId = userId;
    if (tenantId) whereClause.tenantId = tenantId;

    const [total, unread, byType, byChannel] = await Promise.all([
      prisma.notification.count({ where: whereClause }),
      prisma.notification.count({
        where: { ...whereClause, isRead: false },
      }),
      prisma.notification.groupBy({
        by: ["type"],
        where: whereClause,
        _count: true,
      }),
      prisma.notification.groupBy({
        by: ["channel"],
        where: whereClause,
        _count: true,
      }),
    ]);

    const typeStats: Record<NotificationType, number> = {} as any;
    const channelStats: Record<NotificationChannel, number> = {} as any;

    byType.forEach((item) => {
      typeStats[item.type as NotificationType] = item._count;
    });

    byChannel.forEach((item) => {
      channelStats[item.channel as NotificationChannel] = item._count;
    });

    return {
      total,
      unread,
      byType: typeStats,
      byChannel: channelStats,
    };
  } catch (error) {
    logger.error("Error fetching notification stats:", error);
    throw new Error("Failed to fetch notification statistics");
  }
};
