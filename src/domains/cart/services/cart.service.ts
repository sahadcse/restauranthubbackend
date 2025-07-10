import * as cartRepository from "../repositories/cart.repository";
import logger from "../../../utils/logger";
import {
  AddToCartDto,
  UpdateCartItemDto,
  CartSummary,
  CartResponse,
} from "../types/cart.types";
import AppError from "../../../utils/AppError";
// Add notification integration
import { notificationIntegration } from "../../notification/services/integration.service";

export const getOrCreateCart = async (userId: string, tenantId: string) => {
  try {
    let cart = await cartRepository.findCartByUserId(userId);

    if (!cart) {
      cart = await cartRepository.createCart(userId, tenantId);
      logger.info(`Created new cart for user ${userId}`);
    }

    return cart;
  } catch (error) {
    logger.error(`Service error in getOrCreateCart for user ${userId}:`, error);
    throw error;
  }
};

export const getUserCart = async (
  userId: string,
  tenantId: string
): Promise<CartResponse> => {
  try {
    const cart = await getOrCreateCart(userId, tenantId);
    const summary = calculateCartSummary(cart);

    return { cart, summary };
  } catch (error) {
    logger.error(`Service error in getUserCart for user ${userId}:`, error);
    throw error;
  }
};

export const addToCart = async (
  userId: string,
  tenantId: string,
  data: AddToCartDto
): Promise<CartResponse> => {
  try {
    const { menuItemId, variantId, quantity } = data;

    // Validate menu item exists and is available
    const menuItem = await cartRepository.validateMenuItemExists(menuItemId);
    if (!menuItem) {
      throw new AppError("Menu item not found or not available", 404);
    }

    // Check stock status
    if (
      menuItem.stockStatus === "OUT_OF_STOCK" ||
      menuItem.stockStatus === "DISCONTINUED"
    ) {
      throw new AppError("Menu item is currently out of stock", 400);
    }

    // Validate quantity limits
    if (quantity < menuItem.minOrderQuantity) {
      throw new AppError(
        `Minimum order quantity is ${menuItem.minOrderQuantity}`,
        400
      );
    }

    if (menuItem.maxOrderQuantity && quantity > menuItem.maxOrderQuantity) {
      throw new AppError(
        `Maximum order quantity is ${menuItem.maxOrderQuantity}`,
        400
      );
    }

    // Validate variant if provided
    if (variantId) {
      const variant = await cartRepository.validateMenuItemVariant(
        variantId,
        menuItemId
      );
      if (!variant) {
        throw new AppError("Menu item variant not found or not available", 404);
      }
    }

    // Get or create cart
    const cart = await getOrCreateCart(userId, tenantId);

    // Check if item with same variant already exists in cart
    const existingItem = await cartRepository.findCartItemByUniqueKey(
      cart.id,
      menuItemId,
      variantId
    );

    if (existingItem) {
      // Update quantity of existing item
      const newQuantity = existingItem.quantity + quantity;

      // Check maximum quantity again
      if (
        menuItem.maxOrderQuantity &&
        newQuantity > menuItem.maxOrderQuantity
      ) {
        throw new AppError(
          `Cannot add ${quantity} more. Maximum order quantity is ${menuItem.maxOrderQuantity}`,
          400
        );
      }

      await cartRepository.updateCartItemQuantity(existingItem.id, newQuantity);
    } else {
      // Add new item to cart
      await cartRepository.addCartItem(
        cart.id,
        menuItemId,
        quantity,
        variantId
      );
    }

    // Send notification for first-time cart addition (engagement)
    try {
      const cart = await getOrCreateCart(userId, tenantId);
      if (cart.items.length === 1) {
        // First item added
        await notificationIntegration.promotional.personalizedDiscount(
          userId,
          "FIRSTCART5",
          5,
          new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
          tenantId
        );
      }
    } catch (notificationError) {
      logger.warn("Failed to send first cart notification:", notificationError);
    }

    // Return updated cart
    return await getUserCart(userId, tenantId);
  } catch (error) {
    logger.error(`Service error in addToCart for user ${userId}:`, error);
    throw error;
  }
};

export const updateCartItem = async (
  userId: string,
  itemId: string,
  data: UpdateCartItemDto
): Promise<CartResponse> => {
  try {
    const { quantity } = data;

    // Verify the cart item belongs to the user
    const cartItem = await cartRepository.findCartItemById(itemId, userId);
    if (!cartItem) {
      throw new AppError("Cart item not found", 404);
    }

    // Validate menu item constraints
    const menuItem = await cartRepository.validateMenuItemExists(
      cartItem.menuItemId
    );
    if (!menuItem) {
      throw new AppError("Menu item no longer available", 404);
    }

    // Validate quantity limits
    if (quantity < menuItem.minOrderQuantity) {
      throw new AppError(
        `Minimum order quantity is ${menuItem.minOrderQuantity}`,
        400
      );
    }

    if (menuItem.maxOrderQuantity && quantity > menuItem.maxOrderQuantity) {
      throw new AppError(
        `Maximum order quantity is ${menuItem.maxOrderQuantity}`,
        400
      );
    }

    // Update the cart item
    await cartRepository.updateCartItemQuantity(itemId, quantity);

    // Return updated cart
    return await getUserCart(userId, cartItem.cart.tenantId);
  } catch (error) {
    logger.error(`Service error in updateCartItem for item ${itemId}:`, error);
    throw error;
  }
};

export const removeFromCart = async (
  userId: string,
  itemId: string
): Promise<CartResponse> => {
  try {
    // Verify the cart item belongs to the user
    const cartItem = await cartRepository.findCartItemById(itemId, userId);
    if (!cartItem) {
      throw new AppError("Cart item not found", 404);
    }

    // Remove the cart item
    await cartRepository.removeCartItem(itemId);

    // Return updated cart
    return await getUserCart(userId, cartItem.cart.tenantId);
  } catch (error) {
    logger.error(`Service error in removeFromCart for item ${itemId}:`, error);
    throw error;
  }
};

export const clearUserCart = async (
  userId: string,
  tenantId: string
): Promise<CartResponse> => {
  try {
    const cart = await cartRepository.findCartByUserId(userId);
    if (cart && cart.items.length > 0) {
      await cartRepository.clearCart(cart.id);

      // Send cart cleared notification (could be for order completion)
      try {
        await notificationIntegration.promotional.createPromotionNotification(
          userId,
          "Thanks for your order!",
          "Your order has been placed successfully. We're preparing it for you.",
          {
            cartCleared: true,
            clearedAt: new Date().toISOString(),
          },
          tenantId
        );
      } catch (notificationError) {
        logger.warn(
          "Failed to send cart cleared notification:",
          notificationError
        );
      }
    }

    // Return empty cart
    return await getUserCart(userId, tenantId);
  } catch (error) {
    logger.error(`Service error in clearUserCart for user ${userId}:`, error);
    throw error;
  }
};

// Helper function to calculate cart summary
const calculateCartSummary = (cart: any): CartSummary => {
  let totalItems = 0;
  let subtotal = 0;
  let currency = "USD"; // Default currency

  if (cart.items && cart.items.length > 0) {
    for (const item of cart.items) {
      totalItems += item.quantity;
      subtotal += item.quantity * item.menuItem.finalPrice;

      // Use currency from the first restaurant (assuming single restaurant per cart)
      if (item.menuItem.restaurant?.currency) {
        currency = item.menuItem.restaurant.currency;
      }
    }
  }

  return {
    totalItems,
    subtotal: Math.round(subtotal * 100) / 100, // Round to 2 decimal places
    currency,
  };
};
