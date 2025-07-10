import { InventoryStatus } from "../../../../prisma/generated/prisma";

// Core Inventory interfaces
export interface InventoryDto {
  id: string;
  menuItemId: string;
  variantId?: string;
  quantity: number;
  reorderThreshold: number;
  status: InventoryStatus;
  lastUpdated: Date;
  supplierId?: string;
  restaurantId: string;
  tenantId: string;
  location?: string;
}

export interface CreateInventoryDto {
  menuItemId: string;
  variantId?: string;
  quantity: number;
  reorderThreshold: number;
  supplierId?: string;
  restaurantId: string;
  location?: string;
}

export interface UpdateInventoryDto {
  quantity?: number;
  reorderThreshold?: number;
  status?: InventoryStatus;
  supplierId?: string;
  location?: string;
}

export interface InventoryAdjustmentDto {
  menuItemId: string;
  variantId?: string;
  quantityChange: number;
  reason: string;
  notes?: string;
}

// Supplier interfaces
export interface SupplierDto {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: any;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  tenantId: string;
}

export interface CreateSupplierDto {
  name: string;
  email: string;
  phone?: string;
  address?: any;
  tenantId: string;
}

export interface UpdateSupplierDto {
  name?: string;
  email?: string;
  phone?: string;
  address?: any;
  isActive?: boolean;
}

// Query and filter interfaces
export interface InventoryQueryFilters {
  restaurantId?: string;
  menuItemId?: string;
  status?: InventoryStatus;
  belowThreshold?: boolean;
  supplierId?: string;
  location?: string;
}

export interface SupplierQueryFilters {
  isActive?: boolean;
  search?: string;
}

// Analytics and reporting interfaces
export interface InventoryAnalytics {
  totalItems: number;
  inStock: number;
  lowStock: number;
  outOfStock: number;
  belowThreshold: number;
  averageStockLevel: number;
}

export interface LowStockAlert {
  id: string;
  menuItemId: string;
  menuItemTitle: string;
  variantId?: string;
  currentQuantity: number;
  reorderThreshold: number;
  status: InventoryStatus;
  lastUpdated: Date;
  supplierId?: string;
  supplierName?: string;
}
