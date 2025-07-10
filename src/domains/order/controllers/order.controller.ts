import { Request, Response } from "express";
import * as orderService from "../services/order.service";
import * as authorizationService from "../services/authorization.service";
import { UserRole } from "../../../../prisma/generated/prisma";
import logger from "../../../utils/logger";

// Order controllers
export const getAllOrders = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    // Use validated query parameters from the validation middleware
    const validatedQuery = (req as any).validatedQuery || {};
    const { page = 1, limit = 20, ...filters } = validatedQuery;

    // Apply role-based authorization filters
    const authorizedFilters = await authorizationService.applyOrderFilters(
      user,
      filters
    );

    const orders = await orderService.getAllOrders(
      page,
      limit,
      authorizedFilters
    );

    res.status(200).json({
      ...orders,
      meta: {
        userRole: user.role,
        filtersApplied: Object.keys(authorizedFilters),
      },
    });
  } catch (error) {
    logger.error("Error in getAllOrders:", error);
    res.status(500).json({
      message: "Failed to fetch orders",
      error: (error as Error).message,
    });
  }
};

export const getOrderById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.user;

    if (!user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    const order = await orderService.getOrderById(id);

    if (!order) {
      res.status(404).json({ message: "Order not found" });
      return;
    }

    // Check if user has permission to view this order
    const hasAccess = await authorizationService.canAccessOrder(user, order);
    if (!hasAccess) {
      res.status(403).json({ message: "Access denied to this order" });
      return;
    }

    res.status(200).json(order);
  } catch (error) {
    logger.error(`Error in getOrderById for id ${req.params.id}:`, error);
    res.status(500).json({
      message: "Failed to fetch order",
      error: (error as Error).message,
    });
  }
};

export const createOrder = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    const tenantId = req.body.restaurantId; // Use restaurant as tenant

    const newOrder = await orderService.createOrder(
      req.body,
      user.id,
      tenantId
    );

    res.status(201).json({
      ...newOrder,
      meta: {
        message: "Order created successfully",
        orderId: newOrder.id,
      },
    });
  } catch (error) {
    logger.error("Error in createOrder:", error);
    res.status(400).json({
      message: "Failed to create order",
      error: (error as Error).message,
    });
  }
};

export const updateOrder = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.user;

    if (!user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    // Get the order first to check permissions
    const order = await orderService.getOrderById(id);
    if (!order) {
      res.status(404).json({ message: "Order not found" });
      return;
    }

    // Check if user can update this order
    const canUpdate = await authorizationService.canUpdateOrder(user, order);
    if (!canUpdate) {
      res.status(403).json({ message: "Access denied to update this order" });
      return;
    }

    const updatedOrder = await orderService.updateOrder(id, req.body, user.id);

    res.status(200).json({
      ...updatedOrder,
      meta: {
        message: "Order updated successfully",
        updatedBy: user.id,
      },
    });
  } catch (error) {
    logger.error(`Error in updateOrder for id ${req.params.id}:`, error);
    res.status(400).json({
      message: "Failed to update order",
      error: (error as Error).message,
    });
  }
};

// Payment controllers
export const getPaymentsByOrderId = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { orderId } = req.params;
    const user = req.user;

    if (!user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    // Check if user can access the order
    const order = await orderService.getOrderById(orderId);
    if (!order) {
      res.status(404).json({ message: "Order not found" });
      return;
    }

    const hasAccess = await authorizationService.canAccessOrder(user, order);
    if (!hasAccess) {
      res.status(403).json({ message: "Access denied to order payments" });
      return;
    }

    const payments = await orderService.getPaymentsByOrderId(orderId);
    res.status(200).json(payments);
  } catch (error) {
    logger.error(
      `Error in getPaymentsByOrderId for orderId ${req.params.orderId}:`,
      error
    );
    res.status(500).json({
      message: "Failed to fetch payments",
      error: (error as Error).message,
    });
  }
};

export const getPaymentById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.user;

    if (!user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    const payment = await orderService.getPaymentById(id);

    if (!payment) {
      res.status(404).json({ message: "Payment not found" });
      return;
    }

    // Check if user can access the related order
    const order = await orderService.getOrderById(payment.orderId);
    if (!order) {
      res.status(404).json({ message: "Related order not found" });
      return;
    }

    const hasAccess = await authorizationService.canAccessOrder(user, order);
    if (!hasAccess) {
      res.status(403).json({ message: "Access denied to this payment" });
      return;
    }

    res.status(200).json(payment);
  } catch (error) {
    logger.error(`Error in getPaymentById for id ${req.params.id}:`, error);
    res.status(500).json({
      message: "Failed to fetch payment",
      error: (error as Error).message,
    });
  }
};

export const createPayment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    // Verify user can create payment for this order
    const order = await orderService.getOrderById(req.body.orderId);
    if (!order) {
      res.status(404).json({ message: "Order not found" });
      return;
    }

    const canAccess = await authorizationService.canAccessOrder(user, order);
    if (!canAccess) {
      res
        .status(403)
        .json({ message: "Access denied to create payment for this order" });
      return;
    }

    const newPayment = await orderService.createPayment(req.body);
    res.status(201).json(newPayment);
  } catch (error) {
    logger.error("Error in createPayment:", error);
    res.status(400).json({
      message: "Failed to create payment",
      error: (error as Error).message,
    });
  }
};

export const updatePayment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.user;

    if (!user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    // Authorization is now handled by the route middleware
    const updatedPayment = await orderService.updatePayment(
      id,
      req.body,
      user.id
    );

    if (!updatedPayment) {
      res.status(404).json({ message: "Payment not found" });
      return;
    }

    res.status(200).json(updatedPayment);
  } catch (error) {
    logger.error(`Error in updatePayment for id ${req.params.id}:`, error);
    res.status(400).json({
      message: "Failed to update payment",
      error: (error as Error).message,
    });
  }
};

// Delivery controllers
export const getAllDeliveries = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    // Use validated query parameters from the validation middleware
    const validatedQuery = (req as any).validatedQuery || {};
    const { page = 1, limit = 20, ...filters } = validatedQuery;

    // Apply role-based filters for deliveries
    const authorizedFilters = await authorizationService.applyDeliveryFilters(
      user,
      filters
    );

    const deliveries = await orderService.getAllDeliveries(
      page,
      limit,
      authorizedFilters
    );

    res.status(200).json(deliveries);
  } catch (error) {
    logger.error("Error in getAllDeliveries:", error);
    res.status(500).json({
      message: "Failed to fetch deliveries",
      error: (error as Error).message,
    });
  }
};

export const getDeliveryById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.user;

    if (!user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    const delivery = await orderService.getDeliveryById(id);

    if (!delivery) {
      res.status(404).json({ message: "Delivery not found" });
      return;
    }

    // Check if user can access this delivery
    const canAccess = await authorizationService.canAccessDelivery(
      user,
      delivery
    );
    if (!canAccess) {
      res.status(403).json({ message: "Access denied to this delivery" });
      return;
    }

    res.status(200).json(delivery);
  } catch (error) {
    logger.error(`Error in getDeliveryById for id ${req.params.id}:`, error);
    res.status(500).json({
      message: "Failed to fetch delivery",
      error: (error as Error).message,
    });
  }
};

export const createDelivery = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    const tenantId = req.body.tenantId || "DEFAULT";
    const newDelivery = await orderService.createDelivery(req.body, tenantId);
    res.status(201).json(newDelivery);
  } catch (error) {
    logger.error("Error in createDelivery:", error);
    res.status(400).json({
      message: "Failed to create delivery",
      error: (error as Error).message,
    });
  }
};

export const updateDelivery = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.user;

    if (!user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    // Check if user can update this delivery
    const delivery = await orderService.getDeliveryById(id);
    if (!delivery) {
      res.status(404).json({ message: "Delivery not found" });
      return;
    }

    const canUpdate = await authorizationService.canUpdateDelivery(
      user,
      delivery
    );
    if (!canUpdate) {
      res
        .status(403)
        .json({ message: "Access denied to update this delivery" });
      return;
    }

    const updatedDelivery = await orderService.updateDelivery(id, req.body);
    res.status(200).json(updatedDelivery);
  } catch (error) {
    logger.error(`Error in updateDelivery for id ${req.params.id}:`, error);
    res.status(400).json({
      message: "Failed to update delivery",
      error: (error as Error).message,
    });
  }
};

// Driver controllers
export const getAllDrivers = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const drivers = await orderService.getAllDrivers();
    res.status(200).json(drivers);
  } catch (error) {
    logger.error("Error in getAllDrivers:", error);
    res.status(500).json({
      message: "Failed to fetch drivers",
      error: (error as Error).message,
    });
  }
};

export const getDriverById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const driver = await orderService.getDriverById(id);

    if (!driver) {
      res.status(404).json({ message: "Driver not found" });
      return;
    }

    res.status(200).json(driver);
  } catch (error) {
    logger.error(`Error in getDriverById for id ${req.params.id}:`, error);
    res.status(500).json({
      message: "Failed to fetch driver",
      error: (error as Error).message,
    });
  }
};

export const createDriver = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const tenantId = req.body.tenantId || "DEFAULT";
    const newDriver = await orderService.createDriver(req.body, tenantId);
    res.status(201).json(newDriver);
  } catch (error) {
    logger.error("Error in createDriver:", error);
    res.status(400).json({
      message: "Failed to create driver",
      error: (error as Error).message,
    });
  }
};

export const updateDriver = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const updatedDriver = await orderService.updateDriver(id, req.body);

    if (!updatedDriver) {
      res.status(404).json({ message: "Driver not found" });
      return;
    }

    res.status(200).json(updatedDriver);
  } catch (error) {
    logger.error(`Error in updateDriver for id ${req.params.id}:`, error);
    res.status(400).json({
      message: "Failed to update driver",
      error: (error as Error).message,
    });
  }
};

// Order Cancellation controllers
export const createOrderCancellation = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = req.user;

    if (!user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    // Check if user can cancel this order
    const order = await orderService.getOrderById(req.body.orderId);
    if (!order) {
      res.status(404).json({ message: "Order not found" });
      return;
    }

    const canCancel = await authorizationService.canCancelOrder(user, order);
    if (!canCancel) {
      res.status(403).json({ message: "Access denied to cancel this order" });
      return;
    }

    const newCancellation = await orderService.createOrderCancellation(
      req.body,
      user.id
    );
    res.status(201).json(newCancellation);
  } catch (error) {
    logger.error("Error in createOrderCancellation:", error);
    res.status(400).json({
      message: "Failed to create order cancellation",
      error: (error as Error).message,
    });
  }
};

export const updateOrderCancellation = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.user;

    if (!user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    const updatedCancellation = await orderService.updateOrderCancellation(
      id,
      req.body,
      user.id
    );

    if (!updatedCancellation) {
      res.status(404).json({ message: "Order cancellation not found" });
      return;
    }

    res.status(200).json(updatedCancellation);
  } catch (error) {
    logger.error(
      `Error in updateOrderCancellation for id ${req.params.id}:`,
      error
    );
    res.status(400).json({
      message: "Failed to update order cancellation",
      error: (error as Error).message,
    });
  }
};

export const getOrderCancellationById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.user;

    if (!user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    const cancellation = await orderService.getOrderCancellationById(id);

    if (!cancellation) {
      res.status(404).json({ message: "Order cancellation not found" });
      return;
    }

    // Check if user can access this cancellation
    const canAccess = await authorizationService.canAccessOrderCancellation(
      user,
      cancellation
    );
    if (!canAccess) {
      res.status(403).json({ message: "Access denied to this cancellation" });
      return;
    }

    res.status(200).json(cancellation);
  } catch (error) {
    logger.error(
      `Error in getOrderCancellationById for id ${req.params.id}:`,
      error
    );
    res.status(500).json({
      message: "Failed to fetch order cancellation",
      error: (error as Error).message,
    });
  }
};

export const getAllOrderCancellations = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    // Use validated query parameters from the validation middleware
    const validatedQuery = (req as any).validatedQuery || {};
    const { page = 1, limit = 20, ...filters } = validatedQuery;

    // Apply role-based filters for cancellations
    const authorizedFilters =
      await authorizationService.applyCancellationFilters(user, filters);

    const cancellations = await orderService.getAllOrderCancellations(
      page,
      limit,
      authorizedFilters
    );

    res.status(200).json(cancellations);
  } catch (error) {
    logger.error("Error in getAllOrderCancellations:", error);
    res.status(500).json({
      message: "Failed to fetch order cancellations",
      error: (error as Error).message,
    });
  }
};
