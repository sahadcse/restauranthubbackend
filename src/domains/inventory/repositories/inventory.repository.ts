import {
  PrismaClient,
  InventoryStatus,
} from "../../../../prisma/generated/prisma";
import logger from "../../../utils/logger";
import {
  InventoryQueryFilters,
  SupplierQueryFilters,
} from "../types/inventory.types";

const prisma = new PrismaClient();

// Helper function for pagination
const getPagination = (page: number, limit: number) => {
  const skip = (page - 1) * limit;
  return { skip, take: limit };
};

// Inventory repositories
export const findAllInventory = async (
  page = 1,
  limit = 20,
  filters: InventoryQueryFilters = {}
) => {
  try {
    const { skip, take } = getPagination(page, limit);

    // Build where conditions
    const where: any = {};

    if (filters.restaurantId) {
      where.restaurantId = filters.restaurantId;
    }

    if (filters.menuItemId) {
      where.menuItemId = filters.menuItemId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.supplierId) {
      where.supplierId = filters.supplierId;
    }

    if (filters.location) {
      where.location = {
        contains: filters.location,
        mode: "insensitive",
      };
    }

    // For below threshold filtering, we need to handle this separately
    // since Prisma doesn't support column-to-column comparisons in where clauses
    if (filters.belowThreshold) {
      // First get all inventory items for the restaurant
      const allInventory = await prisma.inventory.findMany({
        where: {
          restaurantId: filters.restaurantId,
        },
        select: {
          id: true,
          quantity: true,
          reorderThreshold: true,
        },
      });

      // Filter items where quantity <= reorderThreshold
      const belowThresholdIds = allInventory
        .filter((item) => item.quantity <= item.reorderThreshold)
        .map((item) => item.id);

      if (belowThresholdIds.length === 0) {
        return {
          data: [],
          pagination: {
            total: 0,
            page,
            limit,
            pages: 0,
          },
        };
      }

      where.id = { in: belowThresholdIds };
    }

    // Get total count for pagination
    const total = await prisma.inventory.count({ where });

    // Get inventory with relations
    const inventory = await prisma.inventory.findMany({
      where,
      include: {
        menuItem: {
          select: {
            id: true,
            title: true,
            sku: true,
            finalPrice: true,
          },
        },
        variant: {
          select: {
            id: true,
            weight: true,
          },
        },
        supplier: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        restaurant: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { lastUpdated: "desc" },
      skip,
      take,
    });

    return {
      data: inventory,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error("Repository error in findAllInventory:", error);
    throw error;
  }
};

export const findInventoryById = async (id: string) => {
  try {
    return await prisma.inventory.findUnique({
      where: { id },
      include: {
        menuItem: {
          select: {
            id: true,
            title: true,
            sku: true,
            finalPrice: true,
            images: {
              where: { isPrimary: true },
              take: 1,
            },
          },
        },
        variant: {
          select: {
            id: true,
            weight: true,
          },
        },
        supplier: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        restaurant: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  } catch (error) {
    logger.error(`Error finding inventory by id ${id}:`, error);
    throw error;
  }
};

export const findInventoryByMenuItemAndVariant = async (
  menuItemId: string,
  variantId?: string,
  restaurantId?: string
) => {
  try {
    const where: any = { menuItemId };

    if (variantId) {
      where.variantId = variantId;
    } else {
      where.variantId = null;
    }

    if (restaurantId) {
      where.restaurantId = restaurantId;
    }

    return await prisma.inventory.findFirst({
      where,
      include: {
        menuItem: {
          select: {
            id: true,
            title: true,
            sku: true,
            finalPrice: true,
          },
        },
        variant: {
          select: {
            id: true,
            weight: true,
          },
        },
        supplier: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  } catch (error) {
    logger.error(`Error finding inventory by menu item ${menuItemId}:`, error);
    throw error;
  }
};

export const createInventory = async (data: any) => {
  try {
    // Auto-calculate status based on quantity and threshold
    const status =
      data.quantity <= 0
        ? InventoryStatus.OUT_OF_STOCK
        : data.quantity <= data.reorderThreshold
        ? InventoryStatus.LOW_STOCK
        : InventoryStatus.IN_STOCK;

    return await prisma.inventory.create({
      data: {
        ...data,
        status,
      },
      include: {
        menuItem: {
          select: {
            id: true,
            title: true,
            sku: true,
            finalPrice: true,
          },
        },
        variant: {
          select: {
            id: true,
            weight: true,
          },
        },
        supplier: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        restaurant: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  } catch (error) {
    logger.error("Repository error in createInventory:", error);
    throw error;
  }
};

export const updateInventory = async (id: string, data: any) => {
  try {
    // If quantity is being updated, recalculate status
    if (data.quantity !== undefined || data.reorderThreshold !== undefined) {
      const current = await prisma.inventory.findUnique({ where: { id } });
      if (current) {
        const newQuantity = data.quantity ?? current.quantity;
        const newThreshold = data.reorderThreshold ?? current.reorderThreshold;

        data.status =
          newQuantity <= 0
            ? InventoryStatus.OUT_OF_STOCK
            : newQuantity <= newThreshold
            ? InventoryStatus.LOW_STOCK
            : InventoryStatus.IN_STOCK;
      }
    }

    return await prisma.inventory.update({
      where: { id },
      data,
      include: {
        menuItem: {
          select: {
            id: true,
            title: true,
            sku: true,
            finalPrice: true,
          },
        },
        variant: {
          select: {
            id: true,
            weight: true,
          },
        },
        supplier: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        restaurant: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  } catch (error) {
    logger.error(`Repository error in updateInventory for id ${id}:`, error);
    throw error;
  }
};

export const deleteInventory = async (id: string) => {
  try {
    return await prisma.inventory.delete({
      where: { id },
    });
  } catch (error) {
    logger.error(`Repository error in deleteInventory for id ${id}:`, error);
    throw error;
  }
};

export const adjustInventoryQuantity = async (
  id: string,
  quantityChange: number,
  reason: string,
  notes?: string
) => {
  try {
    return await prisma.$transaction(async (tx) => {
      // Get current inventory
      const current = await tx.inventory.findUnique({ where: { id } });
      if (!current) {
        throw new Error(`Inventory with ID ${id} not found`);
      }

      // Calculate new quantity
      const newQuantity = Math.max(0, current.quantity + quantityChange);

      // Calculate new status
      const newStatus =
        newQuantity <= 0
          ? InventoryStatus.OUT_OF_STOCK
          : newQuantity <= current.reorderThreshold
          ? InventoryStatus.LOW_STOCK
          : InventoryStatus.IN_STOCK;

      // Update inventory
      const updated = await tx.inventory.update({
        where: { id },
        data: {
          quantity: newQuantity,
          status: newStatus,
        },
        include: {
          menuItem: {
            select: {
              id: true,
              title: true,
              sku: true,
            },
          },
          variant: {
            select: {
              id: true,
              weight: true,
            },
          },
        },
      });

      // Log the adjustment
      logger.info(
        `Inventory adjusted: ${id}, change: ${quantityChange}, reason: ${reason}, notes: ${notes}`
      );

      return updated;
    });
  } catch (error) {
    logger.error(
      `Repository error in adjustInventoryQuantity for id ${id}:`,
      error
    );
    throw error;
  }
};

export const findLowStockItems = async (restaurantId?: string) => {
  try {
    const where: any = {
      OR: [
        { status: InventoryStatus.LOW_STOCK },
        { status: InventoryStatus.OUT_OF_STOCK },
      ],
    };

    if (restaurantId) {
      where.restaurantId = restaurantId;
    }

    const lowStockItems = await prisma.inventory.findMany({
      where,
      include: {
        menuItem: {
          select: {
            id: true,
            title: true,
            sku: true,
          },
        },
        variant: {
          select: {
            id: true,
            weight: true,
          },
        },
        supplier: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { quantity: "asc" },
    });

    // Additionally, filter items where quantity <= reorderThreshold
    // since status might not be perfectly synchronized
    const filteredItems = lowStockItems.filter(
      (item) => item.quantity <= item.reorderThreshold
    );

    return filteredItems;
  } catch (error) {
    logger.error("Repository error in findLowStockItems:", error);
    throw error;
  }
};

export const getInventoryAnalytics = async (restaurantId?: string) => {
  try {
    const where: any = {};
    if (restaurantId) {
      where.restaurantId = restaurantId;
    }

    const [totalItems, inStock, lowStock, outOfStock, avgStock, allInventory] =
      await Promise.all([
        prisma.inventory.count({ where }),
        prisma.inventory.count({
          where: { ...where, status: InventoryStatus.IN_STOCK },
        }),
        prisma.inventory.count({
          where: { ...where, status: InventoryStatus.LOW_STOCK },
        }),
        prisma.inventory.count({
          where: { ...where, status: InventoryStatus.OUT_OF_STOCK },
        }),
        prisma.inventory.aggregate({
          where,
          _avg: { quantity: true },
        }),
        // Get all inventory to calculate below threshold manually
        prisma.inventory.findMany({
          where,
          select: {
            quantity: true,
            reorderThreshold: true,
          },
        }),
      ]);

    // Calculate below threshold items manually
    const belowThreshold = allInventory.filter(
      (item) => item.quantity <= item.reorderThreshold
    ).length;

    return {
      totalItems,
      inStock,
      lowStock,
      outOfStock,
      belowThreshold,
      averageStockLevel: avgStock._avg.quantity || 0,
    };
  } catch (error) {
    logger.error("Repository error in getInventoryAnalytics:", error);
    throw error;
  }
};

// Supplier repositories
export const findAllSuppliers = async (
  page = 1,
  limit = 20,
  filters: SupplierQueryFilters = {}
) => {
  try {
    const { skip, take } = getPagination(page, limit);

    // Build where conditions
    const where: any = {};

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { email: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    // Get total count
    const total = await prisma.supplier.count({ where });

    // Get suppliers
    const suppliers = await prisma.supplier.findMany({
      where,
      include: {
        inventory: {
          select: {
            id: true,
            menuItemId: true,
            quantity: true,
            status: true,
          },
        },
      },
      orderBy: { name: "asc" },
      skip,
      take,
    });

    return {
      data: suppliers,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error("Repository error in findAllSuppliers:", error);
    throw error;
  }
};

export const findSupplierById = async (id: string) => {
  try {
    return await prisma.supplier.findUnique({
      where: { id },
      include: {
        inventory: {
          include: {
            menuItem: {
              select: {
                id: true,
                title: true,
                sku: true,
              },
            },
            variant: {
              select: {
                id: true,
                weight: true,
              },
            },
          },
        },
      },
    });
  } catch (error) {
    logger.error(`Error finding supplier by id ${id}:`, error);
    throw error;
  }
};

export const findSupplierByEmail = async (email: string) => {
  try {
    return await prisma.supplier.findUnique({
      where: { email },
    });
  } catch (error) {
    logger.error(`Error finding supplier by email ${email}:`, error);
    throw error;
  }
};

export const createSupplier = async (data: any) => {
  try {
    return await prisma.supplier.create({
      data,
      include: {
        inventory: {
          include: {
            menuItem: {
              select: {
                id: true,
                title: true,
                sku: true,
              },
            },
          },
        },
      },
    });
  } catch (error) {
    logger.error("Repository error in createSupplier:", error);
    throw error;
  }
};

export const updateSupplier = async (id: string, data: any) => {
  try {
    return await prisma.supplier.update({
      where: { id },
      data,
      include: {
        inventory: {
          include: {
            menuItem: {
              select: {
                id: true,
                title: true,
                sku: true,
              },
            },
          },
        },
      },
    });
  } catch (error) {
    logger.error(`Repository error in updateSupplier for id ${id}:`, error);
    throw error;
  }
};

export const deleteSupplier = async (id: string) => {
  try {
    // Check if supplier has active inventory
    const inventoryCount = await prisma.inventory.count({
      where: { supplierId: id },
    });

    if (inventoryCount > 0) {
      throw new Error("Cannot delete supplier with active inventory items");
    }

    return await prisma.supplier.delete({
      where: { id },
    });
  } catch (error) {
    logger.error(`Repository error in deleteSupplier for id ${id}:`, error);
    throw error;
  }
};
