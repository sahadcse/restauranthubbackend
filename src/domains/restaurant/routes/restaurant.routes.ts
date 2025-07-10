/**
 * Restaurant Domain Routes
 * -----------------------------------------------------------------------------
 * This file defines all Express routes for the Restaurant domain, including:
 *   - Restaurant CRUD operations
 *   - Menu and Menu Item management
 *   - Category, Brand, Tax Rate, and Allergen endpoints
 *
 * All routes are protected and validated according to business requirements.
 * Middleware is used for authentication, authorization, and request validation.
 *
 * Best Practices:
 *   - Use role-based access control for sensitive operations
 *   - Validate all incoming requests using schema validation
 *   - Organize routes by resource and HTTP method
 *   - Export a single router instance for modular integration
 * -----------------------------------------------------------------------------
 */

import { Router } from "express";
import * as restaurantController from "../controllers/restaurant.controller";
import {
  authenticate,
  authorizeRoles,
} from "../../../middleware/auth.middleware";
import { validateRequest } from "../../../middleware/validation.middleware";
import {
  createRestaurantSchema,
  updateRestaurantSchema,
  createMenuSchema,
  updateMenuSchema,
  createMenuItemSchema,
  updateMenuItemSchema,
  createCategorySchema,
  updateCategorySchema,
} from "../validations/restaurant.validation";
import { UserRole } from "../../../../prisma/generated/prisma";

const router = Router();

// -----------------------------------------------------------------------------
// IMPORTANT: Static routes MUST come before parameterized routes
// This prevents Express from matching "categories", "menu-items", etc. as IDs
// ----------------------------------------------------------------------------

// -----------------------------------------------------------------------------
// Category routes - MUST BE FIRST to avoid conflicts with /:id
// ----------------------------------------------------------------------------

/**
 * @route   GET /categories
 * @desc    Get all categories
 * @access  Public
 */
router.get("/categories", restaurantController.getAllCategories);

/**
 * @route   POST /categories
 * @desc    Create a new category
 * @access  Private (Restaurant Owner, Admin, Super Admin)
 */
router.post(
  "/categories",
  authenticate,
  authorizeRoles(
    UserRole.RESTAURANT_OWNER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  validateRequest(createCategorySchema),
  restaurantController.createCategory
);

/**
 * @route   GET /categories/slug/:slug
 * @desc    Get category by slug
 * @access  Public
 */
router.get("/categories/slug/:slug", restaurantController.getCategoryBySlug);

/**
 * @route   GET /categories/:id
 * @desc    Get category by ID
 * @access  Public
 */
router.get("/categories/:id", restaurantController.getCategoryById);

/**
 * @route   PUT /categories/:id
 * @desc    Update category by ID
 * @access  Private (Restaurant Owner, Admin, Super Admin)
 */
router.put(
  "/categories/:id",
  authenticate,
  authorizeRoles(
    UserRole.RESTAURANT_OWNER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  validateRequest(updateCategorySchema),
  restaurantController.updateCategory
);

/**
 * @route   DELETE /categories/:id
 * @desc    Delete category by ID
 * @access  Private (Restaurant Owner, Admin, Super Admin)
 */
router.delete(
  "/categories/:id",
  authenticate,
  authorizeRoles(
    UserRole.RESTAURANT_OWNER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  restaurantController.deleteCategory
);

// -----------------------------------------------------------------------------
// Menu Item routes - MUST BE BEFORE /:id routes
// ----------------------------------------------------------------------------

/**
 * @route   GET /menu-items
 * @desc    Get all menu items
 * @access  Public
 */
router.get("/menu-items", restaurantController.getAllMenuItems);

/**
 * @route   GET /menu-items/:id
 * @desc    Get menu item by ID
 * @access  Public
 */
router.get("/menu-items/:id", restaurantController.getMenuItemById);

/**
 * @route   PUT /menu-items/:id
 * @desc    Update menu item by ID
 * @access  Private (Restaurant Owner, Restaurant Staff, Admin, Super Admin)
 */
router.put(
  "/menu-items/:id",
  authenticate,
  authorizeRoles(
    UserRole.RESTAURANT_OWNER,
    UserRole.RESTAURANT_STAFF,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  validateRequest(updateMenuItemSchema),
  restaurantController.updateMenuItem
);

/**
 * @route   DELETE /menu-items/:id
 * @desc    Delete menu item by ID
 * @access  Private (Restaurant Owner, Restaurant Staff, Admin, Super Admin)
 */
router.delete(
  "/menu-items/:id",
  authenticate,
  authorizeRoles(
    UserRole.RESTAURANT_OWNER,
    UserRole.RESTAURANT_STAFF,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  restaurantController.deleteMenuItem
);

// -----------------------------------------------------------------------------
// Other static routes - MUST BE BEFORE /:id routes
// ----------------------------------------------------------------------------

/**
 * @route   GET /brands
 * @desc    Get all brands
 * @access  Public
 */
router.get("/brands", restaurantController.getAllBrands);

/**
 * @route   GET /tax-rates
 * @desc    Get all tax rates
 * @access  Public
 */
router.get("/tax-rates", restaurantController.getAllTaxRates);

/**
 * @route   GET /allergens
 * @desc    Get all allergens
 * @access  Public
 */
router.get("/allergens", restaurantController.getAllAllergens);

// -----------------------------------------------------------------------------
// Restaurant routes - Base routes
// ----------------------------------------------------------------------------

/**
 * @route   GET /
 * @desc    Get all restaurants
 * @access  Public
 */
router.get("/", restaurantController.getAllRestaurants);

/**
 * @route   POST /
 * @desc    Create a new restaurant
 * @access  Private (Restaurant Owner, Admin, Super Admin)
 */
router.post(
  "/",
  authenticate,
  authorizeRoles(
    UserRole.RESTAURANT_OWNER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  validateRequest(createRestaurantSchema),
  restaurantController.createRestaurant
);

// -----------------------------------------------------------------------------
// Restaurant ID-based routes - MUST COME AFTER ALL STATIC ROUTES
// ----------------------------------------------------------------------------

/**
 * @route   GET /:id
 * @desc    Get restaurant by ID
 * @access  Public
 */
router.get("/:id", restaurantController.getRestaurantById);

/**
 * @route   PUT /:id
 * @desc    Update restaurant by ID
 * @access  Private (Restaurant Owner, Admin, Super Admin)
 */
router.put(
  "/:id",
  authenticate,
  authorizeRoles(
    UserRole.RESTAURANT_OWNER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  validateRequest(updateRestaurantSchema),
  restaurantController.updateRestaurant
);

/**
 * @route   DELETE /:id
 * @desc    Delete restaurant by ID
 * @access  Private (Restaurant Owner, Admin, Super Admin)
 */
router.delete(
  "/:id",
  authenticate,
  authorizeRoles(
    UserRole.RESTAURANT_OWNER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  restaurantController.deleteRestaurant
);

// -----------------------------------------------------------------------------
// Menu routes - These use restaurant ID in the path
// ----------------------------------------------------------------------------

/**
 * @route   GET /:restaurantId/menus
 * @desc    Get all menus for a restaurant
 * @access  Public
 */
router.get("/:restaurantId/menus", restaurantController.getRestaurantMenus);

/**
 * @route   POST /:restaurantId/menus
 * @desc    Create a new menu for a restaurant
 * @access  Private (Restaurant Owner, Admin, Super Admin)
 */
router.post(
  "/:restaurantId/menus",
  authenticate,
  authorizeRoles(
    UserRole.RESTAURANT_OWNER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  validateRequest(createMenuSchema),
  restaurantController.createMenu
);

/**
 * @route   GET /:restaurantId/menus/:menuId
 * @desc    Get menu by ID for a restaurant
 * @access  Public
 */
router.get("/:restaurantId/menus/:menuId", restaurantController.getMenuById);

/**
 * @route   PUT /:restaurantId/menus/:menuId
 * @desc    Update menu by ID for a restaurant
 * @access  Private (Restaurant Owner, Admin, Super Admin)
 */
router.put(
  "/:restaurantId/menus/:menuId",
  authenticate,
  authorizeRoles(
    UserRole.RESTAURANT_OWNER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  validateRequest(updateMenuSchema),
  restaurantController.updateMenu
);

/**
 * @route   DELETE /:restaurantId/menus/:menuId
 * @desc    Delete menu by ID for a restaurant
 * @access  Private (Restaurant Owner, Admin, Super Admin)
 */
router.delete(
  "/:restaurantId/menus/:menuId",
  authenticate,
  authorizeRoles(
    UserRole.RESTAURANT_OWNER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  restaurantController.deleteMenu
);

/**
 * @route   POST /:restaurantId/menu-items
 * @desc    Create a new menu item for a restaurant
 * @access  Private (Restaurant Owner, Restaurant Staff, Admin, Super Admin)
 */
router.post(
  "/:restaurantId/menu-items",
  authenticate,
  authorizeRoles(
    UserRole.RESTAURANT_OWNER,
    UserRole.RESTAURANT_STAFF,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  validateRequest(createMenuItemSchema),
  restaurantController.createMenuItem
);

export default router;
