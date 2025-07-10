import { PrismaClient } from "../../prisma/generated/prisma";
import { sendEmail } from "../utils/email.utils";
import logger from "../utils/logger";

const prisma = new PrismaClient();

export interface EmailJob {
  id?: string;
  to: string;
  subject: string;
  html: string;
  text?: string;
  priority?: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  template?: string;
  templateData?: any;
  scheduledFor?: Date;
  maxRetries?: number;
  retryCount?: number;
}

export interface EmailQueueStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  totalToday: number;
}

export class EmailQueueService {
  private static isProcessing = false;
  private static processingInterval: NodeJS.Timeout | null = null;

  /**
   * Add email to queue
   */
  static async queueEmail(emailJob: EmailJob): Promise<void> {
    try {
      await prisma.emailQueue.create({
        data: {
          to: emailJob.to,
          subject: emailJob.subject,
          html: emailJob.html,
          text: emailJob.text,
          priority: emailJob.priority || "NORMAL",
          template: emailJob.template,
          templateData: emailJob.templateData
            ? JSON.stringify(emailJob.templateData)
            : null,
          scheduledFor: emailJob.scheduledFor || new Date(),
          maxRetries: emailJob.maxRetries || 3,
          status: "PENDING",
        },
      });

      logger.info(`Email queued for ${emailJob.to}: ${emailJob.subject}`);
    } catch (error) {
      logger.error("Failed to queue email:", error);
      throw new Error("Failed to queue email");
    }
  }

  /**
   * Process email queue
   */
  static async processQueue(): Promise<void> {
    if (this.isProcessing) return;

    this.isProcessing = true;
    logger.info("Starting email queue processing");

    try {
      // Get pending emails ordered by priority and scheduled time
      const pendingEmails = await prisma.emailQueue.findMany({
        where: {
          status: "PENDING",
          scheduledFor: {
            lte: new Date(),
          },
        },
        orderBy: [
          {
            priority: "desc", // HIGH priority first
          },
          {
            scheduledFor: "asc", // Older emails first
          },
        ],
        take: 10, // Process 10 emails at a time
      });

      for (const emailJob of pendingEmails) {
        await this.processEmail(emailJob);
      }

      // Retry failed emails that haven't exceeded max retries
      await this.retryFailedEmails();
    } catch (error) {
      logger.error("Error processing email queue:", error);
    } finally {
      this.isProcessing = false;
      logger.info("Email queue processing completed");
    }
  }

  /**
   * Process individual email
   */
  private static async processEmail(emailJob: any): Promise<void> {
    try {
      // Mark as processing
      await prisma.emailQueue.update({
        where: { id: emailJob.id },
        data: {
          status: "PROCESSING",
          processedAt: new Date(),
        },
      });

      // Send email
      const success = await sendEmail(
        emailJob.to,
        emailJob.subject,
        emailJob.html,
        emailJob.text
      );

      if (success) {
        // Mark as completed
        await prisma.emailQueue.update({
          where: { id: emailJob.id },
          data: {
            status: "COMPLETED",
            completedAt: new Date(),
          },
        });

        logger.info(`Email sent successfully to ${emailJob.to}`);
      } else {
        throw new Error("Email sending failed");
      }
    } catch (error) {
      logger.error(`Failed to send email to ${emailJob.to}:`, error);

      // Update retry count and status
      const newRetryCount = (emailJob.retryCount || 0) + 1;
      const maxRetries = emailJob.maxRetries || 3;

      if (newRetryCount >= maxRetries) {
        // Mark as failed permanently
        await prisma.emailQueue.update({
          where: { id: emailJob.id },
          data: {
            status: "FAILED",
            retryCount: newRetryCount,
            lastError: error instanceof Error ? error.message : "Unknown error",
            failedAt: new Date(),
          },
        });
      } else {
        // Schedule for retry
        const nextRetryTime = new Date();
        nextRetryTime.setMinutes(
          nextRetryTime.getMinutes() + newRetryCount * 5
        ); // Exponential backoff

        await prisma.emailQueue.update({
          where: { id: emailJob.id },
          data: {
            status: "PENDING",
            retryCount: newRetryCount,
            scheduledFor: nextRetryTime,
            lastError: error instanceof Error ? error.message : "Unknown error",
          },
        });
      }
    }
  }

  /**
   * Retry failed emails
   */
  private static async retryFailedEmails(): Promise<void> {
    const retryableEmails = await prisma.emailQueue.findMany({
      where: {
        status: "PENDING",
        retryCount: {
          gt: 0,
        },
        scheduledFor: {
          lte: new Date(),
        },
      },
      take: 5, // Limit retries per batch
    });

    for (const email of retryableEmails) {
      await this.processEmail(email);
    }
  }

  /**
   * Get queue statistics
   */
  static async getQueueStats(): Promise<EmailQueueStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [pending, processing, completed, failed, totalToday] =
      await Promise.all([
        prisma.emailQueue.count({
          where: { status: "PENDING" },
        }),
        prisma.emailQueue.count({
          where: { status: "PROCESSING" },
        }),
        prisma.emailQueue.count({
          where: { status: "COMPLETED" },
        }),
        prisma.emailQueue.count({
          where: { status: "FAILED" },
        }),
        prisma.emailQueue.count({
          where: {
            createdAt: {
              gte: today,
            },
          },
        }),
      ]);

    return {
      pending,
      processing,
      completed,
      failed,
      totalToday,
    };
  }

  /**
   * Start queue processing interval
   */
  static startQueueProcessor(): void {
    if (this.processingInterval) return;

    // Process queue every 30 seconds
    this.processingInterval = setInterval(() => {
      this.processQueue().catch((error) => {
        logger.error("Queue processing error:", error);
      });
    }, 30000);

    logger.info("Email queue processor started");
  }

  /**
   * Stop queue processing interval
   */
  static stopQueueProcessor(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
      logger.info("Email queue processor stopped");
    }
  }

  /**
   * Clean up old completed/failed emails
   */
  static async cleanupOldEmails(): Promise<void> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await prisma.emailQueue.deleteMany({
      where: {
        OR: [
          {
            status: "COMPLETED",
            completedAt: {
              lt: thirtyDaysAgo,
            },
          },
          {
            status: "FAILED",
            failedAt: {
              lt: thirtyDaysAgo,
            },
          },
        ],
      },
    });

    logger.info(`Cleaned up ${result.count} old email records`);
  }
}
