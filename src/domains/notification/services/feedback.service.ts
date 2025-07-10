import * as feedbackRepo from "../repositories/feedback.repository";
import {
  FeedbackCreateDto,
  FeedbackFilters,
  FeedbackResponseDto,
  FeedbackStats,
} from "../types/notification.types";
import logger from "../../../utils/logger";
import AppError from "../../../utils/AppError";

const DEFAULT_TENANT_ID = "00000000-0000-0000-0000-000000000000";

export const createFeedback = async (
  data: FeedbackCreateDto,
  tenantId: string = DEFAULT_TENANT_ID
): Promise<FeedbackResponseDto> => {
  try {
    // Validate rating range
    if (data.rating < 1 || data.rating > 5) {
      throw new AppError("Rating must be between 1 and 5", 400);
    }

    logger.info(
      `Creating feedback for order ${data.orderId} by user ${data.userId}`
    );

    // Check if feedback already exists for this order by this user
    const existingFeedback = await feedbackRepo.getFeedbackByOrderId(
      data.orderId,
      data.userId
    );
    if (existingFeedback.length > 0) {
      throw new AppError("Feedback already exists for this order", 409);
    }

    const feedback = await feedbackRepo.createFeedback(data, tenantId);

    logger.info(`Feedback created successfully with ID: ${feedback.id}`);

    return feedback;
  } catch (error) {
    logger.error("Service error in createFeedback:", error);
    throw error;
  }
};

export const getFeedbackByOrderId = async (
  orderId: string,
  userId?: string
): Promise<FeedbackResponseDto[]> => {
  try {
    return await feedbackRepo.getFeedbackByOrderId(orderId, userId);
  } catch (error) {
    logger.error("Service error in getFeedbackByOrderId:", error);
    throw error;
  }
};

export const getFeedbackById = async (
  feedbackId: string,
  userId?: string
): Promise<FeedbackResponseDto> => {
  try {
    const feedback = await feedbackRepo.getFeedbackById(feedbackId, userId);

    if (!feedback) {
      throw new AppError("Feedback not found", 404);
    }

    return feedback;
  } catch (error) {
    logger.error("Service error in getFeedbackById:", error);
    throw error;
  }
};

export const getAllFeedback = async (
  filters: FeedbackFilters = {},
  page: number = 1,
  limit: number = 20,
  tenantId?: string
): Promise<{
  feedback: FeedbackResponseDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}> => {
  try {
    if (page < 1 || limit < 1 || limit > 100) {
      throw new AppError("Invalid pagination parameters", 400);
    }

    const result = await feedbackRepo.getAllFeedback(
      filters,
      page,
      limit,
      tenantId
    );

    const totalPages = Math.ceil(result.total / limit);

    return {
      feedback: result.feedback,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages,
      },
    };
  } catch (error) {
    logger.error("Service error in getAllFeedback:", error);
    throw error;
  }
};

export const getFeedbackStats = async (
  filters: FeedbackFilters = {},
  tenantId?: string
): Promise<FeedbackStats> => {
  try {
    return await feedbackRepo.getFeedbackStats(filters, tenantId);
  } catch (error) {
    logger.error("Service error in getFeedbackStats:", error);
    throw error;
  }
};

export const getUserFeedback = async (
  userId: string,
  page: number = 1,
  limit: number = 20
): Promise<{
  feedback: FeedbackResponseDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}> => {
  try {
    if (page < 1 || limit < 1 || limit > 100) {
      throw new AppError("Invalid pagination parameters", 400);
    }

    const result = await feedbackRepo.getUserFeedback(userId, page, limit);

    const totalPages = Math.ceil(result.total / limit);

    return {
      feedback: result.feedback,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages,
      },
    };
  } catch (error) {
    logger.error("Service error in getUserFeedback:", error);
    throw error;
  }
};

export const deleteFeedback = async (
  feedbackId: string,
  userId?: string
): Promise<void> => {
  try {
    const deleted = await feedbackRepo.deleteFeedback(feedbackId, userId);

    if (!deleted) {
      throw new AppError("Feedback not found or unauthorized", 404);
    }

    logger.info(`Feedback deleted successfully: ${feedbackId}`);
  } catch (error) {
    logger.error("Service error in deleteFeedback:", error);
    throw error;
  }
};

// Utility function to calculate average rating for a restaurant
export const getRestaurantAverageRating = async (
  restaurantId: string,
  tenantId?: string
): Promise<{ averageRating: number; totalFeedback: number }> => {
  try {
    const filters: FeedbackFilters = { restaurantId };
    const stats = await getFeedbackStats(filters, tenantId);

    return {
      averageRating: stats.averageRating,
      totalFeedback: stats.totalFeedback,
    };
  } catch (error) {
    logger.error("Service error in getRestaurantAverageRating:", error);
    throw error;
  }
};

// Utility function to get recent feedback for dashboard
export const getRecentFeedback = async (
  tenantId?: string,
  limit: number = 10
): Promise<FeedbackResponseDto[]> => {
  try {
    const result = await getAllFeedback({}, 1, limit, tenantId);
    return result.feedback;
  } catch (error) {
    logger.error("Service error in getRecentFeedback:", error);
    throw error;
  }
};
