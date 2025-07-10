import { PrismaClient } from "../../../../prisma/generated/prisma";
import logger from "../../../utils/logger";
import { CartWithItems } from "../types/cart.types";

const prisma = new PrismaClient();

export const findCartByUserId = async (
  userId: string
): Promise<CartWithItems | null> => {
  try {
    return await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            menuItem: {
              include: {
                images: {
                  where: { isPrimary: true },
                  select: { imageUrl: true, isPrimary: true },
                  take: 1,
                },
                restaurant: {
                  select: {
                    id: true,
                    name: true,
                    currency: true,
                  },
                },
              },
            },
            variant: true,
          },
          orderBy: { addedAt: "desc" },
        },
      },
    });
  } catch (error) {
    logger.error(`Error finding cart for user ${userId}:`, error);
    throw error;
  }
};

export const createCart = async (userId: string, tenantId: string) => {
  try {
    return await prisma.cart.create({
      data: {
        userId,
        tenantId,
      },
      include: {
        items: {
          include: {
            menuItem: {
              include: {
                images: {
                  where: { isPrimary: true },
                  select: { imageUrl: true, isPrimary: true },
                  take: 1,
                },
                restaurant: {
                  select: {
                    id: true,
                    name: true,
                    currency: true,
                  },
                },
              },
            },
            variant: true,
          },
        },
      },
    });
  } catch (error) {
    logger.error(`Error creating cart for user ${userId}:`, error);
    throw error;
  }
};

export const findCartItemByUniqueKey = async (
  cartId: string,
  menuItemId: string,
  variantId?: string | null
) => {
  try {
    return await prisma.cartItem.findFirst({
      where: {
          cartId,
          menuItemId,
          variantId: variantId || null,
        },
    });
  } catch (error) {
    logger.error(`Error finding cart item:`, error);
    throw error;
  }
};

export const addCartItem = async (
  cartId: string,
  menuItemId: string,
  quantity: number,
  variantId?: string | null
) => {
  try {
    return await prisma.cartItem.create({
      data: {
        cartId,
        menuItemId,
        variantId: variantId ?? null,
        quantity,
      },
    });
  } catch (error) {
    logger.error(`Error adding cart item:`, error);
    throw error;
  }
};

export const updateCartItemQuantity = async (
  itemId: string,
  quantity: number
) => {
  try {
    return await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
    });
  } catch (error) {
    logger.error(`Error updating cart item ${itemId}:`, error);
    throw error;
  }
};

export const removeCartItem = async (itemId: string) => {
  try {
    return await prisma.cartItem.delete({
      where: { id: itemId },
    });
  } catch (error) {
    logger.error(`Error removing cart item ${itemId}:`, error);
    throw error;
  }
};

export const clearCart = async (cartId: string) => {
  try {
    return await prisma.cartItem.deleteMany({
      where: { cartId },
    });
  } catch (error) {
    logger.error(`Error clearing cart ${cartId}:`, error);
    throw error;
  }
};

export const findCartItemById = async (itemId: string, userId: string) => {
  try {
    return await prisma.cartItem.findFirst({
      where: {
        id: itemId,
        cart: {
          userId,
        },
      },
      include: {
        cart: true,
      },
    });
  } catch (error) {
    logger.error(
      `Error finding cart item ${itemId} for user ${userId}:`,
      error
    );
    throw error;
  }
};

export const validateMenuItemExists = async (menuItemId: string) => {
  try {
    return await prisma.menuItem.findUnique({
      where: {
        id: menuItemId,
        isActive: true,
        isVisible: true,
      },
      select: {
        id: true,
        title: true,
        finalPrice: true,
        stockStatus: true,
        restaurantId: true,
        maxOrderQuantity: true,
        minOrderQuantity: true,
      },
    });
  } catch (error) {
    logger.error(`Error validating menu item ${menuItemId}:`, error);
    throw error;
  }
};

export const validateMenuItemVariant = async (
  variantId: string,
  menuItemId: string
) => {
  try {
    return await prisma.menuItemVariant.findFirst({
      where: {
        id: variantId,
        menuItemId,
        isActive: true,
      },
      select: {
        id: true,
        weight: true,
      },
    });
  } catch (error) {
    logger.error(
      `Error validating variant ${variantId} for menu item ${menuItemId}:`,
      error
    );
    throw error;
  }
};
