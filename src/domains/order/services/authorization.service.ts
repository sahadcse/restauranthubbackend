import {
  UserRole,
  Order,
  Delivery,
  OrderCancellation,
} from "../../../../prisma/generated/prisma";
import { AuthUser } from "../../../types/express";
import { findRestaurantsByUserId } from "../../restaurant/repositories/restaurant.repository";
import logger from "../../../utils/logger";

/**
 * Authorization Service for Order Domain
 *
 * Implements role-based access control according to business rules:
 * - CUSTOMER: Can only see their own orders
 * - RESTAURANT_OWNER/RESTAURANT_STAFF: Can see orders for their restaurants
 * - ADMIN/SUPER_ADMIN: Can see all orders
 */

export const applyOrderFilters = async (user: AuthUser, filters: any) => {
  try {
    const authorizedFilters = { ...filters };

    switch (user.role) {
      case UserRole.CUSTOMER:
        // Customers can only see their own orders
        authorizedFilters.userId = user.id;
        // Remove any restaurant filters they might have tried to set
        delete authorizedFilters.restaurantId;
        break;

      case UserRole.RESTAURANT_OWNER:
      case UserRole.RESTAURANT_STAFF:
        // Restaurant staff can only see orders for their restaurants
        const userRestaurants = await findRestaurantsByUserId(user.id);
        const restaurantIds = userRestaurants.map((r) => r.id);

        if (restaurantIds.length === 0) {
          // If user has no restaurants, they can't see any orders
          authorizedFilters.restaurantId = "no-access";
        } else if (filters.restaurantId) {
          // If a specific restaurant is requested, verify they own it
          if (restaurantIds.includes(filters.restaurantId)) {
            authorizedFilters.restaurantId = filters.restaurantId;
          } else {
            authorizedFilters.restaurantId = "no-access";
          }
        } else {
          // Show orders from all their restaurants
          authorizedFilters.restaurantIds = restaurantIds;
        }
        break;

      case UserRole.ADMIN:
      case UserRole.SUPER_ADMIN:
        // Admins can see all orders - no additional filters needed
        break;

      default:
        // Unknown role - deny access
        authorizedFilters.userId = "no-access";
        break;
    }

    logger.info(
      `Applied order filters for user ${user.id} (${user.role}):`,
      authorizedFilters
    );
    return authorizedFilters;
  } catch (error) {
    logger.error("Error applying order filters:", error);
    // On error, default to restrictive access
    return { userId: user.role === UserRole.CUSTOMER ? user.id : "no-access" };
  }
};

export const canAccessOrder = async (
  user: AuthUser,
  order: Order
): Promise<boolean> => {
  try {
    switch (user.role) {
      case UserRole.CUSTOMER:
        return order.userId === user.id;

      case UserRole.RESTAURANT_OWNER:
      case UserRole.RESTAURANT_STAFF:
        const userRestaurants = await findRestaurantsByUserId(user.id);
        return userRestaurants.some((r) => r.id === order.restaurantId);

      case UserRole.ADMIN:
      case UserRole.SUPER_ADMIN:
        return true;

      default:
        return false;
    }
  } catch (error) {
    logger.error("Error checking order access:", error);
    return false;
  }
};

export const canUpdateOrder = async (
  user: AuthUser,
  order: Order
): Promise<boolean> => {
  try {
    switch (user.role) {
      case UserRole.CUSTOMER:
        // Customers can only update their own orders and only in limited circumstances
        return order.userId === user.id;

      case UserRole.RESTAURANT_OWNER:
      case UserRole.RESTAURANT_STAFF:
        const userRestaurants = await findRestaurantsByUserId(user.id);
        return userRestaurants.some((r) => r.id === order.restaurantId);

      case UserRole.ADMIN:
      case UserRole.SUPER_ADMIN:
        return true;

      default:
        return false;
    }
  } catch (error) {
    logger.error("Error checking order update permission:", error);
    return false;
  }
};

export const applyDeliveryFilters = async (user: AuthUser, filters: any) => {
  try {
    const authorizedFilters = { ...filters };

    switch (user.role) {
      case UserRole.CUSTOMER:
        // Customers shouldn't access delivery endpoints directly
        authorizedFilters.driverId = "no-access";
        break;

      case UserRole.RESTAURANT_OWNER:
      case UserRole.RESTAURANT_STAFF:
        // Restaurant staff can see deliveries for their restaurants' orders
        const userRestaurants = await findRestaurantsByUserId(user.id);
        const restaurantIds = userRestaurants.map((r) => r.id);

        if (restaurantIds.length === 0) {
          authorizedFilters.restaurantIds = ["no-access"];
        } else {
          authorizedFilters.restaurantIds = restaurantIds;
        }
        break;

      case UserRole.ADMIN:
      case UserRole.SUPER_ADMIN:
        // Admins can see all deliveries
        break;

      default:
        authorizedFilters.driverId = "no-access";
        break;
    }

    return authorizedFilters;
  } catch (error) {
    logger.error("Error applying delivery filters:", error);
    return { driverId: "no-access" };
  }
};

export const canAccessDelivery = async (
  user: AuthUser,
  delivery: any
): Promise<boolean> => {
  try {
    switch (user.role) {
      case UserRole.CUSTOMER:
        // Customers can access delivery info for their orders
        return delivery.order?.userId === user.id;

      case UserRole.RESTAURANT_OWNER:
      case UserRole.RESTAURANT_STAFF:
        const userRestaurants = await findRestaurantsByUserId(user.id);
        return userRestaurants.some(
          (r) => r.id === delivery.order?.restaurantId
        );

      case UserRole.ADMIN:
      case UserRole.SUPER_ADMIN:
        return true;

      default:
        return false;
    }
  } catch (error) {
    logger.error("Error checking delivery access:", error);
    return false;
  }
};

export const canUpdateDelivery = async (
  user: AuthUser,
  delivery: any
): Promise<boolean> => {
  try {
    switch (user.role) {
      case UserRole.CUSTOMER:
        return false; // Customers cannot update delivery status

      case UserRole.RESTAURANT_OWNER:
      case UserRole.RESTAURANT_STAFF:
        const userRestaurants = await findRestaurantsByUserId(user.id);
        return userRestaurants.some(
          (r) => r.id === delivery.order?.restaurantId
        );

      case UserRole.ADMIN:
      case UserRole.SUPER_ADMIN:
        return true;

      default:
        return false;
    }
  } catch (error) {
    logger.error("Error checking delivery update permission:", error);
    return false;
  }
};

export const canCancelOrder = async (
  user: AuthUser,
  order: Order
): Promise<boolean> => {
  try {
    switch (user.role) {
      case UserRole.CUSTOMER:
        return order.userId === user.id;

      case UserRole.RESTAURANT_OWNER:
      case UserRole.RESTAURANT_STAFF:
        const userRestaurants = await findRestaurantsByUserId(user.id);
        return userRestaurants.some((r) => r.id === order.restaurantId);

      case UserRole.ADMIN:
      case UserRole.SUPER_ADMIN:
        return true;

      default:
        return false;
    }
  } catch (error) {
    logger.error("Error checking order cancellation permission:", error);
    return false;
  }
};

export const canAccessOrderCancellation = async (
  user: AuthUser,
  cancellation: any
): Promise<boolean> => {
  try {
    switch (user.role) {
      case UserRole.CUSTOMER:
        return (
          cancellation.order?.userId === user.id ||
          cancellation.requestedBy === user.id
        );

      case UserRole.RESTAURANT_OWNER:
      case UserRole.RESTAURANT_STAFF:
        const userRestaurants = await findRestaurantsByUserId(user.id);
        return userRestaurants.some(
          (r) => r.id === cancellation.order?.restaurantId
        );

      case UserRole.ADMIN:
      case UserRole.SUPER_ADMIN:
        return true;

      default:
        return false;
    }
  } catch (error) {
    logger.error("Error checking order cancellation access:", error);
    return false;
  }
};

export const applyCancellationFilters = async (
  user: AuthUser,
  filters: any
): Promise<any> => {
  try {
    const authorizedFilters: any = {};

    switch (user.role) {
      case UserRole.CUSTOMER:
        authorizedFilters.requesterId = user.id;
        break;

      case UserRole.RESTAURANT_OWNER:
      case UserRole.RESTAURANT_STAFF:
        const userRestaurants = await findRestaurantsByUserId(user.id);
        authorizedFilters.restaurantIds = userRestaurants.map((r) => r.id);
        break;

      case UserRole.ADMIN:
      case UserRole.SUPER_ADMIN:
        // Admins can see all cancellations
        break;

      default:
        authorizedFilters.requesterId = "no-access";
        break;
    }

    return authorizedFilters;
  } catch (error) {
    logger.error("Error applying cancellation filters:", error);
    return { requesterId: "no-access" };
  }
};
