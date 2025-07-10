import { Request, Response } from "express";
import * as restaurantService from "../services/restaurant.service";
import logger from "../../../utils/logger";

// Restaurant controllers
export const getAllRestaurants = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { page = "1", limit = "10", search, isActive } = req.query;

    const filters: any = {};
    if (search) filters.search = search as string;
    if (isActive) filters.isActive = isActive === "true";

    const restaurants = await restaurantService.getAllRestaurants(
      parseInt(page as string, 10),
      parseInt(limit as string, 10),
      filters
    );

    res.status(200).json(restaurants);
  } catch (error) {
    logger.error("Error in getAllRestaurants:", error);
    res.status(500).json({
      message: "Failed to fetch restaurants",
      error: (error as Error).message,
    });
  }
};

export const getRestaurantById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const restaurant = await restaurantService.getRestaurantById(id);

    if (!restaurant) {
      res.status(404).json({ message: "Restaurant not found" });
      return;
    }

    res.status(200).json(restaurant);
  } catch (error) {
    logger.error(`Error in getRestaurantById for id ${req.params.id}:`, error);
    res.status(500).json({
      message: "Failed to fetch restaurant",
      error: (error as Error).message,
    });
  }
};

export const createRestaurant = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // @ts-ignore - Property 'user' may be added by auth middleware
    const ownerId = req.user?.id;

    if (!ownerId) {
      res.status(400).json({ message: "User ID is required" });
      return;
    }

    // console.log("req.body", req.body);

    const restaurantData = {
      ...req.body,
      ownerId,
    };

    const newRestaurant = await restaurantService.createRestaurant(
      restaurantData
    );
    res.status(201).json(newRestaurant);
  } catch (error) {
    logger.error("Error in createRestaurant:", error);
    res.status(500).json({
      message: "Failed to create restaurant",
      error: (error as Error).message,
    });
  }
};

export const updateRestaurant = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    // @ts-ignore - Property 'user' may be added by auth middleware
    const userId = req.user?.id;
    const userRole = req.user?.role;

    // Authorization check - only restaurant owner or admin can update
    const restaurant = await restaurantService.getRestaurantById(id);

    if (!restaurant) {
      res.status(404).json({ message: "Restaurant not found" });
      return;
    }

    // Check if user is authorized to update this restaurant
    if (
      userRole !== "ADMIN" &&
      userRole !== "SUPER_ADMIN" &&
      restaurant.ownerId !== userId
    ) {
      res
        .status(403)
        .json({ message: "Unauthorized to update this restaurant" });
      return;
    }

    const updatedRestaurant = await restaurantService.updateRestaurant(
      id,
      req.body
    );
    res.status(200).json(updatedRestaurant);
  } catch (error) {
    logger.error(`Error in updateRestaurant for id ${req.params.id}:`, error);
    res.status(500).json({
      message: "Failed to update restaurant",
      error: (error as Error).message,
    });
  }
};

export const deleteRestaurant = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    // @ts-ignore - Property 'user' may be added by auth middleware
    const userId = req.user?.id;
    const userRole = req.user?.role;

    // Authorization check - only restaurant owner or admin can delete
    const restaurant = await restaurantService.getRestaurantById(id);

    if (!restaurant) {
      res.status(404).json({ message: "Restaurant not found" });
      return;
    }

    // Check if user is authorized to delete this restaurant
    if (
      userRole !== "ADMIN" &&
      userRole !== "SUPER_ADMIN" &&
      restaurant.ownerId !== userId
    ) {
      res
        .status(403)
        .json({ message: "Unauthorized to delete this restaurant" });
      return;
    }

    await restaurantService.deleteRestaurant(id);
    res.status(204).send();
  } catch (error) {
    logger.error(`Error in deleteRestaurant for id ${req.params.id}:`, error);
    res.status(500).json({
      message: "Failed to delete restaurant",
      error: (error as Error).message,
    });
  }
};

// Menu controllers
export const getRestaurantMenus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { restaurantId } = req.params;
    const menus = await restaurantService.getMenusByRestaurantId(restaurantId);
    res.status(200).json(menus);
  } catch (error) {
    logger.error(
      `Error in getRestaurantMenus for restaurantId ${req.params.restaurantId}:`,
      error
    );
    res.status(500).json({
      message: "Failed to fetch menus",
      error: (error as Error).message,
    });
  }
};

export const getMenuById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { menuId } = req.params;
    const menu = await restaurantService.getMenuById(menuId);

    if (!menu) {
      res.status(404).json({ message: "Menu not found" });
      return;
    }

    res.status(200).json(menu);
  } catch (error) {
    logger.error(
      `Error in getMenuById for menuId ${req.params.menuId}:`,
      error
    );
    res.status(500).json({
      message: "Failed to fetch menu",
      error: (error as Error).message,
    });
  }
};

export const createMenu = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { restaurantId } = req.params;
    const menuData = {
      ...req.body,
      restaurantId,
    };

    const newMenu = await restaurantService.createMenu(menuData);
    res.status(201).json(newMenu);
  } catch (error) {
    logger.error(
      `Error in createMenu for restaurantId ${req.params.restaurantId}:`,
      error
    );
    res.status(500).json({
      message: "Failed to create menu",
      error: (error as Error).message,
    });
  }
};

export const updateMenu = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { menuId } = req.params;
    const updatedMenu = await restaurantService.updateMenu(menuId, req.body);

    if (!updatedMenu) {
      res.status(404).json({ message: "Menu not found" });
      return;
    }

    res.status(200).json(updatedMenu);
  } catch (error) {
    logger.error(`Error in updateMenu for menuId ${req.params.menuId}:`, error);
    res.status(500).json({
      message: "Failed to update menu",
      error: (error as Error).message,
    });
  }
};

export const deleteMenu = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { menuId } = req.params;
    const menu = await restaurantService.getMenuById(menuId);
    if (!menu) {
      res.status(404).json({ message: "Menu not found" });
      return;
    }

    await restaurantService.deleteMenu(menuId);
    res.status(204).send();
  } catch (error) {
    logger.error(`Error in deleteMenu for menuId ${req.params.menuId}:`, error);
    res.status(500).json({
      message: "Failed to delete menu",
      error: (error as Error).message,
    });
  }
};

// Menu Item controllers
export const getAllMenuItems = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { page = "1", limit = "20", category, search, isActive } = req.query;

    const filters: any = {};
    if (category) filters.categoryId = category as string;
    if (search) filters.search = search as string;
    if (isActive) filters.isActive = isActive === "true";

    const menuItems = await restaurantService.getAllMenuItems(
      parseInt(page as string, 10),
      parseInt(limit as string, 10),
      filters
    );

    res.status(200).json(menuItems);
  } catch (error) {
    logger.error("Error in getAllMenuItems:", error);
    res.status(500).json({
      message: "Failed to fetch menu items",
      error: (error as Error).message,
    });
  }
};

export const getMenuItemById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const menuItem = await restaurantService.getMenuItemById(id);

    if (!menuItem) {
      res.status(404).json({ message: "Menu item not found" });
      return;
    }

    res.status(200).json(menuItem);
  } catch (error) {
    logger.error(`Error in getMenuItemById for id ${req.params.id}:`, error);
    res.status(500).json({
      message: "Failed to fetch menu item",
      error: (error as Error).message,
    });
  }
};

export const createMenuItem = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { restaurantId } = req.params;
    // @ts-ignore - Property 'user' may be added by auth middleware
    const userId = req.user?.id;

    // Get menuId from either URL parameter or request body
    const menuId = req.query.menuId || req.body.menuId;

    const menuItemData = {
      ...req.body,
      restaurantId,
      lastUpdatedBy: userId,
      // Pass menuId if it exists
      menuId: menuId || undefined,
    };

    const newMenuItem = await restaurantService.createMenuItem(menuItemData);
    res.status(201).json(newMenuItem);
  } catch (error) {
    logger.error(`Error in createMenuItem:`, error);
    res.status(500).json({
      message: "Failed to create menu item",
      error: (error as Error).message,
    });
  }
};

export const updateMenuItem = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    // @ts-ignore - Property 'user' may be added by auth middleware
    const userId = req.user?.id;

    const updatedData = {
      ...req.body,
      lastUpdatedBy: userId,
    };

    const updatedMenuItem = await restaurantService.updateMenuItem(
      id,
      updatedData
    );

    if (!updatedMenuItem) {
      res.status(404).json({ message: "Menu item not found" });
      return;
    }

    res.status(200).json(updatedMenuItem);
  } catch (error) {
    logger.error(`Error in updateMenuItem for id ${req.params.id}:`, error);
    res.status(500).json({
      message: "Failed to update menu item",
      error: (error as Error).message,
    });
  }
};

export const deleteMenuItem = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    await restaurantService.deleteMenuItem(id);
    res.status(204).send();
  } catch (error) {
    logger.error(`Error in deleteMenuItem for id ${req.params.id}:`, error);
    res.status(500).json({
      message: "Failed to delete menu item",
      error: (error as Error).message,
    });
  }
};

// Category controllers
export const getAllCategories = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const categories = await restaurantService.getAllCategories();
    !categories || categories.length === 0
      ? res.status(404).json({ message: "No categories found" })
      : res.status(200).json(categories);
  } catch (error) {
    logger.error("Error in getAllCategories:", error);
    res.status(500).json({
      message: "Failed to fetch categories",
      error: (error as Error).message,
    });
  }
};

export const getCategoryById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const category = await restaurantService.getCategoryById(id);

    if (!category) {
      res.status(404).json({ message: "Category not found" });
      return;
    }

    // At this point, we're guaranteed that category is not null
    res.status(200).json(category);
  } catch (error) {
    logger.error(`Error in getCategoryById for id ${req.params.id}:`, error);
    res.status(500).json({
      message: "Failed to fetch category",
      error: (error as Error).message,
    });
  }
};

// Enhanced Category controllers
export const createCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const data = req.body;
    console.log("createCategory data:", data);
    if (!data.name || data.name.length === 0) {
      res.status(400).json({ message: "Category name is required" });
      return;
    } else if (!data.slug || data.slug.length === 0) {
      res.status(400).json({ message: "Category slug is required" });
      return;
    }

    // Remove restaurantId validation check since it's now optional

    const newCategory = await restaurantService.createCategory(data);
    if (!newCategory) {
      res.status(400).json({ message: "Category creation failed" });
      return;
    }
    res.status(201).json(newCategory);
  } catch (error) {
    logger.error("Error in createCategory:", error);
    if ((error as Error).message.includes("already exists")) {
      res.status(409).json({
        message: "Category creation failed",
        error: (error as Error).message,
      });
      return;
    }
    res.status(500).json({
      message: "Failed to create category",
      error: (error as Error).message,
    });
  }
};

export const updateCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const updatedCategory = await restaurantService.updateCategory(
      id,
      req.body
    );
    if (!updatedCategory) {
      res.status(404).json({ message: "Category not found" });
      return;
    }
    res.status(200).json(updatedCategory);
  } catch (error) {
    logger.error(`Error in updateCategory for id ${req.params.id}:`, error);
    const errorMessage = (error as Error).message;

    if (errorMessage.includes("not found")) {
      res.status(404).json({ message: errorMessage });
      return;
    }

    if (
      errorMessage.includes("already exists") ||
      errorMessage.includes("own parent") ||
      errorMessage.includes("Circular reference")
    ) {
      res.status(400).json({ message: errorMessage });
      return;
    }

    res.status(500).json({
      message: "Failed to update category",
      error: errorMessage,
    });
  }
};

export const deleteCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const category = await restaurantService.getCategoryById(id);
    if (!category) {
      res.status(404).json({ message: "Category not found" });
      return;
    }
    await restaurantService.deleteCategory(id);
    res.status(204).send();
  } catch (error) {
    logger.error(`Error in deleteCategory for id ${req.params.id}:`, error);
    const errorMessage = (error as Error).message;

    if (errorMessage.includes("not found")) {
      res.status(404).json({ message: errorMessage });
      return;
    }

    if (
      errorMessage.includes("with active subcategories") ||
      errorMessage.includes("with associated menu items")
    ) {
      res.status(400).json({ message: errorMessage });
      return;
    }

    res.status(500).json({
      message: "Failed to delete category",
      error: errorMessage,
    });
  }
};

export const getCategoryBySlug = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { slug } = req.params;
    if (!slug) {
      res.status(400).json({ message: "Slug is required" });
      return;
    }
    const category = await restaurantService.getCategoryBySlug(slug);

    if (!category) {
      res.status(404).json({ message: "Category not found" });
      return;
    }

    res.status(200).json(category);
  } catch (error) {
    logger.error(
      `Error in getCategoryBySlug for slug ${req.params.slug}:`,
      error
    );
    const errorMessage = (error as Error).message;

    if (errorMessage.includes("not found")) {
      res.status(404).json({ message: errorMessage });
      return;
    }

    res.status(500).json({
      message: "Failed to fetch category",
      error: errorMessage,
    });
  }
};

// Other controllers
export const getAllBrands = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const brands = await restaurantService.getAllBrands();
    if (!brands || brands.length === 0) {
      res.status(404).json({ message: "No brands found" });
      return;
    }
    res.status(200).json(brands);
  } catch (error) {
    logger.error("Error in getAllBrands:", error);
    res.status(500).json({
      message: "Failed to fetch brands",
      error: (error as Error).message,
    });
  }
};

export const getAllTaxRates = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const taxRates = await restaurantService.getAllTaxRates();
    if (!taxRates || taxRates.length === 0) {
      res.status(404).json({ message: "No tax rates found" });
      return;
    }
    res.status(200).json(taxRates);
  } catch (error) {
    logger.error("Error in getAllTaxRates:", error);
    res.status(500).json({
      message: "Failed to fetch tax rates",
      error: (error as Error).message,
    });
  }
};

export const getAllAllergens = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const allergens = await restaurantService.getAllAllergens();
    if (!allergens || allergens.length === 0) {
      res.status(404).json({ message: "No allergens found" });
      return;
    }
    res.status(200).json(allergens);
  } catch (error) {
    logger.error("Error in getAllAllergens:", error);
    res.status(500).json({
      message: "Failed to fetch allergens",
      error: (error as Error).message,
    });
  }
};
