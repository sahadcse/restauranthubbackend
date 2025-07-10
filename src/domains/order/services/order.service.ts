import * as orderRepository from "../repositories/order.repository";
import {
  findRestaurantById,
  findMenuItemById,
} from "../../restaurant/repositories/restaurant.repository";
import logger from "../../../utils/logger";
import { v4 as uuidv4 } from "uuid";
import {
  OrderStatus,
  PaymentStatus,
  DeliveryStatus,
  OrderType,
  OrderCancellationStatus,
} from "../../../../prisma/generated/prisma";
import * as inventoryService from "../../inventory/services/inventory.service";
// Add notification integration
import { notificationIntegration } from "../../notification/services/integration.service";

// Types for better type safety
interface OrderItem {
  menuItemId: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
  subtotal?: number;
}

interface CreateOrderData {
  restaurantId: string;
  items: OrderItem[];
  orderType: OrderType;
  deliveryAddress?: any;
  notes?: string;
  deliveryInstructions?: string;
  priority?: string;
  source?: string;
  customerName?: string; // Add optional customer name
  customerPhone?: string; // Add optional customer phone
  customerEmail?: string; // Add optional customer email
}

interface OrderTotals {
  subtotal: number;
  tax: number;
  deliveryFee: number;
  discount: number;
  total: number;
}

// Helper function to calculate order totals
const calculateOrderTotals = (
  items: OrderItem[],
  taxRate = 0,
  deliveryFee = 0,
  discount = 0
): OrderTotals => {
  const subtotal = items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );
  const tax = subtotal * (taxRate / 100);
  const total = subtotal + tax + deliveryFee - discount;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    deliveryFee: Math.round(deliveryFee * 100) / 100,
    discount: Math.round(discount * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
};

// Order services
export const getAllOrders = async (page = 1, limit = 20, filters = {}) => {
  try {
    return await orderRepository.findAllOrders(page, limit, filters);
  } catch (error) {
    logger.error("Service error in getAllOrders:", error);
    throw new Error(`Failed to get orders: ${(error as Error).message}`);
  }
};

export const getOrderById = async (id: string) => {
  try {
    if (!id || typeof id !== "string") {
      throw new Error("Valid order ID is required");
    }

    return await orderRepository.findOrderById(id);
  } catch (error) {
    logger.error(`Service error in getOrderById for id ${id}:`, error);
    throw new Error(`Failed to get order: ${(error as Error).message}`);
  }
};

export const createOrder = async (
  data: CreateOrderData,
  userId: string,
  tenantId: string
) => {
  try {
    // Input validation
    if (!data.restaurantId || !data.items || data.items.length === 0) {
      throw new Error("Restaurant ID and items are required");
    }

    if (!userId) {
      throw new Error("User ID is required");
    }

    // Validate restaurant exists
    const restaurant = await findRestaurantById(data.restaurantId);
    if (!restaurant) {
      throw new Error(`Restaurant with ID ${data.restaurantId} not found`);
    }

    // Validate restaurant is active
    if (!restaurant.isActive) {
      throw new Error("Restaurant is currently not accepting orders");
    }

    // Validate menu items exist and calculate totals
    const validatedItems: OrderItem[] = [];
    for (const item of data.items) {
      if (!item.menuItemId || item.quantity <= 0) {
        throw new Error("Invalid menu item or quantity");
      }

      const menuItem = await findMenuItemById(item.menuItemId);
      if (!menuItem) {
        throw new Error(`Menu item with ID ${item.menuItemId} not found`);
      }

      // Check if menu item is active and in stock
      if (!menuItem.isActive) {
        throw new Error(`Menu item "${menuItem.title}" is not available`);
      }

      if (menuItem.stockStatus === "OUT_OF_STOCK") {
        throw new Error(`Menu item "${menuItem.title}" is out of stock`);
      }

      // Check inventory availability
      try {
        const inventory = await inventoryService.getInventoryByMenuItem(
          item.menuItemId,
          undefined, // variantId if applicable
          data.restaurantId
        );

        if (inventory && inventory.quantity < item.quantity) {
          throw new Error(
            `Insufficient stock for "${menuItem.title}". Available: ${inventory.quantity}, Requested: ${item.quantity}`
          );
        }
      } catch (inventoryError) {
        logger.warn(
          `Could not check inventory for menu item ${item.menuItemId}:`,
          inventoryError
        );
        // Continue without inventory check if inventory service fails
      }

      // Check quantity constraints
      if (
        menuItem.maxOrderQuantity &&
        item.quantity > menuItem.maxOrderQuantity
      ) {
        throw new Error(
          `Maximum quantity for "${menuItem.title}" is ${menuItem.maxOrderQuantity}`
        );
      }

      if (item.quantity < menuItem.minOrderQuantity) {
        throw new Error(
          `Minimum quantity for "${menuItem.title}" is ${menuItem.minOrderQuantity}`
        );
      }

      // Use the current price from the menu item
      validatedItems.push({
        ...item,
        unitPrice: menuItem.finalPrice,
        subtotal: menuItem.finalPrice * item.quantity,
      });
    }

    // Calculate order totals (should get tax rate from restaurant settings)
    const taxRate = 10; // Default tax rate - should come from restaurant/region settings
    const deliveryFeeAmount = data.orderType === OrderType.DELIVERY ? 5 : 0; // Should come from restaurant settings

    const { subtotal, tax, deliveryFee, discount, total } =
      calculateOrderTotals(
        validatedItems,
        taxRate,
        deliveryFeeAmount,
        0 // No discount for now
      );

    // Create order data
    const orderData = {
      ...data,
      userId,
      tenantId,
      correlationId: uuidv4(),
      status: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
      subtotal,
      tax,
      deliveryFee,
      discount,
      total,
      items: validatedItems,
    };

    // Create the order
    const order = await orderRepository.createOrder(orderData);

    // Update inventory quantities for ordered items
    for (const item of validatedItems) {
      try {
        await inventoryService.adjustInventory(
          {
            menuItemId: item.menuItemId,
            quantityChange: -item.quantity, // Reduce stock
            reason: `Order ${order.id}`,
            notes: `Order placed by user ${userId}`,
          },
          userId
        );
      } catch (inventoryError) {
        logger.error(
          `Failed to adjust inventory for menu item ${item.menuItemId}:`,
          inventoryError
        );
        // Don't fail the order if inventory adjustment fails
      }
    }

    // Create order audit entry
    await orderRepository.createOrderAudit({
      orderId: order.id,
      operation: "CREATE",
      changedBy: userId,
      changes: JSON.stringify({
        status: OrderStatus.PENDING,
        total: total,
        itemCount: validatedItems.length,
      }),
      timestamp: new Date(),
    });

    // Send notification to customer about order confirmation
    try {
      await notificationIntegration.order.statusUpdate(
        userId,
        order.id,
        OrderStatus.PENDING,
        OrderStatus.PENDING,
        tenantId
      );
    } catch (notificationError) {
      logger.warn(
        "Failed to send order confirmation notification:",
        notificationError
      );
    }

    // Send notification to restaurant owner about new order
    try {
      const restaurant = await findRestaurantById(data.restaurantId);
      if (restaurant) {
        // Fetch user details for customer name
        let customerName = 'Customer';
        try {
          const userRepo = await import("../../user/register/repositories/user.repository");
          const user = await userRepo.findUserById(userId);
          if (user) {
            const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
            customerName = fullName || user.email.split('@')[0] || 'Customer';
          }
        } catch (userError) {
          logger.warn("Could not fetch user details for notification:", userError);
        }

        await notificationIntegration.restaurant.newOrder(
          restaurant.ownerId,
          order.id,
          total,
          customerName,
          tenantId
        );
      }
    } catch (notificationError) {
      logger.warn(
        "Failed to send new order notification to restaurant:",
        notificationError
      );
    }

    // Create delivery record if it's a delivery order
    if (data.orderType === OrderType.DELIVERY) {
      await orderRepository.createDelivery({
        orderId: order.id,
        status: DeliveryStatus.PENDING,
        tenantId,
      });
    }

    return order;
  } catch (error) {
    logger.error("Service error in createOrder:", error);
    throw new Error(`Failed to create order: ${(error as Error).message}`);
  }
};

export const updateOrder = async (id: string, data: any, changedBy: string) => {
  try {
    if (!id || !changedBy) {
      throw new Error("Order ID and changer ID are required");
    }

    // Get current order
    const currentOrder = await orderRepository.findOrderById(id);
    if (!currentOrder) {
      throw new Error(`Order with ID ${id} not found`);
    }

    // Business logic validations
    if (
      currentOrder.status === OrderStatus.DELIVERED &&
      data.status !== OrderStatus.DELIVERED
    ) {
      throw new Error("Cannot change status of delivered order");
    }

    if (
      currentOrder.status === OrderStatus.CANCELLED &&
      data.status !== OrderStatus.CANCELLED
    ) {
      throw new Error("Cannot change status of cancelled order");
    }

    // Update the order
    const updatedOrder = await orderRepository.updateOrder(id, data);

    // Create audit entry for changes
    const changes: any = {};
    if (data.status && data.status !== currentOrder.status) {
      changes.status = { from: currentOrder.status, to: data.status };
    }
    if (data.notes && data.notes !== currentOrder.notes) {
      changes.notes = { from: currentOrder.notes, to: data.notes };
    }
    if (data.priority && data.priority !== currentOrder.priority) {
      changes.priority = { from: currentOrder.priority, to: data.priority };
    }

    if (Object.keys(changes).length > 0) {
      await orderRepository.createOrderAudit({
        orderId: id,
        operation: "UPDATE",
        changedBy,
        changes: JSON.stringify(changes),
        timestamp: new Date(),
      });
    }

    // Update delivery status if order status changes and delivery exists
    if (data.status && currentOrder.delivery) {
      let deliveryStatus = currentOrder.delivery.status;

      switch (data.status) {
        case OrderStatus.PREPARING:
          deliveryStatus = DeliveryStatus.PENDING;
          break;
        case OrderStatus.SHIPPED:
          deliveryStatus = DeliveryStatus.ASSIGNED;
          break;
        case OrderStatus.DELIVERED:
          deliveryStatus = DeliveryStatus.DELIVERED;
          break;
        case OrderStatus.CANCELLED:
          deliveryStatus = DeliveryStatus.FAILED;
          break;
      }

      if (deliveryStatus !== currentOrder.delivery.status) {
        await orderRepository.updateDelivery(currentOrder.delivery.id, {
          status: deliveryStatus,
        });
      }
    }

    // Send notification for status changes
    if (data.status && data.status !== currentOrder.status) {
      try {
        await notificationIntegration.order.statusUpdate(
          currentOrder.userId,
          id,
          currentOrder.status,
          data.status,
          currentOrder.tenantId
        );

        // Send specific notifications for key status changes
        if (data.status === OrderStatus.PREPARING) {
          await notificationIntegration.order.confirmed(
            currentOrder.userId,
            id,
            currentOrder.estimatedDeliveryTime || undefined, // Convert null to undefined
            currentOrder.tenantId
          );
        } else if (data.status === OrderStatus.SHIPPED) {
          await notificationIntegration.order.ready(
            currentOrder.userId,
            id,
            currentOrder.orderType === OrderType.PICKUP ? "pickup" : "delivery",
            currentOrder.tenantId
          );
        } else if (data.status === OrderStatus.DELIVERED) {
          await notificationIntegration.order.delivered(
            currentOrder.userId,
            id,
            new Date(),
            currentOrder.tenantId
          );

          // Request feedback after delivery
          await notificationIntegration.feedback.requestAfterDelivery(
            id,
            currentOrder.userId,
            currentOrder.restaurantId,
            currentOrder.tenantId
          );
        }
      } catch (notificationError) {
        logger.warn(
          "Failed to send order status notification:",
          notificationError
        );
      }
    }

    return updatedOrder;
  } catch (error) {
    logger.error(`Service error in updateOrder for id ${id}:`, error);
    throw new Error(`Failed to update order: ${(error as Error).message}`);
  }
};

// Payment services
export const getPaymentsByOrderId = async (orderId: string) => {
  try {
    return await orderRepository.findPaymentsByOrderId(orderId);
  } catch (error) {
    logger.error(
      `Service error in getPaymentsByOrderId for orderId ${orderId}:`,
      error
    );
    throw new Error(`Failed to get payments: ${(error as Error).message}`);
  }
};

export const getPaymentById = async (id: string) => {
  try {
    return await orderRepository.findPaymentById(id);
  } catch (error) {
    logger.error(`Service error in getPaymentById for id ${id}:`, error);
    throw new Error(`Failed to get payment: ${(error as Error).message}`);
  }
};

export const createPayment = async (data: any) => {
  try {
    if (!data.orderId || !data.amount || !data.method) {
      throw new Error("Order ID, amount, and payment method are required");
    }

    // Validate order exists
    const order = await orderRepository.findOrderById(data.orderId);
    if (!order) {
      throw new Error(`Order with ID ${data.orderId} not found`);
    }

    // Validate payment amount matches order total
    if (Math.abs(data.amount - order.total) > 0.01) {
      throw new Error("Payment amount does not match order total");
    }

    // Create payment
    const payment = await orderRepository.createPayment({
      ...data,
      status: PaymentStatus.PENDING,
    });

    // Update order payment status
    await orderRepository.updateOrder(data.orderId, {
      paymentStatus: PaymentStatus.AUTHORIZED, // Changed from PROCESSING to match schema
    });

    return payment;
  } catch (error) {
    logger.error("Service error in createPayment:", error);
    throw new Error(`Failed to create payment: ${(error as Error).message}`);
  }
};

export const updatePayment = async (
  id: string,
  data: any,
  changedBy: string
) => {
  try {
    if (!id) {
      throw new Error("Payment ID is required");
    }

    const payment = await orderRepository.updatePayment(id, data);
    if (!payment) {
      throw new Error(`Payment with ID ${id} not found`);
    }

    // Update order payment status if payment status changes
    if (data.status) {
      let orderPaymentStatus = data.status;

      // If payment is completed, update order status to preparing
      if (data.status === PaymentStatus.PAID) {
        await orderRepository.updateOrder(payment.order.id, {
          paymentStatus: PaymentStatus.PAID,
          status: OrderStatus.PREPARING,
        });

        // Get full order details for notification
        const fullOrder = await orderRepository.findOrderById(payment.order.id);
        
        // Send payment confirmation notification
        try {
          if (fullOrder) {
            await notificationIntegration.order.statusUpdate(
              fullOrder.userId,
              fullOrder.id,
              fullOrder.status,
              OrderStatus.PREPARING,
              fullOrder.tenantId
            );
          }
        } catch (notificationError) {
          logger.warn(
            "Failed to send payment confirmation notification:",
            notificationError
          );
        }

        // Create audit entry
        await orderRepository.createOrderAudit({
          orderId: payment.order.id,
          operation: "PAYMENT_COMPLETED",
          changedBy,
          changes: JSON.stringify({ paymentId: id, status: "PAID" }),
          timestamp: new Date(),
        });
      } else {
        await orderRepository.updateOrder(payment.order.id, {
          paymentStatus: orderPaymentStatus,
        });
      }
    }

    return payment;
  } catch (error) {
    logger.error(`Service error in updatePayment for id ${id}:`, error);
    throw new Error(`Failed to update payment: ${(error as Error).message}`);
  }
};

// Delivery services
export const getAllDeliveries = async (page = 1, limit = 20, filters = {}) => {
  try {
    return await orderRepository.findAllDeliveries(page, limit, filters);
  } catch (error) {
    logger.error("Service error in getAllDeliveries:", error);
    throw new Error(`Failed to get deliveries: ${(error as Error).message}`);
  }
};

export const getDeliveryById = async (id: string) => {
  try {
    return await orderRepository.findDeliveryById(id);
  } catch (error) {
    logger.error(`Service error in getDeliveryById for id ${id}:`, error);
    throw new Error(`Failed to get delivery: ${(error as Error).message}`);
  }
};

export const createDelivery = async (data: any, tenantId: string) => {
  try {
    // Validate order exists
    const order = await orderRepository.findOrderById(data.orderId);
    if (!order) {
      throw new Error(`Order with ID ${data.orderId} not found`);
    }

    return await orderRepository.createDelivery({
      ...data,
      tenantId,
      status: DeliveryStatus.PENDING,
    });
  } catch (error) {
    logger.error("Service error in createDelivery:", error);
    throw new Error(`Failed to create delivery: ${(error as Error).message}`);
  }
};

export const updateDelivery = async (id: string, data: any) => {
  try {
    const delivery = await orderRepository.updateDelivery(id, data);

    // Update timestamps based on status
    const updateData: any = {};

    if (data.status) {
      switch (data.status) {
        case DeliveryStatus.ASSIGNED:
          updateData.assignedAt = new Date();
          break;
        case DeliveryStatus.IN_TRANSIT:
          updateData.pickedUpAt = new Date();
          break;
        case DeliveryStatus.DELIVERED:
          updateData.completedAt = new Date();
          // Also update order status
          await orderRepository.updateOrder(delivery.order.id, {
            status: OrderStatus.DELIVERED,
            actualDeliveryTime: new Date(),
          });
          break;
        case DeliveryStatus.CANCELLED: // Fix: Use CANCELLED instead of FAILED
          // Handle cancelled delivery
          break;
      }

      if (Object.keys(updateData).length > 0) {
        await orderRepository.updateDelivery(id, updateData);
      }
    }

    return delivery;
  } catch (error) {
    logger.error(`Service error in updateDelivery for id ${id}:`, error);
    throw new Error(`Failed to update delivery: ${(error as Error).message}`);
  }
};

// Driver services
export const getAllDrivers = async () => {
  try {
    return await orderRepository.findAllDrivers();
  } catch (error) {
    logger.error("Service error in getAllDrivers:", error);
    throw new Error(`Failed to get drivers: ${(error as Error).message}`);
  }
};

export const getDriverById = async (id: string) => {
  try {
    return await orderRepository.findDriverById(id);
  } catch (error) {
    logger.error(`Service error in getDriverById for id ${id}:`, error);
    throw new Error(`Failed to get driver: ${(error as Error).message}`);
  }
};

export const createDriver = async (data: any, tenantId: string) => {
  try {
    return await orderRepository.createDriver({
      ...data,
      tenantId,
    });
  } catch (error) {
    logger.error("Service error in createDriver:", error);
    throw new Error(`Failed to create driver: ${(error as Error).message}`);
  }
};

export const updateDriver = async (id: string, data: any) => {
  try {
    return await orderRepository.updateDriver(id, data);
  } catch (error) {
    logger.error(`Service error in updateDriver for id ${id}:`, error);
    throw new Error(`Failed to update driver: ${(error as Error).message}`);
  }
};

// Order Cancellation services
export const createOrderCancellation = async (
  data: any,
  requestedBy: string
) => {
  try {
    if (!data.orderId || !data.reason || data.reason.trim() === "") {
      throw new Error("Order ID and reason are required");
    }

    // Validate order exists and can be cancelled
    const order = await orderRepository.findOrderById(data.orderId);
    if (!order) {
      throw new Error(`Order with ID ${data.orderId} not found`);
    }

    if (
      order.status === OrderStatus.DELIVERED ||
      order.status === OrderStatus.CANCELLED
    ) {
      throw new Error(`Order cannot be cancelled in ${order.status} status`);
    }

    // Check if payment has been processed
    if (order.paymentStatus === PaymentStatus.PAID) {
      // Allow cancellation but note refund may be needed
      logger.warn(`Cancellation requested for paid order ${data.orderId}`);
    }

    return await orderRepository.createOrderCancellation({
      ...data,
      requestedBy,
      status: OrderCancellationStatus.REQUESTED, // Fixed to use enum value
    });
  } catch (error) {
    logger.error("Service error in createOrderCancellation:", error);
    throw new Error(
      `Failed to create cancellation: ${(error as Error).message}`
    );
  }
};

export const updateOrderCancellation = async (
  id: string,
  data: any,
  approvedBy?: string
) => {
  try {
    const cancellation = await orderRepository.findOrderCancellationById(id);
    if (!cancellation) {
      throw new Error(`Order cancellation with ID ${id} not found`);
    }

    const updateData = {
      ...data,
      ...(approvedBy && { approvedBy }),
    };

    const updatedCancellation = await orderRepository.updateOrderCancellation(
      id,
      updateData
    );

    // If cancellation is approved, update order status
    if (data.status === OrderCancellationStatus.APPROVED) {
      await orderRepository.updateOrder(cancellation.order.id, {
        status: OrderStatus.CANCELLED,
        cancelReason: cancellation.reason,
      });

      // Create audit entry
      await orderRepository.createOrderAudit({
        orderId: cancellation.order.id,
        operation: "CANCELLED",
        changedBy: approvedBy || "SYSTEM",
        changes: JSON.stringify({
          reason: cancellation.reason,
          approvedBy: approvedBy,
        }),
        timestamp: new Date(),
      });
    }

    return updatedCancellation;
  } catch (error) {
    logger.error(
      `Service error in updateOrderCancellation for id ${id}:`,
      error
    );
    throw new Error(
      `Failed to update cancellation: ${(error as Error).message}`
    );
  }
};

export const getOrderCancellationById = async (id: string) => {
  try {
    return await orderRepository.findOrderCancellationById(id);
  } catch (error) {
    logger.error(
      `Service error in getOrderCancellationById for id ${id}:`,
      error
    );
    throw new Error(`Failed to get cancellation: ${(error as Error).message}`);
  }
};
export const getAllOrderCancellations = async (
  page = 1,
  limit = 20,
  filters = {}
) => {
  try {
    return await orderRepository.findAllOrderCancellations(page, limit, filters);
  } catch (error) {
    logger.error("Service error in getAllOrderCancellations:", error);
    throw new Error(
      `Failed to get cancellations: ${(error as Error).message}`
    );
  }
};
