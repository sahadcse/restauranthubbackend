import { Router } from "express";
import * as notificationController from "../controllers/notification.controller";
import * as feedbackController from "../controllers/feedback.controller";
import {
  authenticate,
  authorizeRoles,
} from "../../../middleware/auth.middleware";
import { validateRequest } from "../../../middleware/validation.middleware";
import {
  createNotificationSchema,
  updateNotificationSchema,
  bulkNotificationSchema,
  notificationQuerySchema,
  notificationParamsSchema,
  createFeedbackSchema,
  feedbackQuerySchema,
  feedbackParamsSchema,
  orderFeedbackParamsSchema,
  statsQuerySchema,
  userQuerySchema,
} from "../validations/notification.validation";
import { UserRole } from "../../../../prisma/generated/prisma";

const router = Router();

// -----------------------------------------------------------------------------
// Notification Routes
// ----------------------------------------------------------------------------/

/**
 * @route   GET /notifications
 * @desc    Get user's notifications with filtering and pagination
 * @access  Private (Authenticated Users)
 */
router.get(
  "/notifications",
  authenticate,
  validateRequest(notificationQuerySchema, "query"),
  notificationController.getUserNotifications
);

/**
 * @route   GET /notifications/unread-count
 * @desc    Get count of unread notifications for the user
 * @access  Private (Authenticated Users)
 */
router.get(
  "/notifications/unread-count",
  authenticate,
  notificationController.getUnreadCount
);

/**
 * @route   GET /notifications/stats
 * @desc    Get notification statistics
 * @access  Private (Admin or User for their own stats)
 */
router.get(
  "/notifications/stats",
  authenticate,
  notificationController.getNotificationStats
);

/**
 * @route   POST /notifications
 * @desc    Create a new notification
 * @access  Private (Admin, Super Admin)
 */
router.post(
  "/notifications",
  authenticate,
  authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateRequest(createNotificationSchema),
  notificationController.createNotification
);

/**
 * @route   POST /notifications/bulk
 * @desc    Create bulk notifications
 * @access  Private (Admin, Super Admin)
 */
router.post(
  "/notifications/bulk",
  authenticate,
  authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateRequest(bulkNotificationSchema),
  notificationController.createBulkNotifications
);

/**
 * @route   PUT /notifications/mark-all-read
 * @desc    Mark all notifications as read for the authenticated user
 * @access  Private (Authenticated Users)
 */
router.put(
  "/notifications/mark-all-read",
  authenticate,
  notificationController.markAllNotificationsAsRead
);

/**
 * @route   GET /notifications/:id
 * @desc    Get notification by ID
 * @access  Private (Owner or Admin)
 */
router.get(
  "/notifications/:id",
  authenticate,
  validateRequest(notificationParamsSchema, "params"),
  notificationController.getNotificationById
);

/**
 * @route   PUT /notifications/:id/read
 * @desc    Mark notification as read
 * @access  Private (Owner)
 */
router.put(
  "/notifications/:id/read",
  authenticate,
  validateRequest(notificationParamsSchema, "params"),
  notificationController.markNotificationAsRead
);

/**
 * @route   DELETE /notifications/:id
 * @desc    Delete notification
 * @access  Private (Owner or Admin)
 */
router.delete(
  "/notifications/:id",
  authenticate,
  validateRequest(notificationParamsSchema, "params"),
  notificationController.deleteNotification
);

// -----------------------------------------------------------------------------
// Feedback Routes
// ----------------------------------------------------------------------------/

/**
 * @route   GET /feedback
 * @desc    Get all feedback (Admin only)
 * @access  Private (Admin, Super Admin)
 */
router.get(
  "/feedback",
  authenticate,
  authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateRequest(feedbackQuerySchema, "query"),
  feedbackController.getAllFeedback
);

/**
 * @route   GET /feedback/user
 * @desc    Get current user's feedback
 * @access  Private (Authenticated Users)
 */
router.get(
  "/feedback/user",
  authenticate,
  validateRequest(userQuerySchema, "query"),
  feedbackController.getUserFeedback
);

/**
 * @route   GET /feedback/stats
 * @desc    Get feedback statistics
 * @access  Private (Admin, Restaurant Owner)
 */
router.get(
  "/feedback/stats",
  authenticate,
  authorizeRoles(
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.RESTAURANT_OWNER
  ),
  validateRequest(statsQuerySchema, "query"),
  feedbackController.getFeedbackStats
);

/**
 * @route   GET /feedback/recent
 * @desc    Get recent feedback for dashboard
 * @access  Private (Admin, Super Admin)
 */
router.get(
  "/feedback/recent",
  authenticate,
  authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateRequest(userQuerySchema, "query"),
  feedbackController.getRecentFeedback
);

/**
 * @route   POST /feedback
 * @desc    Create new feedback
 * @access  Private (Authenticated Users)
 */
router.post(
  "/feedback",
  authenticate,
  validateRequest(createFeedbackSchema),
  feedbackController.createFeedback
);

/**
 * @route   GET /feedback/orders/:orderId
 * @desc    Get feedback for specific order
 * @access  Private (Owner or Admin)
 */
router.get(
  "/feedback/orders/:orderId",
  authenticate,
  validateRequest(orderFeedbackParamsSchema, "params"),
  feedbackController.getFeedbackByOrderId
);

/**
 * @route   GET /feedback/:id
 * @desc    Get feedback by ID
 * @access  Private (Owner or Admin)
 */
router.get(
  "/feedback/:id",
  authenticate,
  validateRequest(feedbackParamsSchema, "params"),
  feedbackController.getFeedbackById
);

/**
 * @route   DELETE /feedback/:id
 * @desc    Delete feedback
 * @access  Private (Owner or Admin)
 */
router.delete(
  "/feedback/:id",
  authenticate,
  validateRequest(feedbackParamsSchema, "params"),
  feedbackController.deleteFeedback
);

/**
 * @route   GET /feedback/restaurants/:restaurantId/rating
 * @desc    Get average rating for a restaurant
 * @access  Public
 */
router.get(
  "/feedback/restaurants/:restaurantId/rating",
  feedbackController.getRestaurantAverageRating
);

export default router;
