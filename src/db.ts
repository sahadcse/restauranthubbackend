import { PrismaClient } from "../prisma/generated/prisma";
import logger from "./utils/logger";

// Create a singleton instance of PrismaClient
const prisma = new PrismaClient({
  log:
    process.env.NODE_ENV === "development"
      ? ["query", "error", "warn"]
      : ["error"],
});

// Handle potential connection errors
prisma
  .$connect()
  .then((): void => {
    // logger.info("Successfully connected to the database");
  })
  .catch((error: Error): void => {
    logger.error(`Failed to connect to the database: ${error.message}`);
  });

// Add shutdown handling for graceful exit
process.on("beforeExit", async () => {
  await prisma.$disconnect();
  logger.info("Database connection closed");
});

export default prisma;
