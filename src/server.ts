import dotenv from "dotenv";
import app from "./app"; // Import the configured app instance
import prisma from "./db"; // Import the Prisma client
import logger from "./utils/logger"; // Import the logger
import { EmailQueueService } from "./services/email-queue.service";
import { EmailMonitoringService } from "./services/email-monitoring.service";
import { OAuthTokenService } from "./services/oauth-token.service";

dotenv.config();
// const port: number = Number(process.env.PORT) || 8080;
const port: number = 8080;

// Function to start the server after checking DB connection
const startServer = async () => {
  try {
    // Test the database connection with Prisma
    await prisma.$connect();
    logger.info("Database connected successfully.");

    // Start the server if DB connection is successful
    app.listen(port, () => {
      logger.info(`Server running on port ${port}`);
    });
  } catch (err) {
    logger.error(
      `Failed to connect to the database: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
    process.exit(1); // Exit the process if DB connection fails
  }
};

// Start email services
EmailQueueService.startQueueProcessor();
EmailMonitoringService.startMonitoring();
OAuthTokenService.scheduleTokenRefresh();

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("Shutting down gracefully...");
  EmailQueueService.stopQueueProcessor();
  EmailMonitoringService.stopMonitoring();
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("Shutting down gracefully...");
  EmailQueueService.stopQueueProcessor();
  EmailMonitoringService.stopMonitoring();
  process.exit(0);
});

// Process-level error handling
process.on("uncaughtException", (error) => {
  logger.error(`Uncaught Exception: ${error.message}`, { stack: error.stack });
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  logger.error(
    `Unhandled Rejection: ${
      reason instanceof Error ? reason.message : String(reason)
    }`
  );
  process.exit(1);
});

// Call the function to start the server
startServer();
