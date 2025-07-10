import { Router } from "express";
import * as systemController from "./controllers/system.controller";
import {
  authenticate,
  authorizeRoles,
} from "../../../middleware/auth.middleware";
import { UserRole } from "../../../../prisma/generated/prisma";

const router = Router();

/**
 * @route GET /admin/system/test-email
 * @desc Test email configuration
 * @access Admin only
 */
router.get(
  "/test-email",
  authenticate,
  authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  systemController.testEmailSetup
);

/**
 * @route GET /admin/system/health
 * @desc Comprehensive system health check
 * @access Admin only
 */
router.get(
  "/health",
  authenticate,
  authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  systemController.healthCheck
);

/**
 * @route GET /admin/system/email/health
 * @desc Get email system health report
 * @access Admin only
 */
router.get(
  "/email/health",
  authenticate,
  authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  systemController.getEmailHealth
);

/**
 * @route GET /admin/system/email/queue-stats
 * @desc Get email queue statistics
 * @access Admin only
 */
router.get(
  "/email/queue-stats",
  authenticate,
  authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  systemController.getEmailQueueStats
);

/**
 * @route POST /admin/system/email/process-queue
 * @desc Manually process email queue
 * @access Admin only
 */
router.post(
  "/email/process-queue",
  authenticate,
  authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  systemController.processEmailQueue
);

/**
 * @route POST /admin/system/email/cleanup
 * @desc Clean up old email records
 * @access Admin only
 */
router.post(
  "/email/cleanup",
  authenticate,
  authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  systemController.cleanupEmailQueue
);

/**
 * @route GET /admin/system/email/daily-report
 * @desc Generate daily email report
 * @access Admin only
 */
router.get(
  "/email/daily-report",
  authenticate,
  authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  systemController.getEmailDailyReport
);

export default router;
