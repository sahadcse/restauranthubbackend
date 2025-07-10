import { Request, Response, NextFunction } from "express";
import * as notificationService from "../services/notification.service";
import { NotificationFilters } from "../types/notification.types";
import logger from "../../../utils/logger";
import AppError from "../../../utils/AppError";

export const createNotification = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const notificationData = req.body;
    const tenantId = req.headers["x-tenant-id"] as string;

    const notification = await notificationService.createNotification(
      notificationData,
      tenantId
    );

    res.status(201).json({
      success: true,
      message: "Notification created successfully",
      data: notification,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError("User ID is required", 401);
    }

    const { type, channel, isRead, startDate, endDate, page, limit } =
      req.query;

    const filters: NotificationFilters = {};
    if (type) filters.type = type as any;
    if (channel) filters.channel = channel as any;
    if (isRead !== undefined) filters.isRead = isRead === "true";
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);

    const result = await notificationService.getUserNotifications(
      userId,
      filters,
      parseInt(page as string) || 1,
      parseInt(limit as string) || 20
    );

    res.status(200).json({
      success: true,
      message: "Notifications retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const markNotificationAsRead = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError("User ID is required", 401);
    }

    const notification = await notificationService.markNotificationAsRead(
      id,
      userId
    );

    res.status(200).json({
      success: true,
      message: "Notification marked as read",
      data: notification,
    });
  } catch (error) {
    next(error);
  }
};

export const markAllNotificationsAsRead = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError("User ID is required", 401);
    }

    const result = await notificationService.markAllNotificationsAsRead(userId);

    res.status(200).json({
      success: true,
      message: "All notifications marked as read",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteNotification = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError("User ID is required", 401);
    }

    await notificationService.deleteNotification(id, userId);

    res.status(200).json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const getNotificationById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    // Admins can view any notification, users can only view their own
    const searchUserId =
      userRole === "ADMIN" || userRole === "SUPER_ADMIN" ? undefined : userId;

    const notification = await notificationService.getNotificationById(
      id,
      searchUserId
    );

    res.status(200).json({
      success: true,
      message: "Notification retrieved successfully",
      data: notification,
    });
  } catch (error) {
    next(error);
  }
};

export const createBulkNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const bulkData = req.body;
    const tenantId = req.headers["x-tenant-id"] as string;

    const result = await notificationService.createBulkNotifications(
      bulkData,
      tenantId
    );

    res.status(201).json({
      success: true,
      message: "Bulk notifications created successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getNotificationStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const tenantId = req.headers["x-tenant-id"] as string;

    // Admins can view system-wide stats, users can only view their own
    const searchUserId =
      userRole === "ADMIN" || userRole === "SUPER_ADMIN" ? undefined : userId;
    const searchTenantId =
      userRole === "ADMIN" || userRole === "SUPER_ADMIN" ? tenantId : undefined;

    const stats = await notificationService.getNotificationStats(
      searchUserId,
      searchTenantId
    );

    res.status(200).json({
      success: true,
      message: "Notification statistics retrieved successfully",
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

export const getUnreadCount = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError("User ID is required", 401);
    }

    const result = await notificationService.getUserNotifications(
      userId,
      { isRead: false },
      1,
      1
    );

    res.status(200).json({
      success: true,
      message: "Unread count retrieved successfully",
      data: {
        unreadCount: result.unreadCount,
      },
    });
  } catch (error) {
    next(error);
  }
};
