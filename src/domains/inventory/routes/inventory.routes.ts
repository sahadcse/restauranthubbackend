/**
 * Inventory Domain Routes
 * -----------------------------------------------------------------------------
 * This file defines all Express routes for the Inventory domain, including:
 *   - Inventory CRUD operations and stock management
 *   - Inventory adjustments and quantity tracking
 *   - Supplier management and relationships
 *   - Low stock alerts and analytics
 *
 * All routes are protected and validated according to business requirements.
 * Role-based access control ensures proper authorization for sensitive operations.
 * -----------------------------------------------------------------------------
 */

import { Router } from "express";
import * as inventoryController from "../controllers/inventory.controller";
import {
  authenticate,
  authorizeRoles,
} from "../../../middleware/auth.middleware";
import { validateRequest } from "../../../middleware/validation.middleware";
import {
  createInventorySchema,
  updateInventorySchema,
  inventoryAdjustmentSchema,
  createSupplierSchema,
  updateSupplierSchema,
  inventoryQuerySchema,
  supplierQuerySchema,
} from "../validations/inventory.validation";
import { UserRole } from "../../../../prisma/generated/prisma";

const router = Router();

// -----------------------------------------------------------------------------
// Inventory Routes
// -----------------------------------------------------------------------------

/**
 * @route   GET /inventory
 * @desc    Get all inventory with filtering and pagination
 * @access  Private (Restaurant Staff, Admin)
 */
router.get(
  "/get-all",
  authenticate,
  authorizeRoles(
    UserRole.RESTAURANT_OWNER,
    UserRole.RESTAURANT_STAFF,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  validateRequest(inventoryQuerySchema, "query"),
  inventoryController.getAllInventory
);

/**
 * @route   POST /inventory
 * @desc    Create new inventory record
 * @access  Private (Restaurant Staff, Admin)
 */
router.post(
  "/create",
  authenticate,
  authorizeRoles(
    UserRole.RESTAURANT_OWNER,
    UserRole.RESTAURANT_STAFF,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  validateRequest(createInventorySchema),
  inventoryController.createInventory
);

/**
 * @route   GET /inventory/analytics
 * @desc    Get inventory analytics and statistics
 * @access  Private (Restaurant Staff, Admin)
 */
router.get(
  "/analytics",
  authenticate,
  authorizeRoles(
    UserRole.RESTAURANT_OWNER,
    UserRole.RESTAURANT_STAFF,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  inventoryController.getInventoryAnalytics
);

/**
 * @route   GET /inventory/low-stock
 * @desc    Get low stock and out of stock items
 * @access  Private (Restaurant Staff, Admin)
 */
router.get(
  "/low-stock",
  authenticate,
  authorizeRoles(
    UserRole.RESTAURANT_OWNER,
    UserRole.RESTAURANT_STAFF,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  inventoryController.getLowStockItems
);

/**
 * @route   POST /inventory/adjust
 * @desc    Adjust inventory quantity (add/remove stock)
 * @access  Private (Restaurant Staff, Admin)
 */
router.post(
  "/adjust",
  authenticate,
  authorizeRoles(
    UserRole.RESTAURANT_OWNER,
    UserRole.RESTAURANT_STAFF,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  validateRequest(inventoryAdjustmentSchema),
  inventoryController.adjustInventory
);

/**
 * @route   GET /inventory/menu-item/:menuItemId
 * @desc    Get inventory for specific menu item
 * @access  Private (Restaurant Staff, Admin)
 */
router.get(
  "/menu-item/:menuItemId",
  authenticate,
  authorizeRoles(
    UserRole.RESTAURANT_OWNER,
    UserRole.RESTAURANT_STAFF,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  inventoryController.getInventoryByMenuItem
);

/**
 * @route   GET /inventory/:id
 * @desc    Get inventory by ID
 * @access  Private (Restaurant Staff, Admin)
 */
router.get(
  "/single/:id",
  authenticate,
  authorizeRoles(
    UserRole.RESTAURANT_OWNER,
    UserRole.RESTAURANT_STAFF,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  inventoryController.getInventoryById
);

/**
 * @route   PUT /inventory/:id
 * @desc    Update inventory by ID
 * @access  Private (Restaurant Staff, Admin)
 */
router.put(
  "/update/:id",
  authenticate,
  authorizeRoles(
    UserRole.RESTAURANT_OWNER,
    UserRole.RESTAURANT_STAFF,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  validateRequest(updateInventorySchema),
  inventoryController.updateInventory
);

/**
 * @route   DELETE /inventory/:id
 * @desc    Delete inventory by ID
 * @access  Private (Restaurant Owner, Admin)
 */
router.delete(
  "/delete/:id",
  authenticate,
  authorizeRoles(
    UserRole.RESTAURANT_OWNER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  inventoryController.deleteInventory
);

// -----------------------------------------------------------------------------
// Supplier Routes
// -----------------------------------------------------------------------------

/**
 * @route   GET /suppliers
 * @desc    Get all suppliers with filtering and pagination
 * @access  Private (Restaurant Staff, Admin)
 */
router.get(
  "/suppliers/get-all",
  authenticate,
  authorizeRoles(
    UserRole.RESTAURANT_OWNER,
    UserRole.RESTAURANT_STAFF,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  validateRequest(supplierQuerySchema, "query"),
  inventoryController.getAllSuppliers
);

/**
 * @route   POST /suppliers
 * @desc    Create new supplier
 * @access  Private (Restaurant Owner, Admin)
 */
router.post(
  "/suppliers/create",
  authenticate,
  authorizeRoles(
    UserRole.RESTAURANT_OWNER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  validateRequest(createSupplierSchema),
  inventoryController.createSupplier
);

/**
 * @route   GET /suppliers/:id
 * @desc    Get supplier by ID
 * @access  Private (Restaurant Staff, Admin)
 */
router.get(
  "/suppliers/single/:id",
  authenticate,
  authorizeRoles(
    UserRole.RESTAURANT_OWNER,
    UserRole.RESTAURANT_STAFF,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  inventoryController.getSupplierById
);

/**
 * @route   PUT /suppliers/:id
 * @desc    Update supplier by ID
 * @access  Private (Restaurant Owner, Admin)
 */
router.put(
  "/suppliers/update/:id",
  authenticate,
  authorizeRoles(
    UserRole.RESTAURANT_OWNER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  validateRequest(updateSupplierSchema),
  inventoryController.updateSupplier
);

/**
 * @route   DELETE /suppliers/:id
 * @desc    Delete supplier by ID
 * @access  Private (Restaurant Owner, Admin)
 */
router.delete(
  "/suppliers/delete/:id",
  authenticate,
  authorizeRoles(
    UserRole.RESTAURANT_OWNER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  inventoryController.deleteSupplier
);

export default router;
