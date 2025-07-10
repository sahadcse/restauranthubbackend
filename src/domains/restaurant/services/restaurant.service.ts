import * as restaurantRepository from "../repositories/restaurant.repository";
import * as inventoryService from "../../inventory/services/inventory.service";
import logger from "../../../utils/logger";
// Add notification integration
import { notificationIntegration } from "../../notification/services/integration.service";

// Helper to generate a unique restaurantPageUrl slug
const generateUniqueSlug = async (name: string) => {
  let baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 50);

  let slug = baseSlug;
  let counter = 1;
  // Check for existing slug in DB
  while (await restaurantRepository.findByRestaurantPageUrl(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  return slug;
};

// Restaurant services
export const getAllRestaurants = async (page = 1, limit = 10, filters = {}) => {
  try {
    return await restaurantRepository.findAllRestaurants(page, limit, filters);
  } catch (error) {
    logger.error("Service error in getAllRestaurants:", error);
    throw error;
  }
};

export const getRestaurantById = async (id: string) => {
  try {
    return await restaurantRepository.findRestaurantById(id);
  } catch (error) {
    logger.error(`Service error in getRestaurantById for id ${id}:`, error);
    throw error;
  }
};

export const createRestaurant = async (data: any) => {
  try {
    // Business logic for restaurant creation
    // Validate coordinates if provided
    if (data.location) {
      // Ensure location is stored as a proper JSON object
      if (typeof data.location === "string") {
        try {
          data.location = JSON.parse(data.location);
        } catch (e) {
          throw new Error("Invalid location data format");
        }
      }
    }

    // Ensure business hours is stored as a proper JSON object
    if (data.businessHours) {
      if (typeof data.businessHours === "string") {
        try {
          data.businessHours = JSON.parse(data.businessHours);
        } catch (e) {
          throw new Error("Invalid business hours format");
        }
      }
    }

    if (!data.restaurantPageUrl && data.name) {
      // Generate a unique URL-friendly slug from the restaurant name
      data.restaurantPageUrl = await generateUniqueSlug(data.name);
    }

    const restaurant = await restaurantRepository.createRestaurant(data);

    // Send restaurant creation notification to owner
    try {
      await notificationIntegration.restaurant.approved(
        data.ownerId,
        restaurant.name,
        undefined // Use undefined instead of restaurant.tenantId since Restaurant model doesn't have tenantId
      );
    } catch (notificationError) {
      logger.warn(
        "Failed to send restaurant creation notification:",
        notificationError
      );
    }

    return restaurant;
  } catch (error) {
    logger.error("Service error in createRestaurant:", error);
    throw error;
  }
};

export const updateRestaurant = async (id: string, data: any) => {
  try {
    // Business logic for restaurant update
    // Handle JSON field parsing
    if (data.location && typeof data.location === "string") {
      try {
        data.location = JSON.parse(data.location);
      } catch (e) {
        throw new Error("Invalid location data format");
      }
    }

    if (data.businessHours && typeof data.businessHours === "string") {
      try {
        data.businessHours = JSON.parse(data.businessHours);
      } catch (e) {
        throw new Error("Invalid business hours format");
      }
    }

    // If new imageUrl is provided and it's from Cloudinary
    if (
      data.imageUrl &&
      (data.imageUrl.includes("cloudinary.com") ||
        data.imageUrl.includes("res.cloudinary.com"))
    ) {
      // Keep the new Cloudinary URL
      // You could optionally delete the old image from Cloudinary here
    }

    const updatedRestaurant = await restaurantRepository.updateRestaurant(
      id,
      data
    );

    // Send notification for significant changes
    if (data.isActive !== undefined) {
      try {
        const restaurant = await restaurantRepository.findRestaurantById(id);
        if (restaurant) {
          const status = data.isActive ? "activated" : "deactivated";
          await notificationIntegration.system.securityAlert(
            restaurant.ownerId,
            "restaurant_status_change",
            {
              restaurantName: restaurant.name,
              status: status,
              updatedAt: new Date().toISOString(),
            },
            undefined // Use undefined instead of restaurant.tenantId
          );
        }
      } catch (notificationError) {
        logger.warn(
          "Failed to send restaurant status change notification:",
          notificationError
        );
      }
    }

    return updatedRestaurant;
  } catch (error) {
    logger.error(`Service error in updateRestaurant for id ${id}:`, error);
    throw error;
  }
};

export const deleteRestaurant = async (id: string) => {
  try {
    // Check if restaurant can be deleted (no active orders, etc.)
    // This would involve some business logic to ensure safe deletion
    return await restaurantRepository.deleteRestaurant(id);
  } catch (error) {
    logger.error(`Service error in deleteRestaurant for id ${id}:`, error);
    throw error;
  }
};

// Menu services
export const getMenusByRestaurantId = async (restaurantId: string) => {
  try {
    return await restaurantRepository.findMenusByRestaurantId(restaurantId);
  } catch (error) {
    logger.error(
      `Service error in getMenusByRestaurantId for restaurantId ${restaurantId}:`,
      error
    );
    throw error;
  }
};

export const getMenuById = async (id: string) => {
  try {
    return await restaurantRepository.findMenuById(id);
  } catch (error) {
    logger.error(`Service error in getMenuById for id ${id}:`, error);
    throw error;
  }
};

export const createMenu = async (data: any) => {
  try {
    // Get the restaurant to verify it exists
    const restaurant = await restaurantRepository.findRestaurantById(
      data.restaurantId
    );

    if (!restaurant) {
      throw new Error(`Restaurant with ID ${data.restaurantId} not found`);
    }

    // Use the restaurant's ID as the tenantId - this is a common pattern
    // where each restaurant acts as its own tenant in a multi-tenant system
    const menuData = {
      ...data,
      tenantId: data.restaurantId,
    };

    return await restaurantRepository.createMenu(menuData);
  } catch (error) {
    logger.error("Service error in createMenu:", error);
    throw error;
  }
};

export const updateMenu = async (id: string, data: any) => {
  try {
    return await restaurantRepository.updateMenu(id, data);
  } catch (error) {
    logger.error(`Service error in updateMenu for id ${id}:`, error);
    throw error;
  }
};

export const deleteMenu = async (id: string) => {
  try {
    return await restaurantRepository.deleteMenu(id);
  } catch (error) {
    logger.error(`Service error in deleteMenu for id ${id}:`, error);
    throw error;
  }
};

// Menu Item services
export const getAllMenuItems = async (page = 1, limit = 20, filters = {}) => {
  try {
    return await restaurantRepository.findAllMenuItems(page, limit, filters);
  } catch (error) {
    logger.error("Service error in getAllMenuItems:", error);
    throw error;
  }
};

export const getMenuItemById = async (id: string) => {
  try {
    return await restaurantRepository.findMenuItemById(id);
  } catch (error) {
    logger.error(`Service error in getMenuItemById for id ${id}:`, error);
    throw error;
  }
};

// Update createMenuItem to handle image uploads with our media service
export const createMenuItem = async (data: any) => {
  try {
    // Business logic for menu item creation

    // Handle special JSON fields
    if (
      data.availabilitySchedule &&
      typeof data.availabilitySchedule === "string"
    ) {
      try {
        data.availabilitySchedule = JSON.parse(data.availabilitySchedule);
      } catch (e) {
        throw new Error("Invalid availability schedule format");
      }
    }

    if (data.nutritionInfo && typeof data.nutritionInfo === "string") {
      try {
        data.nutritionInfo = JSON.parse(data.nutritionInfo);
      } catch (e) {
        throw new Error("Invalid nutrition info format");
      }
    }

    if (data.allergens && typeof data.allergens === "string") {
      try {
        data.allergens = JSON.parse(data.allergens);
      } catch (e) {
        throw new Error("Invalid allergens format");
      }
    }

    // Calculate discount percentage if not provided
    if (!data.discountPercentage && data.mrp && data.finalPrice) {
      data.discountPercentage = ((data.mrp - data.finalPrice) / data.mrp) * 100;
    }

    // Extract menuId if provided to handle menu assignment after creation
    const { menuId, initialStock, ...menuItemData } = data;

    // Set tenantId as the restaurantId if not provided
    if (!menuItemData.tenantId) {
      menuItemData.tenantId = menuItemData.restaurantId;
    }

    // Handle creation of related entities if provided
    const menuItem = await restaurantRepository.createMenuItem(menuItemData);

    // Send notification for new menu item (if it's featured)
    if (data.isFeatured) {
      try {
        const restaurant = await restaurantRepository.findRestaurantById(
          menuItem.restaurantId
        );
        if (restaurant) {
          await notificationIntegration.promotional.sendBulkPromotion(
            [restaurant.ownerId], // Could be expanded to customers who favorited the restaurant
            "New Featured Item Added",
            `Check out our new featured item: ${menuItem.title}`,
            {
              menuItemId: menuItem.id,
              restaurantId: restaurant.id,
              itemName: menuItem.title,
            },
            undefined // Use undefined for tenantId
          );
        }
      } catch (notificationError) {
        logger.warn(
          "Failed to send new menu item notification:",
          notificationError
        );
      }
    }

    // Create initial inventory record if provided
    if (initialStock && typeof initialStock === "object") {
      try {
        await inventoryService.createInventory({
          menuItemId: menuItem.id,
          restaurantId: menuItem.restaurantId,
          quantity: initialStock.quantity || 0,
          reorderThreshold: initialStock.reorderThreshold || 10,
          supplierId: initialStock.supplierId,
          location: initialStock.location,
        });

        logger.info(`Initial inventory created for menu item ${menuItem.id}`);
      } catch (inventoryError) {
        logger.warn(
          `Failed to create initial inventory for menu item ${menuItem.id}:`,
          inventoryError
        );
        // Don't fail the menu item creation if inventory creation fails
      }
    }

    // Handle menu item variants
    if (data.variants && Array.isArray(data.variants)) {
      for (const variant of data.variants) {
        await restaurantRepository.createMenuItemVariant({
          ...variant,
          menuItemId: menuItem.id,
        });
      }
    }

    // Handle menu item images
    if (data.images && Array.isArray(data.images)) {
      for (const image of data.images) {
        // If image contains a valid Cloudinary URL, create the image record
        if (
          image.imageUrl &&
          (image.imageUrl.includes("cloudinary.com") ||
            image.imageUrl.includes("res.cloudinary.com"))
        ) {
          await restaurantRepository.createMenuItemImage({
            ...image,
            menuItemId: menuItem.id,
          });
        }
      }
    }

    // Handle menu item specifications
    if (data.specifications && Array.isArray(data.specifications)) {
      for (const spec of data.specifications) {
        await restaurantRepository.createMenuItemSpecification({
          ...spec,
          menuItemId: menuItem.id,
        });
      }
    }

    // If menuId is provided, create the menu-menuItem relationship
    if (menuId) {
      await restaurantRepository.assignMenuItemToMenu(menuItem.id, menuId);
    }

    // Return the created menu item with all its relationships
    return await restaurantRepository.findMenuItemById(menuItem.id);
  } catch (error) {
    logger.error("Service error in createMenuItem:", error);
    throw error;
  }
};

export const updateMenuItem = async (id: string, data: any) => {
  try {
    // Business logic for menu item update

    // Handle special JSON fields
    if (
      data.availabilitySchedule &&
      typeof data.availabilitySchedule === "string"
    ) {
      try {
        data.availabilitySchedule = JSON.parse(data.availabilitySchedule);
      } catch (e) {
        throw new Error("Invalid availability schedule format");
      }
    }

    if (data.nutritionInfo && typeof data.nutritionInfo === "string") {
      try {
        data.nutritionInfo = JSON.parse(data.nutritionInfo);
      } catch (e) {
        throw new Error("Invalid nutrition info format");
      }
    }

    if (data.allergens && typeof data.allergens === "string") {
      try {
        data.allergens = JSON.parse(data.allergens);
      } catch (e) {
        throw new Error("Invalid allergens format");
      }
    }

    // Calculate discount percentage if not provided
    if (!data.discountPercentage && data.mrp && data.finalPrice) {
      data.discountPercentage = ((data.mrp - data.finalPrice) / data.mrp) * 100;
    }

    // Update the menu item
    const menuItem = await restaurantRepository.updateMenuItem(id, data);

    // Send notification for stock status changes
    if (data.stockStatus && data.stockStatus === "IN_STOCK") {
      try {
        // This would typically involve getting users who have this item in wishlist
        // For now, we'll send to restaurant owner
        const restaurant = await restaurantRepository.findRestaurantById(
          menuItem.restaurantId
        );
        if (restaurant) {
          await notificationIntegration.promotional.sendBulkPromotion(
            [restaurant.ownerId],
            "Item Back in Stock",
            `${menuItem.title} is now back in stock!`,
            {
              menuItemId: menuItem.id,
              restaurantId: restaurant.id,
              itemName: menuItem.title,
            },
            undefined // Use undefined for tenantId
          );
        }
      } catch (notificationError) {
        logger.warn(
          "Failed to send back in stock notification:",
          notificationError
        );
      }
    }

    // Handle variants update if provided
    if (data.variants && Array.isArray(data.variants)) {
      // Update existing variants or create new ones
      for (const variant of data.variants) {
        if (variant.id) {
          await restaurantRepository.updateMenuItemVariant(variant.id, variant);
        } else {
          await restaurantRepository.createMenuItemVariant({
            ...variant,
            menuItemId: id,
          });
        }
      }
    }

    // Handle images update if provided
    if (data.images && Array.isArray(data.images)) {
      // If the primary image changes or images are reordered, update accordingly
      for (const image of data.images) {
        if (image.id) {
          await restaurantRepository.updateMenuItemImage(image.id, image);
        } else {
          await restaurantRepository.createMenuItemImage({
            ...image,
            menuItemId: id,
          });
        }
      }
    }

    // Handle specifications update if provided
    if (data.specifications && Array.isArray(data.specifications)) {
      for (const spec of data.specifications) {
        if (spec.id) {
          await restaurantRepository.updateMenuItemSpecification(spec.id, spec);
        } else {
          await restaurantRepository.createMenuItemSpecification({
            ...spec,
            menuItemId: id,
          });
        }
      }
    }

    // Return the updated menu item with all its relationships
    return await restaurantRepository.findMenuItemById(id);
  } catch (error) {
    logger.error(`Service error in updateMenuItem for id ${id}:`, error);
    throw error;
  }
};

export const deleteMenuItem = async (id: string) => {
  try {
    // Check if there's any inventory for this menu item
    try {
      const inventory = await inventoryService.getInventoryByMenuItem(id);
      if (inventory) {
        // Delete inventory record first
        await inventoryService.deleteInventory(inventory.id);
        logger.info(`Inventory deleted for menu item ${id}`);
      }
    } catch (inventoryError) {
      logger.warn(
        `Could not delete inventory for menu item ${id}:`,
        inventoryError
      );
      // Continue with menu item deletion even if inventory deletion fails
    }

    // Soft delete - set isActive to false, set deletedAt timestamp
    return await restaurantRepository.updateMenuItem(id, {
      isActive: false,
      isVisible: false,
      deletedAt: new Date(),
    });
  } catch (error) {
    logger.error(`Service error in deleteMenuItem for id ${id}:`, error);
    throw error;
  }
};

// Category services
export const getAllCategories = async () => {
  try {
    const categories = await restaurantRepository.findAllCategories();
    if (!categories || categories.length === 0) {
      return []; // Return an empty array if no categories found
    }
    return categories;
  } catch (error) {
    logger.error("Service error in getAllCategories:", error);
    throw error;
  }
};

export const getCategoryById = async (id: string) => {
  try {
    const category = await restaurantRepository.findCategoryById(id);

    // Add null check to handle case when category is not found
    if (!category) {
      return null; // Make sure the return type is properly typed to allow null
    }

    return category;
  } catch (error) {
    logger.error(`Service error in getCategoryById for id ${id}:`, error);
    throw error;
  }
};

// Enhanced Category services
export const createCategory = async (data: any) => {
  try {
    console.log("Creating category with data service:", data);
    // Check if slug is already taken
    const existingCategory = await restaurantRepository.findCategoryBySlug(
      data.slug
    );
    if (existingCategory) {
      throw new Error(`Category with slug '${data.slug}' already exists`);
    }

    console.log("test -2");

    // If parentId is provided, check if parent category exists
    if (data.parentId) {
      const parentCategory = await restaurantRepository.findCategoryById(
        data.parentId
      );
      if (!parentCategory) {
        throw new Error(`Parent category with ID ${data.parentId} not found`);
      }
    }

    console.log("test -3");

    console.log("Creating category with data:", data);

    return await restaurantRepository.createCategory(data);
  } catch (error) {
    logger.error("Service error in createCategory:", error);
    throw error;
  }
};

export const updateCategory = async (id: string, data: any) => {
  try {
    // Check if category exists
    const category = await restaurantRepository.findCategoryById(id);
    if (!category) {
      throw new Error(`Category with ID ${id} not found`);
    }

    // If slug is being changed, check if new slug is already taken
    if (data.slug && data.slug !== category.slug) {
      const existingCategory = await restaurantRepository.findCategoryBySlug(
        data.slug
      );
      if (existingCategory && existingCategory.id !== id) {
        throw new Error(`Category with slug '${data.slug}' already exists`);
      }
    }

    // If parentId is being changed, check if new parent category exists
    // and prevent circular references
    if (data.parentId && data.parentId !== category.parentId) {
      // Prevent setting parent to self
      if (data.parentId === id) {
        throw new Error("Category cannot be its own parent");
      }

      const parentCategory = await restaurantRepository.findCategoryById(
        data.parentId
      );
      if (!parentCategory) {
        throw new Error(`Parent category with ID ${data.parentId} not found`);
      }

      // Prevent circular reference in hierarchy
      let currentParent: typeof parentCategory | null = parentCategory;
      while (currentParent && currentParent.parentId) {
        if (currentParent.parentId === id) {
          throw new Error("Circular reference detected in category hierarchy");
        }

        // Explicitly handle the possibility of null return
        const nextParent = await restaurantRepository.findCategoryById(
          currentParent.parentId
        );

        // Break the loop if parent not found to avoid infinite loop
        if (!nextParent) {
          break;
        }

        currentParent = nextParent;
      }
    }

    return await restaurantRepository.updateCategory(id, data);
  } catch (error) {
    logger.error(`Service error in updateCategory for id ${id}:`, error);
    throw error;
  }
};

export const deleteCategory = async (id: string) => {
  try {
    // Check if category exists
    const category = await restaurantRepository.findCategoryById(id);
    if (!category) {
      throw new Error(`Category with ID ${id} not found`);
    }

    // Check if category has active children
    if (
      category.children &&
      category.children.some((child) => child.isActive)
    ) {
      throw new Error("Cannot delete category with active subcategories");
    }

    // Check if category has menu items
    if (category.menuItems && category.menuItems.length > 0) {
      throw new Error("Cannot delete category with associated menu items");
    }

    return await restaurantRepository.deleteCategory(id);
  } catch (error) {
    logger.error(`Service error in deleteCategory for id ${id}:`, error);
    throw error;
  }
};

export const getCategoryBySlug = async (slug: string) => {
  try {
    const category = await restaurantRepository.findCategoryBySlug(slug);
    if (!category) {
      throw new Error(`Category with slug '${slug}' not found`);
    }
    return category;
  } catch (error) {
    logger.error(`Service error in getCategoryBySlug for slug ${slug}:`, error);
    throw error;
  }
};

// Other services
export const getAllBrands = async () => {
  try {
    return await restaurantRepository.findAllBrands();
  } catch (error) {
    logger.error("Service error in getAllBrands:", error);
    throw error;
  }
};

export const getAllTaxRates = async () => {
  try {
    return await restaurantRepository.findAllTaxRates();
  } catch (error) {
    logger.error("Service error in getAllTaxRates:", error);
    throw error;
  }
};

export const getAllAllergens = async () => {
  try {
    return await restaurantRepository.findAllAllergens();
  } catch (error) {
    logger.error("Service error in getAllAllergens:", error);
    throw error;
  }
};
