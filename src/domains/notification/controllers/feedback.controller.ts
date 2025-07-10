import { Request, Response, NextFunction } from "express";
import * as feedbackService from "../services/feedback.service";
import { FeedbackFilters } from "../types/notification.types";
import logger from "../../../utils/logger";
import AppError from "../../../utils/AppError";

export const createFeedback = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const feedbackData = req.body;
    const tenantId = req.headers["x-tenant-id"] as string;

    // Ensure user can only create feedback with their own user ID
    const userId = req.user?.id;
    if (feedbackData.userId !== userId) {
      throw new AppError("Cannot create feedback for another user", 403);
    }

    const feedback = await feedbackService.createFeedback(
      feedbackData,
      tenantId
    );

    res.status(201).json({
      success: true,
      message: "Feedback created successfully",
      data: feedback,
    });
  } catch (error) {
    next(error);
  }
};

export const getFeedbackByOrderId = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { orderId } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    // Admins can view all feedback, users can only view their own
    const searchUserId =
      userRole === "ADMIN" || userRole === "SUPER_ADMIN" ? undefined : userId;

    const feedback = await feedbackService.getFeedbackByOrderId(
      orderId,
      searchUserId
    );

    res.status(200).json({
      success: true,
      message: "Feedback retrieved successfully",
      data: feedback,
    });
  } catch (error) {
    next(error);
  }
};

export const getFeedbackById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    // Admins can view any feedback, users can only view their own
    const searchUserId =
      userRole === "ADMIN" || userRole === "SUPER_ADMIN" ? undefined : userId;

    const feedback = await feedbackService.getFeedbackById(id, searchUserId);

    res.status(200).json({
      success: true,
      message: "Feedback retrieved successfully",
      data: feedback,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllFeedback = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      type,
      rating,
      minRating,
      maxRating,
      startDate,
      endDate,
      restaurantId,
      page,
      limit,
    } = req.query;

    const filters: FeedbackFilters = {};
    if (type) filters.type = type as any;
    if (rating) filters.rating = parseInt(rating as string);
    if (minRating) filters.minRating = parseInt(minRating as string);
    if (maxRating) filters.maxRating = parseInt(maxRating as string);
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);
    if (restaurantId) filters.restaurantId = restaurantId as string;

    const tenantId = req.headers["x-tenant-id"] as string;
    const userRole = req.user?.role;

    // Only admins can view system-wide feedback
    if (userRole !== "ADMIN" && userRole !== "SUPER_ADMIN") {
      throw new AppError("Insufficient permissions to view all feedback", 403);
    }

    const result = await feedbackService.getAllFeedback(
      filters,
      parseInt(page as string) || 1,
      parseInt(limit as string) || 20,
      tenantId
    );

    res.status(200).json({
      success: true,
      message: "Feedback retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserFeedback = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { page, limit } = req.query;

    if (!userId) {
      throw new AppError("User ID is required", 401);
    }

    const result = await feedbackService.getUserFeedback(
      userId,
      parseInt(page as string) || 1,
      parseInt(limit as string) || 20
    );

    res.status(200).json({
      success: true,
      message: "User feedback retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getFeedbackStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { type, startDate, endDate, restaurantId } = req.query;

    const filters: FeedbackFilters = {};
    if (type) filters.type = type as any;
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);
    if (restaurantId) filters.restaurantId = restaurantId as string;

    const tenantId = req.headers["x-tenant-id"] as string;
    const userRole = req.user?.role;

    // Only admins and restaurant owners can view feedback stats
    if (
      userRole !== "ADMIN" &&
      userRole !== "SUPER_ADMIN" &&
      userRole !== "RESTAURANT_OWNER"
    ) {
      throw new AppError(
        "Insufficient permissions to view feedback statistics",
        403
      );
    }

    const stats = await feedbackService.getFeedbackStats(filters, tenantId);

    res.status(200).json({
      success: true,
      message: "Feedback statistics retrieved successfully",
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteFeedback = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    // Admins can delete any feedback, users can only delete their own
    const searchUserId =
      userRole === "ADMIN" || userRole === "SUPER_ADMIN" ? undefined : userId;

    await feedbackService.deleteFeedback(id, searchUserId);

    res.status(200).json({
      success: true,
      message: "Feedback deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const getRestaurantAverageRating = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { restaurantId } = req.params;
    const tenantId = req.headers["x-tenant-id"] as string;

    const result = await feedbackService.getRestaurantAverageRating(
      restaurantId,
      tenantId
    );

    res.status(200).json({
      success: true,
      message: "Restaurant rating retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getRecentFeedback = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { limit } = req.query;
    const tenantId = req.headers["x-tenant-id"] as string;
    const userRole = req.user?.role;

    // Only admins can view recent feedback across the system
    if (userRole !== "ADMIN" && userRole !== "SUPER_ADMIN") {
      throw new AppError(
        "Insufficient permissions to view recent feedback",
        403
      );
    }

    const feedback = await feedbackService.getRecentFeedback(
      tenantId,
      parseInt(limit as string) || 10
    );

    res.status(200).json({
      success: true,
      message: "Recent feedback retrieved successfully",
      data: feedback,
    });
  } catch (error) {
    next(error);
  }
};
