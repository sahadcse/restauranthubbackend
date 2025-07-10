import { Request, Response, NextFunction } from "express";
import { testEmailConnection } from "../../../../utils/email.utils";
import { UserRole } from "../../../../../prisma/generated/prisma";
import AppError from "../../../../utils/AppError";
import { PrismaClient } from "../../../../../prisma/generated/prisma";
import { EmailMonitoringService } from "../../../../services/email-monitoring.service";
import { EmailQueueService } from "../../../../services/email-queue.service";

const prisma = new PrismaClient();

/**
 * Test email configuration and connectivity with enhanced diagnostics
 */
export const testEmailSetup = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Ensure only admins can access this endpoint
    if (
      !req.user ||
      (req.user.role !== UserRole.ADMIN &&
        req.user.role !== UserRole.SUPER_ADMIN)
    ) {
      throw new AppError("Forbidden: Admin access required", 403);
    }

    const result = await testEmailConnection();

    // Return detailed diagnostics for admins
    res.status(result.success ? 200 : 400).json({
      status: result.success ? "success" : "error",
      message: result.message,
      details: result.details,
      timestamp: new Date().toISOString(),
      recommendations: result.details?.recommendations || [],
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Comprehensive system health check
 */
export const healthCheck = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const healthStatus = {
      status: "ok",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      environment: process.env.NODE_ENV || "development",
      checks: {
        database: "unknown" as string,
        memory: {} as any,
        uptime: "unknown" as string,
      },
    };

    // Check database connectivity
    try {
      await prisma.$queryRaw`SELECT 1`;
      healthStatus.checks.database = "connected";
    } catch (error) {
      healthStatus.checks.database = "disconnected";
      healthStatus.status = "error";
    }

    // Check memory usage
    const memUsage = process.memoryUsage();
    healthStatus.checks.memory = {
      used: Math.round(memUsage.heapUsed / 1024 / 1024) + " MB",
      total: Math.round(memUsage.heapTotal / 1024 / 1024) + " MB",
      external: Math.round(memUsage.external / 1024 / 1024) + " MB",
    };

    // Check uptime
    healthStatus.checks.uptime = Math.round(process.uptime()) + " seconds";

    // Set appropriate status code
    const statusCode = healthStatus.status === "ok" ? 200 : 503;

    res.status(statusCode).json({
      success: healthStatus.status === "ok",
      data: healthStatus,
    });
  } catch (error) {
    console.error("Health check error:", error);
    res.status(503).json({
      success: false,
      data: {
        status: "error",
        timestamp: new Date().toISOString(),
        message: "Health check failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
};

/**
 * Get comprehensive email system health report
 */
export const getEmailHealth = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Ensure only admins can access this endpoint
    if (
      !req.user ||
      (req.user.role !== UserRole.ADMIN &&
        req.user.role !== UserRole.SUPER_ADMIN)
    ) {
      throw new AppError("Forbidden: Admin access required", 403);
    }

    const healthReport = await EmailMonitoringService.getHealthReport();

    res.status(200).json({
      status: "success",
      data: healthReport,
    });
  } catch (error) {
    console.error("Email health check error:", error);
    res.status(500).json({
      status: "error",
      message:
        error instanceof Error ? error.message : "Email health check failed",
    });
  }
};

/**
 * Get email queue statistics
 */
export const getEmailQueueStats = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (
      !req.user ||
      (req.user.role !== UserRole.ADMIN &&
        req.user.role !== UserRole.SUPER_ADMIN)
    ) {
      throw new AppError("Forbidden: Admin access required", 403);
    }

    const stats = await EmailQueueService.getQueueStats();

    res.status(200).json({
      status: "success",
      data: stats,
    });
  } catch (error) {
    console.error("Email queue stats error:", error);
    res.status(500).json({
      status: "error",
      message:
        error instanceof Error ? error.message : "Failed to get queue stats",
    });
  }
};

/**
 * Manually process email queue
 */
export const processEmailQueue = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (
      !req.user ||
      (req.user.role !== UserRole.ADMIN &&
        req.user.role !== UserRole.SUPER_ADMIN)
    ) {
      throw new AppError("Forbidden: Admin access required", 403);
    }

    await EmailQueueService.processQueue();

    res.status(200).json({
      status: "success",
      message: "Email queue processed successfully",
    });
  } catch (error) {
    console.error("Email queue processing error:", error);
    res.status(500).json({
      status: "error",
      message:
        error instanceof Error ? error.message : "Failed to process queue",
    });
  }
};

/**
 * Clean up old email records
 */
export const cleanupEmailQueue = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (
      !req.user ||
      (req.user.role !== UserRole.ADMIN &&
        req.user.role !== UserRole.SUPER_ADMIN)
    ) {
      throw new AppError("Forbidden: Admin access required", 403);
    }

    await EmailQueueService.cleanupOldEmails();

    res.status(200).json({
      status: "success",
      message: "Email queue cleanup completed",
    });
  } catch (error) {
    console.error("Email cleanup error:", error);
    res.status(500).json({
      status: "error",
      message:
        error instanceof Error ? error.message : "Failed to cleanup emails",
    });
  }
};

/**
 * Generate daily email report
 */
export const getEmailDailyReport = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (
      !req.user ||
      (req.user.role !== UserRole.ADMIN &&
        req.user.role !== UserRole.SUPER_ADMIN)
    ) {
      throw new AppError("Forbidden: Admin access required", 403);
    }

    const report = await EmailMonitoringService.generateDailyReport();

    res.status(200).json({
      status: "success",
      data: {
        report,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Email report generation error:", error);
    res.status(500).json({
      status: "error",
      message:
        error instanceof Error ? error.message : "Failed to generate report",
    });
  }
};
