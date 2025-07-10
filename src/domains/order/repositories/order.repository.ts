import { PrismaClient } from "../../../../prisma/generated/prisma";
import logger from "../../../utils/logger";

const prisma = new PrismaClient();

// Helper function for pagination
const getPagination = (page: number, limit: number) => {
  const skip = (page - 1) * limit;
  return { skip, take: limit };
};

// Order repositories
export const findAllOrders = async (
  page = 1,
  limit = 20,
  filters: any = {}
) => {
  try {
    const { skip, take } = getPagination(page, limit);

    // Build where conditions
    const where: any = {};

    if (filters.status) where.status = filters.status;
    if (filters.restaurantId) where.restaurantId = filters.restaurantId;
    if (filters.userId) where.userId = filters.userId;
    if (filters.orderType) where.orderType = filters.orderType;
    if (filters.paymentStatus) where.paymentStatus = filters.paymentStatus;
    if (filters.priority) where.priority = filters.priority;

    // Handle multiple restaurant IDs (for restaurant staff)
    if (filters.restaurantIds && Array.isArray(filters.restaurantIds)) {
      where.restaurantId = { in: filters.restaurantIds };
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }

    if (filters.search) {
      where.OR = [
        // Search in notes only since id and correlationId are UUIDs
        { notes: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    // Fix: Remove select from count() - it doesn't accept select parameter
    const total = await prisma.order.count({ where });

    const orders = await prisma.order.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
          },
        },
        restaurant: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
          },
        },
        items: {
          include: {
            menuItem: {
              select: {
                id: true,
                title: true,
                sku: true,
                images: {
                  where: { isPrimary: true },
                  take: 1,
                },
              },
            },
          },
        },
        payments: true,
        delivery: {
          include: {
            driver: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    phoneNumber: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    });

    return {
      data: orders,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error("Repository error in findAllOrders:", error);
    throw error;
  }
};

export const findOrderById = async (id: string) => {
  try {
    return await prisma.order.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
          },
        },
        restaurant: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
            email: true,
            timezone: true,
            currency: true,
          },
        },
        items: {
          include: {
            menuItem: {
              include: {
                images: {
                  where: { isPrimary: true },
                  take: 1,
                },
                category: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
        payments: {
          orderBy: { createdAt: "desc" },
        },
        delivery: {
          include: {
            driver: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    phoneNumber: true,
                  },
                },
              },
            },
          },
        },
        audits: {
          include: {
            changer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { timestamp: "desc" },
        },
        cancellations: {
          include: {
            requester: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
            approver: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });
  } catch (error) {
    logger.error(`Repository error in findOrderById for id ${id}:`, error);
    throw error;
  }
};

export const createOrder = async (data: any) => {
  try {
    const { items, ...orderData } = data;

    return await prisma.order.create({
      data: {
        ...orderData,
        items: {
          create: items,
        },
      },
      include: {
        items: {
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
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
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
    logger.error("Repository error in createOrder:", error);
    throw error;
  }
};

export const updateOrder = async (id: string, data: any) => {
  try {
    return await prisma.order.update({
      where: { id },
      data,
      include: {
        items: {
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
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
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
    logger.error(`Repository error in updateOrder for id ${id}:`, error);
    throw error;
  }
};

// Order Audit repositories
export const createOrderAudit = async (data: any) => {
  try {
    return await prisma.orderAudit.create({
      data,
    });
  } catch (error) {
    logger.error("Repository error in createOrderAudit:", error);
    throw error;
  }
};

// Payment repositories
export const findPaymentsByOrderId = async (orderId: string) => {
  try {
    return await prisma.payment.findMany({
      where: { orderId },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    logger.error(
      `Repository error in findPaymentsByOrderId for orderId ${orderId}:`,
      error
    );
    throw error;
  }
};

export const findPaymentById = async (id: string) => {
  try {
    return await prisma.payment.findUnique({
      where: { id },
      include: {
        order: {
          select: {
            id: true,
            total: true,
            status: true,
          },
        },
      },
    });
  } catch (error) {
    logger.error(`Repository error in findPaymentById for id ${id}:`, error);
    throw error;
  }
};

export const createPayment = async (data: any) => {
  try {
    return await prisma.payment.create({
      data,
      include: {
        order: {
          select: {
            id: true,
            total: true,
            status: true,
          },
        },
      },
    });
  } catch (error) {
    logger.error("Repository error in createPayment:", error);
    throw error;
  }
};

export const updatePayment = async (id: string, data: any) => {
  try {
    return await prisma.payment.update({
      where: { id },
      data,
      include: {
        order: {
          select: {
            id: true,
            total: true,
            status: true,
          },
        },
      },
    });
  } catch (error) {
    logger.error(`Repository error in updatePayment for id ${id}:`, error);
    throw error;
  }
};

// Delivery repositories
export const findAllDeliveries = async (
  page = 1,
  limit = 20,
  filters: any = {}
) => {
  try {
    const { skip, take } = getPagination(page, limit);

    const where: any = {};

    if (filters.status) where.status = filters.status;
    if (filters.driverId) where.driverId = filters.driverId;

    // Handle restaurant filtering for deliveries
    if (filters.restaurantIds && Array.isArray(filters.restaurantIds)) {
      where.order = {
        restaurantId: { in: filters.restaurantIds },
      };
    }

    const total = await prisma.delivery.count({ where });

    const deliveries = await prisma.delivery.findMany({
      where,
      include: {
        order: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phoneNumber: true,
              },
            },
            restaurant: {
              select: {
                id: true,
                name: true,
                address: true,
              },
            },
          },
        },
        driver: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phoneNumber: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    });

    return {
      data: deliveries,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error("Repository error in findAllDeliveries:", error);
    throw error;
  }
};

export const findDeliveryById = async (id: string) => {
  try {
    return await prisma.delivery.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phoneNumber: true,
              },
            },
            restaurant: {
              select: {
                id: true,
                name: true,
                address: true,
                phone: true,
              },
            },
            items: {
              include: {
                menuItem: {
                  select: {
                    title: true,
                  },
                },
              },
            },
          },
        },
        driver: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phoneNumber: true,
              },
            },
          },
        },
      },
    });
  } catch (error) {
    logger.error(`Repository error in findDeliveryById for id ${id}:`, error);
    throw error;
  }
};

export const createDelivery = async (data: any) => {
  try {
    return await prisma.delivery.create({
      data,
      include: {
        order: {
          select: {
            id: true,
            status: true,
          },
        },
        driver: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });
  } catch (error) {
    logger.error("Repository error in createDelivery:", error);
    throw error;
  }
};

export const updateDelivery = async (id: string, data: any) => {
  try {
    return await prisma.delivery.update({
      where: { id },
      data,
      include: {
        order: {
          select: {
            id: true,
            status: true,
          },
        },
        driver: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });
  } catch (error) {
    logger.error(`Repository error in updateDelivery for id ${id}:`, error);
    throw error;
  }
};

// Driver repositories
export const findAllDrivers = async () => {
  try {
    return await prisma.driver.findMany({
      where: { isActive: true },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    logger.error("Repository error in findAllDrivers:", error);
    throw error;
  }
};

export const findDriverById = async (id: string) => {
  try {
    return await prisma.driver.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
          },
        },
        deliveries: {
          include: {
            order: {
              select: {
                id: true,
                status: true,
                createdAt: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });
  } catch (error) {
    logger.error(`Repository error in findDriverById for id ${id}:`, error);
    throw error;
  }
};

export const createDriver = async (data: any) => {
  try {
    return await prisma.driver.create({
      data,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
          },
        },
      },
    });
  } catch (error) {
    logger.error("Repository error in createDriver:", error);
    throw error;
  }
};

export const updateDriver = async (id: string, data: any) => {
  try {
    return await prisma.driver.update({
      where: { id },
      data,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
          },
        },
      },
    });
  } catch (error) {
    logger.error(`Repository error in updateDriver for id ${id}:`, error);
    throw error;
  }
};

// Order Cancellation repositories
export const createOrderCancellation = async (data: any) => {
  try {
    return await prisma.orderCancellation.create({
      data,
      include: {
        order: {
          select: {
            id: true,
            status: true,
          },
        },
        requester: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  } catch (error) {
    logger.error("Repository error in createOrderCancellation:", error);
    throw error;
  }
};

export const updateOrderCancellation = async (id: string, data: any) => {
  try {
    return await prisma.orderCancellation.update({
      where: { id },
      data,
      include: {
        order: {
          select: {
            id: true,
            status: true,
          },
        },
        requester: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        approver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  } catch (error) {
    logger.error(
      `Repository error in updateOrderCancellation for id ${id}:`,
      error
    );
    throw error;
  }
};

export const findOrderCancellationById = async (id: string) => {
  try {
    return await prisma.orderCancellation.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
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
        },
        requester: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        approver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  } catch (error) {
    logger.error(
      `Repository error in findOrderCancellationById for id ${id}:`,
      error
    );
    throw error;
  }
};

export const findAllOrderCancellations = async (
  page = 1,
  limit = 20,
  filters: any = {}
) => {
  try {
    const { skip, take } = getPagination(page, limit);

    const where: any = {};

    if (filters.orderId) where.orderId = filters.orderId;
    if (filters.requesterId) where.requesterId = filters.requesterId;
    if (filters.approverId) where.approverId = filters.approverId;

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }

    const total = await prisma.orderCancellation.count({ where });

    const cancellations = await prisma.orderCancellation.findMany({
      where,
      include: {
        order: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
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
        },
        requester: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        approver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    });

    return {
      data: cancellations,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error("Repository error in findAllOrderCancellations:", error);
    throw error;
  }
};
