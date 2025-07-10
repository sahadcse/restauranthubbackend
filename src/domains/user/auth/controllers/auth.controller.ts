import { Request, Response, NextFunction } from "express";
import * as authService from "../services/auth.service";
import * as authRepo from "../repositories/auth.repository";
import { extractTokenFromHeader } from "../../../../utils/jwt.utils";
import {
  LoginDto,
  RefreshTokenDto,
  PasswordResetRequestDto,
  PasswordResetConfirmDto,
  PasswordChangeDto,
} from "../../types/auth.types";
import logger from "../../../../utils/logger";
import AppError from "../../../../utils/AppError";
// Add notification integration
import { notificationIntegration } from "../../../notification/services/integration.service";

/**
 * Handle user login
 */
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const loginData: LoginDto = req.body;
    const ipAddress = req.ip;
    const userAgent = req.headers["user-agent"];

    const result = await authService.login(loginData, ipAddress, userAgent);

    // Send login notification for security
    try {
      await notificationIntegration.system.securityAlert(
        result.user.id,
        "login_success",
        {
          ipAddress: ipAddress,
          userAgent: userAgent,
          loginTime: new Date().toISOString(),
        }
      );
    } catch (notificationError) {
      logger.warn("Failed to send login notification:", notificationError);
    }

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Handle token refresh
 */
export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const refreshData: RefreshTokenDto = req.body;
    const ipAddress = req.ip;
    const userAgent = req.headers["user-agent"];

    const tokens = await authService.refreshToken(
      refreshData,
      ipAddress,
      userAgent
    );

    res.status(200).json(tokens);
  } catch (error) {
    next(error);
  }
};

/**
 * Handle user logout
 */
export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);
    if (!token) {
      throw new AppError("No token provided", 400);
    }

    const allDevices = req.query.all === "true";

    await authService.logout(token, allDevices);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

/**
 * Get current authenticated user information
 */
export const getCurrentUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // User should be attached to request by the auth middleware
    if (!req.user) {
      throw new AppError("Not authenticated", 401);
    }

    // Use repository instead of direct prisma call
    const user = await authRepo.findUserById(req.user.id);

    if (!user) {
      throw new AppError("User not found", 404);
    }

    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
};

/**
 * Request password reset
 */
export const requestPasswordReset = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const resetData: PasswordResetRequestDto = req.body;
    const ipAddress = req.ip;

    await authService.requestPasswordReset(resetData, ipAddress);

    // Send password reset notification
    try {
      // Note: We don't want to reveal if email exists, so we'll handle this in the service
      const user = await authRepo.findUserByEmail(resetData.email);
      if (user) {
        await notificationIntegration.system.securityAlert(
          user.id,
          "password_reset_requested",
          {
            requestedAt: new Date().toISOString(),
            ipAddress: ipAddress,
          }
        );
      }
    } catch (notificationError) {
      logger.warn(
        "Failed to send password reset notification:",
        notificationError
      );
    }

    res.status(200).json({
      message:
        "If your email exists in our system, you will receive password reset instructions.",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Confirm password reset
 */
export const confirmPasswordReset = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const confirmData: PasswordResetConfirmDto = req.body;
    const ipAddress = req.ip;

    // The service should return the userId, not void
    const result = await authService.confirmPasswordReset(
      confirmData,
      ipAddress
    );

    // Send password reset confirmation notification
    try {
      // Extract userId from result if it's an object, or use result directly if it's a string
      // const userId = typeof result === "string" ? result : result?.userId;
      const userId = result; // Assuming result is the userId string

      if (userId) {
        await notificationIntegration.system.securityAlert(
          userId,
          "password_reset_completed",
          {
            completedAt: new Date().toISOString(),
            ipAddress: ipAddress,
          }
        );
      }
    } catch (notificationError) {
      logger.warn(
        "Failed to send password reset confirmation notification:",
        notificationError
      );
    }

    res.status(200).json({ message: "Password has been reset successfully" });
  } catch (error) {
    next(error);
  }
};

/**
 * Change password (when logged in)
 */
export const changePassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError("Not authenticated", 401);
    }

    const passwordData: PasswordChangeDto = req.body;
    const ipAddress = req.ip;

    await authService.changePassword(req.user.id, passwordData, ipAddress);

    // Send password change notification
    try {
      await notificationIntegration.system.securityAlert(
        req.user.id,
        "password_changed",
        {
          changedAt: new Date().toISOString(),
          ipAddress: ipAddress,
        }
      );
    } catch (notificationError) {
      logger.warn(
        "Failed to send password change notification:",
        notificationError
      );
    }

    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    next(error);
  }
};
