import { Router, Request, Response } from "express";

// Import user routes
import userRouter from "../domains/user/register/routes/user.routes";
import authRouter from "../domains/user/auth/routes/auth.routes";
import systemRouter from "../domains/admin/system/system.routes";
import restaurantRouter from "../domains/restaurant/routes/restaurant.routes";
import orderRouter from "../domains/order/routes/order.routes";
import paymentRoutes from "../domains/order/routes/payment.routes";
import { mediaRouter } from "../domains/media";
import { cartRoutes } from "../domains/cart";
import { contentRoutes } from "../domains/content";
import { notificationRoutes } from "../domains/notification";
import inventoryRoutes from "../domains/inventory/routes/inventory.routes";
import { PrismaClient } from "../../prisma/generated/prisma";

const prisma = new PrismaClient();
const router = Router();

// Root route
router.get("/", (req: Request, res: Response) => {
  res.json({
    message: "Restaurant E-Commerce Hub Backend API",
    version: "1.0.0",
    status: "operational",
    timestamp: new Date().toISOString(),
  });
});

// Database test route
router.get("/db-test", async (req: Request, res: Response) => {
  try {
    await prisma.$connect();
    res.json({
      status: "success",
      message: "Database connected successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: "Database connection failed",
      error: (err as Error).message,
      timestamp: new Date().toISOString(),
    });
  } finally {
    await prisma.$disconnect();
  }
});

// User routes
router.use("/users", userRouter);

// Auth routes
router.use("/auth", authRouter);

// Admin system routes
router.use("/admin/system", systemRouter);

// Restaurant management routes
router.use("/restaurants", restaurantRouter);

// Order management routes
router.use("/orders", orderRouter);

// Payment processing routes (separate from orders for webhooks)
router.use("/payments", paymentRoutes);

// Media routes
router.use("/media", mediaRouter);

// Cart management routes
router.use("/cart", cartRoutes);

// Content management routes
router.use("/content", contentRoutes);

// Notification and feedback routes
router.use("/notifications", notificationRoutes);

// Inventory routes
router.use("/inventory", inventoryRoutes);

export default router;
