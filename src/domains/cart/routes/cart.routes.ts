import { Router } from "express";
import * as cartController from "../controllers/cart.controller";
import { authenticate } from "../../../middleware/auth.middleware";
import { validateRequest } from "../../../middleware/validation.middleware";
import {
  addToCartSchema,
  updateCartItemSchema,
  cartItemParamsSchema,
} from "../validations/cart.validation";

const router = Router();

/**
 * @route   GET /cart
 * @desc    Get user's cart
 * @access  Private (Authenticated users only)
 */
router.get("/", authenticate, cartController.getUserCart);

/**
 * @route   POST /cart/items
 * @desc    Add item to cart
 * @access  Private (Authenticated users only)
 */
router.post(
  "/items",
  authenticate,
  validateRequest(addToCartSchema),
  cartController.addToCart
);

/**
 * @route   PUT /cart/items/:itemId
 * @desc    Update cart item quantity
 * @access  Private (Authenticated users only)
 */
router.put(
  "/items/:itemId",
  authenticate,
  validateRequest(cartItemParamsSchema, "params"),
  validateRequest(updateCartItemSchema),
  cartController.updateCartItem
);

/**
 * @route   DELETE /cart/items/:itemId
 * @desc    Remove item from cart
 * @access  Private (Authenticated users only)
 */
router.delete(
  "/items/:itemId",
  authenticate,
  validateRequest(cartItemParamsSchema, "params"),
  cartController.removeFromCart
);

/**
 * @route   DELETE /cart
 * @desc    Clear all items from cart
 * @access  Private (Authenticated users only)
 */
router.delete("/", authenticate, cartController.clearCart);

export default router;
