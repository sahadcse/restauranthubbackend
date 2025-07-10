import prisma from "../../../db";
import {
  FeedbackCreateDto,
  FeedbackFilters,
  FeedbackResponseDto,
  FeedbackStats,
} from "../types/notification.types";
import { FeedbackType } from "../../../../prisma/generated/prisma";
import logger from "../../../utils/logger";

export const createFeedback = async (
  data: FeedbackCreateDto,
  tenantId: string
): Promise<FeedbackResponseDto> => {
  try {
    const feedback = await prisma.feedback.create({
      data: {
        ...data,
        tenantId,
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        order: {
          select: {
            id: true,
            total: true,
            restaurant: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    return feedback as FeedbackResponseDto;
  } catch (error) {
    logger.error("Error creating feedback:", error);
    throw new Error("Failed to create feedback");
  }
};

export const getFeedbackByOrderId = async (
  orderId: string,
  userId?: string
): Promise<FeedbackResponseDto[]> => {
  try {
    const whereClause: any = { orderId };
    if (userId) whereClause.userId = userId;

    const feedback = await prisma.feedback.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        order: {
          select: {
            id: true,
            total: true,
            restaurant: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return feedback as FeedbackResponseDto[];
  } catch (error) {
    logger.error("Error fetching feedback by order ID:", error);
    throw new Error("Failed to fetch feedback");
  }
};

export const getFeedbackById = async (
  feedbackId: string,
  userId?: string
): Promise<FeedbackResponseDto | null> => {
  try {
    const whereClause: any = { id: feedbackId };
    if (userId) whereClause.userId = userId;

    const feedback = await prisma.feedback.findUnique({
      where: whereClause,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        order: {
          select: {
            id: true,
            total: true,
            restaurant: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    return feedback as FeedbackResponseDto | null;
  } catch (error) {
    logger.error("Error fetching feedback by ID:", error);
    throw new Error("Failed to fetch feedback");
  }
};

export const getAllFeedback = async (
  filters: FeedbackFilters = {},
  page: number = 1,
  limit: number = 20,
  tenantId?: string
): Promise<{
  feedback: FeedbackResponseDto[];
  total: number;
}> => {
  try {
    const skip = (page - 1) * limit;

    const whereClause: any = {};

    if (tenantId) whereClause.tenantId = tenantId;
    if (filters.type) whereClause.type = filters.type;
    if (filters.rating) whereClause.rating = filters.rating;
    if (filters.minRating || filters.maxRating) {
      whereClause.rating = {};
      if (filters.minRating) whereClause.rating.gte = filters.minRating;
      if (filters.maxRating) whereClause.rating.lte = filters.maxRating;
    }
    if (filters.startDate || filters.endDate) {
      whereClause.createdAt = {};
      if (filters.startDate) whereClause.createdAt.gte = filters.startDate;
      if (filters.endDate) whereClause.createdAt.lte = filters.endDate;
    }
    if (filters.restaurantId) {
      whereClause.order = {
        restaurantId: filters.restaurantId,
      };
    }

    const [feedback, total] = await Promise.all([
      prisma.feedback.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          order: {
            select: {
              id: true,
              total: true,
              restaurant: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.feedback.count({
        where: whereClause,
      }),
    ]);

    return {
      feedback: feedback as FeedbackResponseDto[],
      total,
    };
  } catch (error) {
    logger.error("Error fetching all feedback:", error);
    throw new Error("Failed to fetch feedback");
  }
};

export const getFeedbackStats = async (
  filters: FeedbackFilters = {},
  tenantId?: string
): Promise<FeedbackStats> => {
  try {
    const whereClause: any = {};

    if (tenantId) whereClause.tenantId = tenantId;
    if (filters.type) whereClause.type = filters.type;
    if (filters.startDate || filters.endDate) {
      whereClause.createdAt = {};
      if (filters.startDate) whereClause.createdAt.gte = filters.startDate;
      if (filters.endDate) whereClause.createdAt.lte = filters.endDate;
    }
    if (filters.restaurantId) {
      whereClause.order = {
        restaurantId: filters.restaurantId,
      };
    }

    const [totalFeedback, averageRating, ratingDistribution, typeDistribution] =
      await Promise.all([
        prisma.feedback.count({ where: whereClause }),
        prisma.feedback.aggregate({
          where: whereClause,
          _avg: { rating: true },
        }),
        prisma.feedback.groupBy({
          by: ["rating"],
          where: whereClause,
          _count: true,
        }),
        prisma.feedback.groupBy({
          by: ["type"],
          where: whereClause,
          _count: true,
        }),
      ]);

    const ratingStats: { [key: number]: number } = {};
    ratingDistribution.forEach((item) => {
      ratingStats[item.rating] = item._count;
    });

    const typeStats: { [key in FeedbackType]: number } = {} as any;
    typeDistribution.forEach((item) => {
      typeStats[item.type as FeedbackType] = item._count;
    });

    return {
      totalFeedback,
      averageRating: averageRating._avg.rating || 0,
      ratingDistribution: ratingStats,
      typeDistribution: typeStats,
    };
  } catch (error) {
    logger.error("Error fetching feedback stats:", error);
    throw new Error("Failed to fetch feedback statistics");
  }
};

export const getUserFeedback = async (
  userId: string,
  page: number = 1,
  limit: number = 20
): Promise<{
  feedback: FeedbackResponseDto[];
  total: number;
}> => {
  try {
    const skip = (page - 1) * limit;

    const [feedback, total] = await Promise.all([
      prisma.feedback.findMany({
        where: { userId },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          order: {
            select: {
              id: true,
              total: true,
              restaurant: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.feedback.count({
        where: { userId },
      }),
    ]);

    return {
      feedback: feedback as FeedbackResponseDto[],
      total,
    };
  } catch (error) {
    logger.error("Error fetching user feedback:", error);
    throw new Error("Failed to fetch user feedback");
  }
};

export const deleteFeedback = async (
  feedbackId: string,
  userId?: string
): Promise<boolean> => {
  try {
    const whereClause: any = { id: feedbackId };
    if (userId) whereClause.userId = userId;

    await prisma.feedback.delete({
      where: whereClause,
    });

    return true;
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("Record to delete does not exist")
    ) {
      return false;
    }
    logger.error("Error deleting feedback:", error);
    throw new Error("Failed to delete feedback");
  }
};
