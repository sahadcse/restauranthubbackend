import { Request, Response, NextFunction } from "express";
import * as inventoryService from "../services/inventory.service";
import logger from "../../../utils/logger";
import {
  InventoryQueryFilters,
  SupplierQueryFilters,
} from "../types/inventory.types";

// Inventory controllers
export const getAllInventory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      page = "1",
      limit = "20",
      restaurantId,
      menuItemId,
      status,
      belowThreshold,
      supplierId,
      location,
    } = req.query;

    const filters: InventoryQueryFilters = {};
    if (restaurantId) filters.restaurantId = restaurantId as string;
    if (menuItemId) filters.menuItemId = menuItemId as string;
    if (status) filters.status = status as any;
    if (belowThreshold) filters.belowThreshold = belowThreshold === "true";
    if (supplierId) filters.supplierId = supplierId as string;
    if (location) filters.location = location as string;

    const inventory = await inventoryService.getAllInventory(
      parseInt(page as string, 10),
      parseInt(limit as string, 10),
      filters
    );

    res.status(200).json({
      success: true,
      data: inventory,
    });
  } catch (error) {
    logger.error("Error in getAllInventory:", error);
    next(error);
  }
};

export const getInventoryById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    if(!id) {
      res.status(400).json({
        success: false,
        message: "Inventory ID is required",
      });
      return;
    }
    const inventory = await inventoryService.getInventoryById(id);

    res.status(200).json({
      success: true,
      data: inventory,
    });
  } catch (error) {
    logger.error(`Error in getInventoryById for id ${req.params.id}:`, error);
    next(error);
  }
};

export const getInventoryByMenuItem = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { menuItemId } = req.params;
    const { variantId, restaurantId } = req.query;

    const inventory = await inventoryService.getInventoryByMenuItem(
      menuItemId,
      variantId as string,
      restaurantId as string
    );

    if (!inventory) {
      res.status(404).json({
        success: false,
        message: "Inventory not found for the specified menu item",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: inventory,
    });
  } catch (error) {
    logger.error(
      `Error in getInventoryByMenuItem for menuItemId ${req.params.menuItemId}:`,
      error
    );
    next(error);
  }
};

export const createInventory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const inventory = await inventoryService.createInventory(req.body);

    res.status(201).json({
      success: true,
      message: "Inventory created successfully",
      data: inventory,
    });
  } catch (error) {
    logger.error("Error in createInventory:", error);
    next(error);
  }
};

export const updateInventory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const inventory = await inventoryService.updateInventory(id, req.body);

    res.status(200).json({
      success: true,
      message: "Inventory updated successfully",
      data: inventory,
    });
  } catch (error) {
    logger.error(`Error in updateInventory for id ${req.params.id}:`, error);
    next(error);
  }
};

export const deleteInventory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await inventoryService.deleteInventory(id);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    logger.error(`Error in deleteInventory for id ${req.params.id}:`, error);
    next(error);
  }
};

export const adjustInventory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // @ts-ignore - Property 'user' may be added by auth middleware
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "User authentication required",
      });
      return;
    }

    const adjustedInventory = await inventoryService.adjustInventory(
      req.body,
      userId
    );

    res.status(200).json({
      success: true,
      message: "Inventory adjusted successfully",
      data: adjustedInventory,
    });
  } catch (error) {
    logger.error("Error in adjustInventory:", error);
    next(error);
  }
};

export const getLowStockItems = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { restaurantId } = req.query;
    const lowStockItems = await inventoryService.getLowStockItems(
      restaurantId as string
    );

    res.status(200).json({
      success: true,
      data: lowStockItems,
    });
  } catch (error) {
    logger.error("Error in getLowStockItems:", error);
    next(error);
  }
};

export const getInventoryAnalytics = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { restaurantId } = req.query;
    const analytics = await inventoryService.getInventoryAnalytics(
      restaurantId as string
    );

    res.status(200).json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    logger.error("Error in getInventoryAnalytics:", error);
    next(error);
  }
};

// Supplier controllers
export const getAllSuppliers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page = "1", limit = "20", isActive, search } = req.query;

    const filters: SupplierQueryFilters = {};
    if (isActive !== undefined) filters.isActive = isActive === "true";
    if (search) filters.search = search as string;

    const suppliers = await inventoryService.getAllSuppliers(
      parseInt(page as string, 10),
      parseInt(limit as string, 10),
      filters
    );

    res.status(200).json({
      success: true,
      data: suppliers,
    });
  } catch (error) {
    logger.error("Error in getAllSuppliers:", error);
    next(error);
  }
};

export const getSupplierById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const supplier = await inventoryService.getSupplierById(id);

    res.status(200).json({
      success: true,
      data: supplier,
    });
  } catch (error) {
    logger.error(`Error in getSupplierById for id ${req.params.id}:`, error);
    next(error);
  }
};

export const createSupplier = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Remove the tenantId check since it should come from the validated request body

    const supplier = await inventoryService.createSupplier(req.body);

    res.status(201).json({
      success: true,
      message: "Supplier created successfully",
      data: supplier,
    });
  } catch (error) {
    logger.error("Error in createSupplier:", error);
    next(error);
  }
};

export const updateSupplier = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const supplier = await inventoryService.updateSupplier(id, req.body);

    res.status(200).json({
      success: true,
      message: "Supplier updated successfully",
      data: supplier,
    });
  } catch (error) {
    logger.error(`Error in updateSupplier for id ${req.params.id}:`, error);
    next(error);
  }
};

export const deleteSupplier = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await inventoryService.deleteSupplier(id);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    logger.error(`Error in deleteSupplier for id ${req.params.id}:`, error);
    next(error);
  }
};
