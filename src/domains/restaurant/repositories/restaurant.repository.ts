import { PrismaClient } from "../../../../prisma/generated/prisma";
import logger from "../../../utils/logger";

const prisma = new PrismaClient();

// Helper function for pagination
const getPagination = (page: number, limit: number) => {
  const skip = (page - 1) * limit;
  return { skip, take: limit };
};

// Restaurant repositories
export const findAllRestaurants = async (
  page = 1,
  limit = 10,
  filters: any = {}
) => {
  try {
    const { skip, take } = getPagination(page, limit);

    // Build where conditions based on filters
    const where: any = { isActive: true };

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
        { address: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    // Get total count for pagination
    const total = await prisma.restaurant.count({ where });

    // Get restaurants with relations
    const restaurants = await prisma.restaurant.findMany({
      where,
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        brand: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    });

    return {
      data: restaurants,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error("Repository error in findAllRestaurants:", error);
    throw error;
  }
};

export const findRestaurantById = async (id: string) => {
  try {
    return await prisma.restaurant.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        brand: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
          },
        },
      },
    });
  } catch (error) {
    logger.error(`Error finding restaurant by id ${id}:`, error);
    throw error;
  }
};

export const createRestaurant = async (data: any) => {
  try {
    return await prisma.restaurant.create({
      data,
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        brand: true,
      },
    });
  } catch (error) {
    logger.error("Repository error in createRestaurant:", error);
    throw error;
  }
};

export const updateRestaurant = async (id: string, data: any) => {
  try {
    return await prisma.restaurant.update({
      where: { id },
      data,
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        brand: true,
      },
    });
  } catch (error) {
    logger.error(`Repository error in updateRestaurant for id ${id}:`, error);
    throw error;
  }
};

export const deleteRestaurant = async (id: string) => {
  try {
    // We're doing a soft delete here
    return await prisma.restaurant.update({
      where: { id },
      data: { isActive: false },
    });
  } catch (error) {
    logger.error(`Repository error in deleteRestaurant for id ${id}:`, error);
    throw error;
  }
};

// Menu repositories
export const findMenusByRestaurantId = async (restaurantId: string) => {
  try {
    return await prisma.menu.findMany({
      where: {
        restaurantId,
        isActive: true,
      },
      include: {
        menuItems: {
          include: {
            menuItem: {
              include: {
                category: true,
                images: {
                  where: { isPrimary: true },
                  take: 1,
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    logger.error(
      `Repository error in findMenusByRestaurantId for restaurantId ${restaurantId}:`,
      error
    );
    throw error;
  }
};

export const findMenuById = async (id: string) => {
  try {
    return await prisma.menu.findUnique({
      where: { id },
      include: {
        menuItems: {
          include: {
            menuItem: {
              include: {
                category: true,
                images: true,
                variants: true,
              },
            },
          },
        },
        restaurant: {
          select: {
            id: true,
            name: true,
            currency: true,
          },
        },
      },
    });
  } catch (error) {
    logger.error(`Repository error in findMenuById for id ${id}:`, error);
    throw error;
  }
};

export const createMenu = async (data: any) => {
  try {
    return await prisma.menu.create({
      data,
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  } catch (error) {
    logger.error("Repository error in createMenu:", error);
    throw error;
  }
};

export const updateMenu = async (id: string, data: any) => {
  try {
    return await prisma.menu.update({
      where: { id },
      data,
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  } catch (error) {
    logger.error(`Repository error in updateMenu for id ${id}:`, error);
    throw error;
  }
};

export const deleteMenu = async (id: string) => {
  try {
    // Soft delete
    return await prisma.menu.update({
      where: { id },
      data: { isActive: false },
    });
  } catch (error) {
    logger.error(`Repository error in deleteMenu for id ${id}:`, error);
    throw error;
  }
};

// Menu Item repositories
export const findAllMenuItems = async (
  page = 1,
  limit = 20,
  filters: any = {}
) => {
  try {
    const { skip, take } = getPagination(page, limit);

    // Build where conditions based on filters
    const where: any = { isActive: true };

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.categoryId) {
      where.categoryId = filters.categoryId;
    }

    if (filters.restaurantId) {
      where.restaurantId = filters.restaurantId;
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
        { sku: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    // Get total count for pagination
    const total = await prisma.menuItem.count({ where });

    // Get menu items with relations
    const menuItems = await prisma.menuItem.findMany({
      where,
      include: {
        category: true,
        images: true,
        variants: true,
        restaurant: {
          select: {
            id: true,
            name: true,
            currency: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    });

    return {
      data: menuItems,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error("Repository error in findAllMenuItems:", error);
    throw error;
  }
};

export const findMenuItemById = async (id: string) => {
  try {
    return await prisma.menuItem.findUnique({
      where: { id },
      include: {
        category: {
          select: {
            name: true,
          },
        },
        images: {
          where: { isPrimary: true },
          take: 1,
        },
      },
    });
  } catch (error) {
    logger.error(`Error finding menu item by id ${id}:`, error);
    throw error;
  }
};

export const createMenuItem = async (data: any) => {
  try {
    // Extract nested properties to handle separately
    const { variants, images, specifications, ...menuItemData } = data;

    // Create the menu item
    return await prisma.menuItem.create({
      data: menuItemData,
      include: {
        category: true,
        restaurant: {
          select: {
            id: true,
            name: true,
            currency: true,
          },
        },
      },
    });
  } catch (error) {
    logger.error("Repository error in createMenuItem:", error);
    throw error;
  }
};

export const updateMenuItem = async (id: string, data: any) => {
  try {
    // Extract nested properties to handle separately
    const { variants, images, specifications, ...menuItemData } = data;

    // Update the menu item
    return await prisma.menuItem.update({
      where: { id },
      data: menuItemData,
      include: {
        category: true,
        restaurant: {
          select: {
            id: true,
            name: true,
            currency: true,
          },
        },
      },
    });
  } catch (error) {
    logger.error(`Repository error in updateMenuItem for id ${id}:`, error);
    throw error;
  }
};

// Menu Item Variant repositories
export const createMenuItemVariant = async (data: any) => {
  try {
    return await prisma.menuItemVariant.create({
      data,
    });
  } catch (error) {
    logger.error("Repository error in createMenuItemVariant:", error);
    throw error;
  }
};

export const updateMenuItemVariant = async (id: string, data: any) => {
  try {
    return await prisma.menuItemVariant.update({
      where: { id },
      data,
    });
  } catch (error) {
    logger.error(
      `Repository error in updateMenuItemVariant for id ${id}:`,
      error
    );
    throw error;
  }
};

// Menu Item Image repositories
export const createMenuItemImage = async (data: any) => {
  try {
    return await prisma.menuItemImage.create({
      data,
    });
  } catch (error) {
    logger.error("Repository error in createMenuItemImage:", error);
    throw error;
  }
};

export const updateMenuItemImage = async (id: string, data: any) => {
  try {
    return await prisma.menuItemImage.update({
      where: { id },
      data,
    });
  } catch (error) {
    logger.error(
      `Repository error in updateMenuItemImage for id ${id}:`,
      error
    );
    throw error;
  }
};

// Menu Item Specification repositories
export const createMenuItemSpecification = async (data: any) => {
  try {
    return await prisma.menuItemSpecification.create({
      data,
    });
  } catch (error) {
    logger.error("Repository error in createMenuItemSpecification:", error);
    throw error;
  }
};

export const updateMenuItemSpecification = async (id: string, data: any) => {
  try {
    return await prisma.menuItemSpecification.update({
      where: { id },
      data,
    });
  } catch (error) {
    logger.error(
      `Repository error in updateMenuItemSpecification for id ${id}:`,
      error
    );
    throw error;
  }
};

// Category repositories
export const findAllCategories = async () => {
  try {
    return await prisma.category.findMany({
      where: { isActive: true },
      include: {
        parent: true,
        children: {
          where: { isActive: true },
        },
      },
      orderBy: [{ order: "asc" }, { name: "asc" }],
    });
  } catch (error) {
    logger.error("Repository error in findAllCategories:", error);
    throw error;
  }
};

export const findCategoryById = async (id: string) => {
  try {
    return await prisma.category.findUnique({
      where: { id },
      include: {
        parent: true,
        children: {
          where: { isActive: true },
          orderBy: [{ order: "asc" }, { name: "asc" }],
        },
        menuItems: {
          where: { isActive: true },
          take: 20,
          include: {
            images: {
              where: { isPrimary: true },
              take: 1,
            },
          },
        },
      },
    });
  } catch (error) {
    logger.error(`Repository error in findCategoryById for id ${id}:`, error);
    throw error;
  }
};

// Additional Category repositories
export const createCategory = async (data: any) => {
  try {
    return await prisma.category.create({
      data,
      include: {
        parent: true,
      },
    });
  } catch (error) {
    logger.error("Repository error in createCategory:", error);
    throw error;
  }
};

export const updateCategory = async (id: string, data: any) => {
  try {
    return await prisma.category.update({
      where: { id },
      data,
      include: {
        parent: true,
        children: {
          where: { isActive: true },
          orderBy: [{ order: "asc" }, { name: "asc" }],
        },
      },
    });
  } catch (error) {
    logger.error(`Repository error in updateCategory for id ${id}:`, error);
    throw error;
  }
};

export const deleteCategory = async (id: string) => {
  try {
    // Soft delete - update isActive to false
    return await prisma.category.update({
      where: { id },
      data: { isActive: false },
    });
  } catch (error) {
    logger.error(`Repository error in deleteCategory for id ${id}:`, error);
    throw error;
  }
};

export const findCategoryBySlug = async (slug: string) => {
  try {
    return await prisma.category.findUnique({
      where: { slug },
      include: {
        parent: true,
        children: {
          where: { isActive: true },
          orderBy: [{ order: "asc" }, { name: "asc" }],
        },
      },
    });
  } catch (error) {
    logger.error(
      `Repository error in findCategoryBySlug for slug ${slug}:`,
      error
    );
    throw error;
  }
};

// Other repositories
export const findAllBrands = async () => {
  try {
    return await prisma.brand.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });
  } catch (error) {
    logger.error("Repository error in findAllBrands:", error);
    throw error;
  }
};

export const findAllTaxRates = async () => {
  try {
    return await prisma.taxRate.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });
  } catch (error) {
    logger.error("Repository error in findAllTaxRates:", error);
    throw error;
  }
};

export const findAllAllergens = async () => {
  try {
    return await prisma.allergen.findMany({
      orderBy: { name: "asc" },
    });
  } catch (error) {
    logger.error("Repository error in findAllAllergens:", error);
    throw error;
  }
};

// Find restaurant by restaurantPageUrl (for unique slug generation)
export const findByRestaurantPageUrl = async (restaurantPageUrl: string) => {
  try {
    return await prisma.restaurant.findUnique({
      where: { restaurantPageUrl },
      select: { id: true },
    });
  } catch (error) {
    logger.error(
      `Repository error in findByRestaurantPageUrl for slug ${restaurantPageUrl}:`,
      error
    );
    throw error;
  }
};

// Add a new function to assign a menu item to a menu
export const assignMenuItemToMenu = async (
  menuItemId: string,
  menuId: string,
  order?: number
) => {
  try {
    return await prisma.menuItemsOnMenus.create({
      data: {
        menuItemId,
        menuId,
        order,
        assignedAt: new Date(),
      },
    });
  } catch (error) {
    logger.error(
      `Repository error in assignMenuItemToMenu for menuItemId ${menuItemId} and menuId ${menuId}:`,
      error
    );
    throw error;
  }
};

export const findRestaurantsByUserId = async (userId: string) => {
  try {
    return await prisma.restaurant.findMany({
      where: { ownerId: userId },
      select: {
        id: true,
        name: true,
        isActive: true,
      },
    });
  } catch (error) {
    logger.error(`Error finding restaurants by user id ${userId}:`, error);
    throw error;
  }
};
