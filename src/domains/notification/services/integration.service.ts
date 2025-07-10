/**
 * Integration service for connecting notification system with other domains
 * This service provides helper functions for other domains to trigger notifications
 */

import * as notificationService from "./notification.service";
import * as feedbackService from "./feedback.service";
import {
  NotificationType,
  NotificationChannel,
  FeedbackType,
  OrderStatus,
} from "../../../../prisma/generated/prisma";
import {
  NotificationCreateDto,
  FeedbackCreateDto,
} from "../types/notification.types";
import logger from "../../../utils/logger";

/**
 * Order-related notification helpers
 */
export const orderNotifications = {
  /**
   * Send notification when order status changes
   */
  statusUpdate: async (
    userId: string,
    orderId: string,
    oldStatus: OrderStatus,
    newStatus: OrderStatus,
    tenantId?: string
  ) => {
    try {
      const notification: NotificationCreateDto = {
        userId,
        type: NotificationType.ORDER_STATUS,
        channel: NotificationChannel.IN_APP,
        title: "Order Status Update",
        message: `Your order #${orderId.slice(
          -8
        )} status has been updated from ${oldStatus.toLowerCase()} to ${newStatus.toLowerCase()}.`,
        metadata: {
          orderId,
          oldStatus,
          newStatus,
          timestamp: new Date().toISOString(),
        },
      };

      return await notificationService.createNotification(
        notification,
        tenantId
      );
    } catch (error) {
      logger.error("Error sending order status notification:", error);
      throw error;
    }
  },

  /**
   * Send notification when order is confirmed
   */
  confirmed: async (
    userId: string,
    orderId: string,
    estimatedDeliveryTime?: Date,
    tenantId?: string
  ) => {
    try {
      const deliveryText = estimatedDeliveryTime
        ? ` Estimated delivery: ${estimatedDeliveryTime.toLocaleString()}.`
        : "";

      const notification: NotificationCreateDto = {
        userId,
        type: NotificationType.ORDER_STATUS,
        channel: NotificationChannel.IN_APP,
        title: "Order Confirmed",
        message: `Your order #${orderId.slice(
          -8
        )} has been confirmed and is being prepared.${deliveryText}`,
        metadata: {
          orderId,
          status: "confirmed",
          estimatedDeliveryTime: estimatedDeliveryTime?.toISOString(),
        },
      };

      return await notificationService.createNotification(
        notification,
        tenantId
      );
    } catch (error) {
      logger.error("Error sending order confirmation notification:", error);
      throw error;
    }
  },

  /**
   * Send notification when order is ready for pickup/out for delivery
   */
  ready: async (
    userId: string,
    orderId: string,
    orderType: "pickup" | "delivery",
    tenantId?: string
  ) => {
    try {
      const message =
        orderType === "pickup"
          ? `Your order #${orderId.slice(-8)} is ready for pickup!`
          : `Your order #${orderId.slice(-8)} is out for delivery!`;

      const notification: NotificationCreateDto = {
        userId,
        type: NotificationType.ORDER_STATUS,
        channel: NotificationChannel.PUSH,
        title:
          orderType === "pickup"
            ? "Order Ready for Pickup"
            : "Order Out for Delivery",
        message,
        metadata: {
          orderId,
          orderType,
          status:
            orderType === "pickup" ? "ready_for_pickup" : "out_for_delivery",
        },
      };

      return await notificationService.createNotification(
        notification,
        tenantId
      );
    } catch (error) {
      logger.error("Error sending order ready notification:", error);
      throw error;
    }
  },

  /**
   * Send notification when order is delivered
   */
  delivered: async (
    userId: string,
    orderId: string,
    deliveryTime: Date,
    tenantId?: string
  ) => {
    try {
      const notification: NotificationCreateDto = {
        userId,
        type: NotificationType.ORDER_STATUS,
        channel: NotificationChannel.IN_APP,
        title: "Order Delivered",
        message: `Your order #${orderId.slice(
          -8
        )} has been successfully delivered. We hope you enjoy your meal!`,
        metadata: {
          orderId,
          status: "delivered",
          deliveryTime: deliveryTime.toISOString(),
        },
      };

      return await notificationService.createNotification(
        notification,
        tenantId
      );
    } catch (error) {
      logger.error("Error sending order delivered notification:", error);
      throw error;
    }
  },
};

/**
 * Restaurant-related notification helpers
 */
export const restaurantNotifications = {
  /**
   * Send notification to restaurant when new order is received
   */
  newOrder: async (
    restaurantOwnerId: string,
    orderId: string,
    orderTotal: number,
    customerName: string,
    tenantId?: string
  ) => {
    try {
      const notification: NotificationCreateDto = {
        userId: restaurantOwnerId,
        type: NotificationType.ORDER_STATUS,
        channel: NotificationChannel.IN_APP,
        title: "New Order Received",
        message: `New order #${orderId.slice(
          -8
        )} from ${customerName} for $${orderTotal.toFixed(2)}.`,
        metadata: {
          orderId,
          orderTotal,
          customerName,
          type: "new_order",
        },
      };

      return await notificationService.createNotification(
        notification,
        tenantId
      );
    } catch (error) {
      logger.error(
        "Error sending new order notification to restaurant:",
        error
      );
      throw error;
    }
  },

  /**
   * Send notification when restaurant is approved
   */
  approved: async (
    ownerId: string,
    restaurantName: string,
    tenantId?: string
  ) => {
    try {
      const notification: NotificationCreateDto = {
        userId: ownerId,
        type: NotificationType.ACCOUNT_UPDATE,
        channel: NotificationChannel.EMAIL,
        title: "Restaurant Approved",
        message: `Congratulations! Your restaurant "${restaurantName}" has been approved and is now live on our platform.`,
        metadata: {
          restaurantName,
          status: "approved",
        },
      };

      return await notificationService.createNotification(
        notification,
        tenantId
      );
    } catch (error) {
      logger.error("Error sending restaurant approval notification:", error);
      throw error;
    }
  },
};

/**
 * Promotional notification helpers
 */
export const promotionalNotifications = {
  /**
   * Send promotional notification to multiple users
   */
  sendBulkPromotion: async (
    userIds: string[],
    title: string,
    message: string,
    promotionData?: Record<string, any>,
    tenantId?: string
  ) => {
    try {
      return await notificationService.createBulkNotifications(
        {
          userIds,
          type: NotificationType.PROMOTION,
          channel: NotificationChannel.EMAIL,
          title,
          message,
          metadata: promotionData,
        },
        tenantId
      );
    } catch (error) {
      logger.error("Error sending bulk promotional notification:", error);
      throw error;
    }
  },

  /**
   * Send personalized discount notification
   */
  personalizedDiscount: async (
    userId: string,
    discountCode: string,
    discountPercentage: number,
    expiryDate: Date,
    tenantId?: string
  ) => {
    try {
      const notification: NotificationCreateDto = {
        userId,
        type: NotificationType.PROMOTION,
        channel: NotificationChannel.IN_APP,
        title: "Exclusive Discount Just for You!",
        message: `You've received a ${discountPercentage}% discount! Use code "${discountCode}" before ${expiryDate.toLocaleDateString()}.`,
        metadata: {
          discountCode,
          discountPercentage,
          expiryDate: expiryDate.toISOString(),
          type: "personalized_discount",
        },
      };

      return await notificationService.createNotification(
        notification,
        tenantId
      );
    } catch (error) {
      logger.error("Error sending personalized discount notification:", error);
      throw error;
    }
  },

  /**
   * Create general promotion notification
   */
  createPromotionNotification: async (
    userId: string,
    title: string,
    message: string,
    promotionData?: Record<string, any>,
    tenantId?: string
  ) => {
    try {
      const notification: NotificationCreateDto = {
        userId,
        type: NotificationType.PROMOTION,
        channel: NotificationChannel.IN_APP,
        title,
        message,
        metadata: {
          type: "general_promotion",
          ...promotionData,
        },
      };

      return await notificationService.createNotification(
        notification,
        tenantId
      );
    } catch (error) {
      logger.error("Error creating promotion notification:", error);
      throw error;
    }
  },
};

/**
 * Feedback automation helpers
 */
export const feedbackAutomation = {
  /**
   * Automatically request feedback after order delivery
   */
  requestAfterDelivery: async (
    orderId: string,
    userId: string,
    restaurantId: string,
    tenantId?: string
  ) => {
    try {
      const notification: NotificationCreateDto = {
        userId,
        type: NotificationType.ORDER_STATUS,
        channel: NotificationChannel.IN_APP,
        title: "How was your order?",
        message:
          "We'd love to hear about your experience! Please rate your order and leave feedback.",
        metadata: {
          orderId,
          restaurantId,
          type: "feedback_request",
          action: "rate_order",
        },
      };

      return await notificationService.createNotification(
        notification,
        tenantId
      );
    } catch (error) {
      logger.error("Error sending feedback request notification:", error);
      throw error;
    }
  },

  /**
   * Create feedback automatically (for integration with order completion)
   */
  createOrderFeedback: async (
    orderId: string,
    userId: string,
    type: FeedbackType,
    rating: number,
    comment?: string,
    tenantId?: string
  ) => {
    try {
      const feedbackData: FeedbackCreateDto = {
        orderId,
        userId,
        type,
        rating,
        comment,
      };

      return await feedbackService.createFeedback(feedbackData, tenantId);
    } catch (error) {
      logger.error("Error creating automated feedback:", error);
      throw error;
    }
  },
};

/**
 * System notification helpers
 */
export const systemNotifications = {
  /**
   * Send system maintenance notification
   */
  maintenance: async (
    userIds: string[],
    maintenanceStart: Date,
    maintenanceEnd: Date,
    tenantId?: string
  ) => {
    try {
      const duration = Math.ceil(
        (maintenanceEnd.getTime() - maintenanceStart.getTime()) /
          (1000 * 60 * 60)
      );

      return await notificationService.createBulkNotifications(
        {
          userIds,
          type: NotificationType.SYSTEM_ALERT,
          channel: NotificationChannel.EMAIL,
          title: "Scheduled Maintenance Notice",
          message: `Our platform will undergo maintenance from ${maintenanceStart.toLocaleString()} to ${maintenanceEnd.toLocaleString()} (approximately ${duration} hours). We apologize for any inconvenience.`,
          metadata: {
            maintenanceStart: maintenanceStart.toISOString(),
            maintenanceEnd: maintenanceEnd.toISOString(),
            type: "maintenance",
          },
        },
        tenantId
      );
    } catch (error) {
      logger.error("Error sending maintenance notification:", error);
      throw error;
    }
  },

  /**
   * Send security alert notification
   */
  securityAlert: async (
    userId: string,
    alertType: string,
    details: Record<string, any>,
    tenantId?: string
  ) => {
    try {
      const notification: NotificationCreateDto = {
        userId,
        type: NotificationType.SYSTEM_ALERT,
        channel: NotificationChannel.EMAIL,
        title: "Security Alert",
        message: `We detected ${alertType} on your account. If this wasn't you, please secure your account immediately.`,
        metadata: {
          alertType,
          timestamp: new Date().toISOString(),
          ...details,
        },
      };

      return await notificationService.createNotification(
        notification,
        tenantId
      );
    } catch (error) {
      logger.error("Error sending security alert notification:", error);
      throw error;
    }
  },
};

/**
 * Export all integration helpers
 */
export const notificationIntegration = {
  order: orderNotifications,
  restaurant: restaurantNotifications,
  promotional: promotionalNotifications,
  feedback: feedbackAutomation,
  system: systemNotifications,
};
