import * as inventoryRepository from "../repositories/inventory.repository";
import {
  findRestaurantById,
  findMenuItemById,
} from "../../restaurant/repositories/restaurant.repository";
import logger from "../../../utils/logger";
import { InventoryStatus } from "../../../../prisma/generated/prisma";
import {
  InventoryQueryFilters,
  SupplierQueryFilters,
  CreateInventoryDto,
  UpdateInventoryDto,
  CreateSupplierDto,
  UpdateSupplierDto,
  InventoryAdjustmentDto,
} from "../types/inventory.types";

// Inventory services
export const getAllInventory = async (
  page = 1,
  limit = 20,
  filters: InventoryQueryFilters = {}
) => {
  try {
    return await inventoryRepository.findAllInventory(page, limit, filters);
  } catch (error) {
    logger.error("Service error in getAllInventory:", error);
    throw new Error(`Failed to get inventory: ${(error as Error).message}`);
  }
};

export const getInventoryById = async (id: string) => {
  try {
    if (!id) {
      throw new Error("Inventory ID is required");
    }

    const inventory = await inventoryRepository.findInventoryById(id);
    if (!inventory) {
      throw new Error(`Inventory with ID ${id} not found`);
    }

    return inventory;
  } catch (error) {
    logger.error(`Service error in getInventoryById for id ${id}:`, error);
    throw new Error(`Failed to get inventory: ${(error as Error).message}`);
  }
};

export const getInventoryByMenuItem = async (
  menuItemId: string,
  variantId?: string,
  restaurantId?: string
) => {
  try {
    return await inventoryRepository.findInventoryByMenuItemAndVariant(
      menuItemId,
      variantId,
      restaurantId
    );
  } catch (error) {
    logger.error(
      `Service error in getInventoryByMenuItem for menuItemId ${menuItemId}:`,
      error
    );
    throw new Error(`Failed to get inventory: ${(error as Error).message}`);
  }
};

export const createInventory = async (data: CreateInventoryDto) => {
  try {
    // Validate restaurant exists
    const restaurant = await findRestaurantById(data.restaurantId);
    if (!restaurant) {
      throw new Error(`Restaurant with ID ${data.restaurantId} not found`);
    }

    // Validate menu item exists and belongs to restaurant
    const menuItem = await findMenuItemById(data.menuItemId);
    if (!menuItem) {
      throw new Error(`Menu item with ID ${data.menuItemId} not found`);
    }

    if (menuItem.restaurantId !== data.restaurantId) {
      throw new Error("Menu item does not belong to the specified restaurant");
    }

    // Check if inventory already exists for this item/variant
    const existingInventory =
      await inventoryRepository.findInventoryByMenuItemAndVariant(
        data.menuItemId,
        data.variantId,
        data.restaurantId
      );

    if (existingInventory) {
      throw new Error(
        "Inventory already exists for this menu item and variant"
      );
    }

    // Validate supplier if provided
    if (data.supplierId) {
      const supplier = await inventoryRepository.findSupplierById(
        data.supplierId
      );
      if (!supplier) {
        throw new Error(`Supplier with ID ${data.supplierId} not found`);
      }
      if (!supplier.isActive) {
        throw new Error("Supplier is not active");
      }
    }

    // Create inventory with tenant ID
    const inventoryData = {
      ...data,
      tenantId: data.restaurantId, // Using restaurant as tenant
    };

    const inventory = await inventoryRepository.createInventory(inventoryData);

    // Update menu item stock status if needed
    await updateMenuItemStockStatus(data.menuItemId);

    return inventory;
  } catch (error) {
    logger.error("Service error in createInventory:", error);
    throw new Error(`Failed to create inventory: ${(error as Error).message}`);
  }
};

export const updateInventory = async (id: string, data: UpdateInventoryDto) => {
  try {
    // Validate inventory exists
    const existingInventory = await inventoryRepository.findInventoryById(id);
    if (!existingInventory) {
      throw new Error(`Inventory with ID ${id} not found`);
    }

    // Validate supplier if being updated
    if (data.supplierId) {
      const supplier = await inventoryRepository.findSupplierById(
        data.supplierId
      );
      if (!supplier) {
        throw new Error(`Supplier with ID ${data.supplierId} not found`);
      }
      if (!supplier.isActive) {
        throw new Error("Supplier is not active");
      }
    }

    const updatedInventory = await inventoryRepository.updateInventory(
      id,
      data
    );

    // Update menu item stock status if quantity changed
    if (data.quantity !== undefined) {
      await updateMenuItemStockStatus(existingInventory.menuItemId);
    }

    return updatedInventory;
  } catch (error) {
    logger.error(`Service error in updateInventory for id ${id}:`, error);
    throw new Error(`Failed to update inventory: ${(error as Error).message}`);
  }
};

export const deleteInventory = async (id: string) => {
  try {
    const inventory = await inventoryRepository.findInventoryById(id);
    if (!inventory) {
      throw new Error(`Inventory with ID ${id} not found`);
    }

    await inventoryRepository.deleteInventory(id);

    // Update menu item stock status
    await updateMenuItemStockStatus(inventory.menuItemId);

    return { success: true, message: "Inventory deleted successfully" };
  } catch (error) {
    logger.error(`Service error in deleteInventory for id ${id}:`, error);
    throw new Error(`Failed to delete inventory: ${(error as Error).message}`);
  }
};

export const adjustInventory = async (
  data: InventoryAdjustmentDto,
  userId: string
) => {
  try {
    // Find inventory record
    const inventory =
      await inventoryRepository.findInventoryByMenuItemAndVariant(
        data.menuItemId,
        data.variantId
      );

    if (!inventory) {
      throw new Error("Inventory not found for the specified menu item");
    }

    // Validate adjustment doesn't result in negative quantity
    const newQuantity = inventory.quantity + data.quantityChange;
    if (newQuantity < 0) {
      throw new Error(
        `Adjustment would result in negative quantity. Current: ${inventory.quantity}, Change: ${data.quantityChange}`
      );
    }

    const updatedInventory = await inventoryRepository.adjustInventoryQuantity(
      inventory.id,
      data.quantityChange,
      data.reason,
      data.notes
    );

    // Update menu item stock status
    await updateMenuItemStockStatus(data.menuItemId);

    // Log adjustment for audit trail
    logger.info(`Inventory adjusted by user ${userId}:`, {
      inventoryId: inventory.id,
      menuItemId: data.menuItemId,
      variantId: data.variantId,
      quantityChange: data.quantityChange,
      reason: data.reason,
      notes: data.notes,
    });

    return updatedInventory;
  } catch (error) {
    logger.error("Service error in adjustInventory:", error);
    throw new Error(`Failed to adjust inventory: ${(error as Error).message}`);
  }
};

export const getLowStockItems = async (restaurantId?: string) => {
  try {
    const lowStockItems = await inventoryRepository.findLowStockItems(
      restaurantId
    );

    return lowStockItems.map((item) => ({
      id: item.id,
      menuItemId: item.menuItemId,
      menuItemTitle: item.menuItem.title,
      variantId: item.variantId,
      currentQuantity: item.quantity,
      reorderThreshold: item.reorderThreshold,
      status: item.status,
      lastUpdated: item.lastUpdated,
      supplierId: item.supplierId,
      supplierName: item.supplier?.name,
    }));
  } catch (error) {
    logger.error("Service error in getLowStockItems:", error);
    throw new Error(
      `Failed to get low stock items: ${(error as Error).message}`
    );
  }
};

export const getInventoryAnalytics = async (restaurantId?: string) => {
  try {
    return await inventoryRepository.getInventoryAnalytics(restaurantId);
  } catch (error) {
    logger.error("Service error in getInventoryAnalytics:", error);
    throw new Error(
      `Failed to get inventory analytics: ${(error as Error).message}`
    );
  }
};

// Helper function to update menu item stock status
const updateMenuItemStockStatus = async (menuItemId: string) => {
  try {
    // Get all inventory for this menu item
    const inventoryItems = await inventoryRepository.findAllInventory(1, 100, {
      menuItemId,
    });

    if (inventoryItems.data.length === 0) {
      // No inventory, mark as out of stock
      // You might want to implement a direct menu item update here
      return;
    }

    // Calculate overall status based on all variants
    const totalQuantity = inventoryItems.data.reduce(
      (sum, item) => sum + item.quantity,
      0
    );
    const hasLowStock = inventoryItems.data.some(
      (item) => item.quantity <= item.reorderThreshold && item.quantity > 0
    );
    const hasOutOfStock = inventoryItems.data.some(
      (item) => item.quantity === 0
    );

    let overallStatus: InventoryStatus;
    if (totalQuantity === 0) {
      overallStatus = InventoryStatus.OUT_OF_STOCK;
    } else if (hasOutOfStock || hasLowStock) {
      overallStatus = InventoryStatus.LOW_STOCK;
    } else {
      overallStatus = InventoryStatus.IN_STOCK;
    }

    // Update menu item stock status
    // You might want to add this functionality to the restaurant repository
    logger.info(
      `Menu item ${menuItemId} stock status updated to ${overallStatus}`
    );
  } catch (error) {
    logger.error(
      `Error updating menu item stock status for ${menuItemId}:`,
      error
    );
  }
};

// Supplier services
export const getAllSuppliers = async (
  page = 1,
  limit = 20,
  filters: SupplierQueryFilters = {}
) => {
  try {
    return await inventoryRepository.findAllSuppliers(page, limit, filters);
  } catch (error) {
    logger.error("Service error in getAllSuppliers:", error);
    throw new Error(`Failed to get suppliers: ${(error as Error).message}`);
  }
};

export const getSupplierById = async (id: string) => {
  try {
    if (!id) {
      throw new Error("Supplier ID is required");
    }

    const supplier = await inventoryRepository.findSupplierById(id);
    if (!supplier) {
      throw new Error(`Supplier with ID ${id} not found`);
    }

    return supplier;
  } catch (error) {
    logger.error(`Service error in getSupplierById for id ${id}:`, error);
    throw new Error(`Failed to get supplier: ${(error as Error).message}`);
  }
};

export const createSupplier = async (data: CreateSupplierDto) => {
  try {
    // Check if supplier with email already exists
    const existingSupplier = await inventoryRepository.findSupplierByEmail(
      data.email
    );
    if (existingSupplier) {
      throw new Error(`Supplier with email ${data.email} already exists`);
    }

    const supplier = await inventoryRepository.createSupplier(data);

    logger.info(`Supplier created: ${supplier.id} - ${supplier.name}`);

    return supplier;
  } catch (error) {
    logger.error("Service error in createSupplier:", error);
    throw new Error(`Failed to create supplier: ${(error as Error).message}`);
  }
};

export const updateSupplier = async (id: string, data: UpdateSupplierDto) => {
  try {
    // Validate supplier exists
    const existingSupplier = await inventoryRepository.findSupplierById(id);
    if (!existingSupplier) {
      throw new Error(`Supplier with ID ${id} not found`);
    }

    // Check email uniqueness if being updated
    if (data.email && data.email !== existingSupplier.email) {
      const supplierWithEmail = await inventoryRepository.findSupplierByEmail(
        data.email
      );
      if (supplierWithEmail && supplierWithEmail.id !== id) {
        throw new Error(`Supplier with email ${data.email} already exists`);
      }
    }

    const updatedSupplier = await inventoryRepository.updateSupplier(id, data);

    logger.info(`Supplier updated: ${id} - ${updatedSupplier.name}`);

    return updatedSupplier;
  } catch (error) {
    logger.error(`Service error in updateSupplier for id ${id}:`, error);
    throw new Error(`Failed to update supplier: ${(error as Error).message}`);
  }
};

export const deleteSupplier = async (id: string) => {
  try {
    const supplier = await inventoryRepository.findSupplierById(id);
    if (!supplier) {
      throw new Error(`Supplier with ID ${id} not found`);
    }

    await inventoryRepository.deleteSupplier(id);

    logger.info(`Supplier deleted: ${id} - ${supplier.name}`);

    return { success: true, message: "Supplier deleted successfully" };
  } catch (error) {
    logger.error(`Service error in deleteSupplier for id ${id}:`, error);
    throw new Error(`Failed to delete supplier: ${(error as Error).message}`);
  }
};
