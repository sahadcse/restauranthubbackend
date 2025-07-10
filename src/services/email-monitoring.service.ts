import { PrismaClient } from "../../prisma/generated/prisma";
import { EmailQueueService } from "./email-queue.service";
import { testEmailConnection } from "../utils/email.utils";
import logger from "../utils/logger";

const prisma = new PrismaClient();

export interface EmailHealthReport {
  status: "HEALTHY" | "WARNING" | "CRITICAL";
  timestamp: Date;
  queueStats: {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    totalToday: number;
  };
  connectionStatus: {
    isConnected: boolean;
    lastTestedAt: Date;
    error?: string;
  };
  alerts: string[];
  metrics: {
    dailySuccessRate: number;
    averageProcessingTime: number;
    failureRate: number;
  };
}

export class EmailMonitoringService {
  private static monitoringInterval: NodeJS.Timeout | null = null;

  /**
   * Get comprehensive email system health report
   */
  static async getHealthReport(): Promise<EmailHealthReport> {
    const queueStats = await EmailQueueService.getQueueStats();
    const connectionTest = await testEmailConnection();
    const metrics = await this.calculateMetrics();

    const alerts: string[] = [];
    let status: "HEALTHY" | "WARNING" | "CRITICAL" = "HEALTHY";

    // Check for alerts
    if (!connectionTest.success) {
      alerts.push("Email connection failed");
      status = "CRITICAL";
    }

    if (queueStats.pending > 100) {
      alerts.push(`High pending email count: ${queueStats.pending}`);
      if (status !== "CRITICAL") status = "WARNING";
    }

    if (queueStats.failed > 50) {
      alerts.push(`High failed email count: ${queueStats.failed}`);
      if (status !== "CRITICAL") status = "WARNING";
    }

    if (metrics.failureRate > 0.1) {
      // More than 10% failure rate
      alerts.push(
        `High failure rate: ${(metrics.failureRate * 100).toFixed(1)}%`
      );
      if (status !== "CRITICAL") status = "WARNING";
    }

    if (metrics.dailySuccessRate < 0.9) {
      // Less than 90% success rate
      alerts.push(
        `Low daily success rate: ${(metrics.dailySuccessRate * 100).toFixed(
          1
        )}%`
      );
      status = "CRITICAL";
    }

    return {
      status,
      timestamp: new Date(),
      queueStats,
      connectionStatus: {
        isConnected: connectionTest.success,
        lastTestedAt: new Date(),
        error: connectionTest.success ? undefined : connectionTest.message,
      },
      alerts,
      metrics,
    };
  }

  /**
   * Calculate email system metrics
   */
  private static async calculateMetrics(): Promise<{
    dailySuccessRate: number;
    averageProcessingTime: number;
    failureRate: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todayStats, processingTimes] = await Promise.all([
      prisma.emailQueue.groupBy({
        by: ["status"],
        _count: {
          status: true,
        },
        where: {
          createdAt: {
            gte: today,
          },
        },
      }),
      prisma.emailQueue.findMany({
        where: {
          status: "COMPLETED",
          processedAt: { not: null },
          completedAt: { not: null },
          createdAt: {
            gte: today,
          },
        },
        select: {
          processedAt: true,
          completedAt: true,
        },
      }),
    ]);

    // Calculate daily success rate
    const totalToday = todayStats.reduce(
      (sum, stat) => sum + stat._count.status,
      0
    );
    const completedToday =
      todayStats.find((stat) => stat.status === "COMPLETED")?._count.status ||
      0;
    const dailySuccessRate = totalToday > 0 ? completedToday / totalToday : 1;

    // Calculate average processing time
    const processingTimesMs = processingTimes
      .filter((email) => email.processedAt && email.completedAt)
      .map(
        (email) =>
          new Date(email.completedAt!).getTime() -
          new Date(email.processedAt!).getTime()
      );

    const averageProcessingTime =
      processingTimesMs.length > 0
        ? processingTimesMs.reduce((sum, time) => sum + time, 0) /
          processingTimesMs.length /
          1000 // Convert to seconds
        : 0;

    // Calculate overall failure rate (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [totalLastWeek, failedLastWeek] = await Promise.all([
      prisma.emailQueue.count({
        where: {
          createdAt: {
            gte: sevenDaysAgo,
          },
        },
      }),
      prisma.emailQueue.count({
        where: {
          status: "FAILED",
          createdAt: {
            gte: sevenDaysAgo,
          },
        },
      }),
    ]);

    const failureRate = totalLastWeek > 0 ? failedLastWeek / totalLastWeek : 0;

    return {
      dailySuccessRate,
      averageProcessingTime,
      failureRate,
    };
  }

  /**
   * Send alert notification for critical issues
   */
  private static async sendAlert(message: string): Promise<void> {
    try {
      // Log the alert
      logger.error(`EMAIL SYSTEM ALERT: ${message}`);

      // You could also send alerts via Slack, Discord, or other notification services
      // await notificationService.sendAlert(message);
    } catch (error) {
      logger.error("Failed to send email system alert:", error);
    }
  }

  /**
   * Start monitoring service
   */
  static startMonitoring(): void {
    if (this.monitoringInterval) return;

    // Check email system health every 5 minutes
    this.monitoringInterval = setInterval(async () => {
      try {
        const healthReport = await this.getHealthReport();

        if (healthReport.status === "CRITICAL") {
          await this.sendAlert(
            `Email system is in CRITICAL state: ${healthReport.alerts.join(
              ", "
            )}`
          );
        } else if (healthReport.status === "WARNING") {
          logger.warn(
            `Email system warning: ${healthReport.alerts.join(", ")}`
          );
        }

        // Log health status
        logger.info("Email system health check completed", {
          status: healthReport.status,
          pending: healthReport.queueStats.pending,
          failed: healthReport.queueStats.failed,
          successRate: healthReport.metrics.dailySuccessRate,
        });
      } catch (error) {
        logger.error("Email monitoring check failed:", error);
        await this.sendAlert("Email monitoring system failure");
      }
    }, 5 * 60 * 1000); // 5 minutes

    logger.info("Email monitoring service started");
  }

  /**
   * Stop monitoring service
   */
  static stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      logger.info("Email monitoring service stopped");
    }
  }

  /**
   * Generate daily email report
   */
  static async generateDailyReport(): Promise<string> {
    const healthReport = await this.getHealthReport();

    return `
# Daily Email System Report - ${new Date().toISOString().split("T")[0]}

## System Status: ${healthReport.status}

### Queue Statistics
- Pending: ${healthReport.queueStats.pending}
- Processing: ${healthReport.queueStats.processing}
- Completed: ${healthReport.queueStats.completed}
- Failed: ${healthReport.queueStats.failed}
- Total Today: ${healthReport.queueStats.totalToday}

### Performance Metrics
- Daily Success Rate: ${(healthReport.metrics.dailySuccessRate * 100).toFixed(
      1
    )}%
- Average Processing Time: ${healthReport.metrics.averageProcessingTime.toFixed(
      2
    )}s
- Failure Rate (7 days): ${(healthReport.metrics.failureRate * 100).toFixed(1)}%

### Connection Status
- Connected: ${healthReport.connectionStatus.isConnected ? "Yes" : "No"}
- Last Tested: ${healthReport.connectionStatus.lastTestedAt.toISOString()}
${
  healthReport.connectionStatus.error
    ? `- Error: ${healthReport.connectionStatus.error}`
    : ""
}

### Alerts
${
  healthReport.alerts.length > 0
    ? healthReport.alerts.map((alert) => `- ${alert}`).join("\n")
    : "- No alerts"
}
    `;
  }
}
