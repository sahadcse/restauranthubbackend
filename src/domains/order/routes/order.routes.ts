/**
 * Order Domain Routes
 * -----------------------------------------------------------------------------
 * This file defines all Express routes for the Order domain, including:
 *   - Order CRUD operations and lifecycle management
 *   - Payment processing and status updates
 *   - Delivery tracking and driver assignment
 *   - Order cancellation workflows
 *
 * All routes are protected and validated according to business requirements.
 * Role-based access control ensures proper authorization for sensitive operations.
 * -----------------------------------------------------------------------------
 */

import { Router } from "express";
import * as orderController from "../controllers/order.controller";
import {
  authenticate,
  authorizeRoles,
} from "../../../middleware/auth.middleware";
import {
  validateQuery,
  validateBody,
} from "../../../middleware/validation.middleware";
import {
  createOrderSchema,
  updateOrderSchema,
  createPaymentSchema,
  updatePaymentSchema,
  createDeliverySchema,
  updateDeliverySchema,
  createDriverSchema,
  updateDriverSchema,
  createOrderCancellationSchema,
  updateOrderCancellationSchema,
  orderQuerySchema,
  deliveryQuerySchema,
} from "../validations/order.validation";
import { UserRole } from "../../../../prisma/generated/prisma";

const router = Router();

// -----------------------------------------------------------------------------
// Order Routes
// -----------------------------------------------------------------------------

/**
 * @route   GET /orders
 * @desc    Get all orders with filtering and pagination
 * @access  Private (Customer sees own orders, Staff/Admin see all)
 */
router.get(
  "/",
  authenticate,
  validateQuery(orderQuerySchema),
  orderController.getAllOrders
);

/**
 * @route   POST /orders
 * @desc    Create a new order
 * @access  Private (Authenticated users)
 */
router.post(
  "/",
  authenticate,
  validateBody(createOrderSchema),
  orderController.createOrder
);

/**
 * @route   GET /orders/:id
 * @desc    Get order by ID
 * @access  Private (Owner, Restaurant Staff, Admin)
 */
router.get("/:id", authenticate, orderController.getOrderById);

/**
 * @route   PUT /orders/:id
 * @desc    Update order by ID
 * @access  Private (Owner, Restaurant Staff, Admin)
 */
router.put(
  "/:id",
  authenticate,
  validateBody(updateOrderSchema),
  orderController.updateOrder
);

// -----------------------------------------------------------------------------
// Payment Routes
// -----------------------------------------------------------------------------

/**
 * @route   GET /orders/:orderId/payments
 * @desc    Get all payments for an order
 * @access  Private (Order owner, Restaurant staff, Admin)
 */
router.get(
  "/:orderId/payments",
  authenticate,
  orderController.getPaymentsByOrderId
);

/**
 * @route   POST /payments
 * @desc    Create a new payment
 * @access  Private (Authenticated users)
 */
router.post(
  "/payments",
  authenticate,
  validateBody(createPaymentSchema),
  orderController.createPayment
);

/**
 * @route   GET /payments/:id
 * @desc    Get payment by ID
 * @access  Private (Payment owner, Restaurant staff, Admin)
 */
router.get("/payments/:id", authenticate, orderController.getPaymentById);

/**
 * @route   PUT /payments/:id
 * @desc    Update payment status
 * @access  Private (Restaurant staff, Admin, Payment gateway webhooks)
 */
router.put(
  "/payments/:id",
  authenticate,
  authorizeRoles(
    UserRole.RESTAURANT_OWNER,
    UserRole.RESTAURANT_STAFF,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  validateBody(updatePaymentSchema),
  orderController.updatePayment
);

// -----------------------------------------------------------------------------
// Delivery Routes
// -----------------------------------------------------------------------------

/**
 * @route   GET /deliveries
 * @desc    Get all deliveries with filtering
 * @access  Private (Restaurant staff, Drivers, Admin)
 */
router.get(
  "/deliveries",
  authenticate,
  authorizeRoles(
    UserRole.RESTAURANT_OWNER,
    UserRole.RESTAURANT_STAFF,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.DRIVER
  ),
  validateQuery(deliveryQuerySchema),
  orderController.getAllDeliveries
);

/**
 * @route   POST /deliveries
 * @desc    Create a new delivery
 * @access  Private (Restaurant staff, Admin)
 */
router.post(
  "/deliveries",
  authenticate,
  authorizeRoles(
    UserRole.RESTAURANT_OWNER,
    UserRole.RESTAURANT_STAFF,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  validateBody(createDeliverySchema),
  orderController.createDelivery
);

/**
 * @route   GET /deliveries/:id
 * @desc    Get delivery by ID
 * @access  Private (Restaurant staff, Driver, Admin)
 */
router.get("/deliveries/:id", authenticate, orderController.getDeliveryById);

/**
 * @route   PUT /deliveries/:id
 * @desc    Update delivery status
 * @access  Private (Restaurant staff, Driver, Admin)
 */
router.put(
  "/deliveries/:id",
  authenticate,
  validateBody(updateDeliverySchema),
  orderController.updateDelivery
);

// -----------------------------------------------------------------------------
// Driver Routes
// -----------------------------------------------------------------------------

/**
 * @route   GET /drivers
 * @desc    Get all drivers
 * @access  Private (Restaurant staff, Admin)
 */
router.get(
  "/drivers",
  authenticate,
  authorizeRoles(
    UserRole.RESTAURANT_OWNER,
    UserRole.RESTAURANT_STAFF,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  orderController.getAllDrivers
);

/**
 * @route   POST /drivers
 * @desc    Create a new driver
 * @access  Private (Admin only)
 */
router.post(
  "/drivers",
  authenticate,
  authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateBody(createDriverSchema),
  orderController.createDriver
);

/**
 * @route   GET /drivers/:id
 * @desc    Get driver by ID
 * @access  Private (Restaurant staff, Admin)
 */
router.get(
  "/drivers/:id",
  authenticate,
  authorizeRoles(
    UserRole.RESTAURANT_OWNER,
    UserRole.RESTAURANT_STAFF,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  orderController.getDriverById
);

/**
 * @route   PUT /drivers/:id
 * @desc    Update driver
 * @access  Private (Admin only)
 */
router.put(
  "/drivers/:id",
  authenticate,
  authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateBody(updateDriverSchema),
  orderController.updateDriver
);

// -----------------------------------------------------------------------------
// Order Cancellation Routes
// -----------------------------------------------------------------------------

/**
 * @route   POST /cancellations
 * @desc    Create an order cancellation request
 * @access  Private (Order owner, Restaurant staff, Admin)
 */
router.post(
  "/cancellations",
  authenticate,
  validateBody(createOrderCancellationSchema),
  orderController.createOrderCancellation
);

/**
 * @route   GET /cancellations/:id
 * @desc    Get order cancellation by ID
 * @access  Private (Requester, Restaurant staff, Admin)
 */
router.get(
  "/cancellations/:id",
  authenticate,
  orderController.getOrderCancellationById
);

/**
 * @route   PUT /cancellations/:id
 * @desc    Update order cancellation status (approve/reject)
 * @access  Private (Restaurant staff, Admin)
 */
router.put(
  "/cancellations/:id",
  authenticate,
  authorizeRoles(
    UserRole.RESTAURANT_OWNER,
    UserRole.RESTAURANT_STAFF,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  validateBody(updateOrderCancellationSchema),
  orderController.updateOrderCancellation
);

/**
 * @route   GET /cancellations
 * @desc    Get all order cancellations with filtering
 * @access  Private (Restaurant staff, Admin)
 */
router.get(
  "/cancellations/all",
  authenticate,
  authorizeRoles(
    UserRole.RESTAURANT_OWNER,
    UserRole.RESTAURANT_STAFF,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  orderController.getAllOrderCancellations
);

export default router;
