import { Request, Response, NextFunction } from "express";
import * as cartService from "../services/cart.service";
import logger from "../../../utils/logger";
import AppError from "../../../utils/AppError";

/**
 * Get user's cart
 * @route GET /cart
 */
export const getUserCart = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // @ts-ignore - Property 'user' may be added by auth middleware
    const userId = req.user?.id;
    const tenantId =
      (req.headers["x-tenant-id"] as string) || req.user?.id || "default"; // Provide fallback

    if (!userId) {
      return next(new AppError("User not authenticated", 401));
    }

    const result = await cartService.getUserCart(userId, tenantId);

    res.status(200).json({
      success: true,
      message: "Cart retrieved successfully",
      data: result,
    });
  } catch (error) {
    logger.error("Error in getUserCart:", error);
    next(error);
  }
};

/**
 * Add item to cart
 * @route POST /cart/items
 */
export const addToCart = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // @ts-ignore - Property 'user' may be added by auth middleware
    const userId = req.user?.id;
    const tenantId =
      (req.headers["x-tenant-id"] as string) || req.user?.id || "default";

    if (!userId) {
      return next(new AppError("User not authenticated", 401));
    }

    const result = await cartService.addToCart(userId, tenantId, req.body);

    res.status(200).json({
      success: true,
      message: "Item added to cart successfully",
      data: result,
    });
  } catch (error) {
    logger.error("Error in addToCart:", error);
    next(error);
  }
};

/**
 * Update cart item quantity
 * @route PUT /cart/items/:itemId
 */
export const updateCartItem = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // @ts-ignore - Property 'user' may be added by auth middleware
    const userId = req.user?.id;
    const { itemId } = req.params;

    if (!userId) {
      return next(new AppError("User not authenticated", 401));
    }

    const result = await cartService.updateCartItem(userId, itemId, req.body);

    res.status(200).json({
      success: true,
      message: "Cart item updated successfully",
      data: result,
    });
  } catch (error) {
    logger.error(
      `Error in updateCartItem for item ${req.params.itemId}:`,
      error
    );
    next(error);
  }
};

/**
 * Remove item from cart
 * @route DELETE /cart/items/:itemId
 */
export const removeFromCart = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // @ts-ignore - Property 'user' may be added by auth middleware
    const userId = req.user?.id;
    const { itemId } = req.params;

    if (!userId) {
      return next(new AppError("User not authenticated", 401));
    }

    const result = await cartService.removeFromCart(userId, itemId);

    res.status(200).json({
      success: true,
      message: "Item removed from cart successfully",
      data: result,
    });
  } catch (error) {
    logger.error(
      `Error in removeFromCart for item ${req.params.itemId}:`,
      error
    );
    next(error);
  }
};

/**
 * Clear all items from cart
 * @route DELETE /cart
 */
export const clearCart = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // @ts-ignore - Property 'user' may be added by auth middleware
    const userId = req.user?.id;
    const tenantId =
      (req.headers["x-tenant-id"] as string) || req.user?.id || "default";

    if (!userId) {
      return next(new AppError("User not authenticated", 401));
    }

    const result = await cartService.clearUserCart(userId, tenantId);

    res.status(200).json({
      success: true,
      message: "Cart cleared successfully",
      data: result,
    });
  } catch (error) {
    logger.error("Error in clearCart:", error);
    next(error);
  }
};
