import { Request, Response, NextFunction } from "express";
import AppError from "../utils/AppError";
import logger from "../utils/logger";

/**
 * Validate OAuth callback parameters
 */
export const validateOAuthCallback = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { code, error, error_description, error_reason } = req.query;

  // Check for OAuth errors (both Google and Facebook)
  if (error) {
    logger.warn(`OAuth error: ${error} - ${error_description || error_reason}`);

    // Redirect to frontend with error
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    return res.redirect(
      `${frontendUrl}/auth/error?error=${encodeURIComponent(error as string)}`
    );
  }

  // Check for authorization code
  if (!code || typeof code !== "string") {
    logger.warn("Missing authorization code in OAuth callback");
    return next(new AppError("Missing authorization code", 400));
  }

  next();
};

/**
 * Rate limiting for OAuth endpoints
 */
export const oauthRateLimit = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Add IP-based tracking for OAuth attempts with proper type handling
  const ip =
    req.ip ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    "unknown";
  const now = Date.now();

  // This is a simple in-memory rate limiter
  // In production, you might want to use Redis
  if (!global.oauthAttempts) {
    global.oauthAttempts = new Map();
  }

  const attempts = global.oauthAttempts.get(ip) || [];
  const recentAttempts = attempts.filter((time: number) => now - time < 60000); // 1 minute window

  if (recentAttempts.length >= 10) {
    // Max 10 attempts per minute
    logger.warn(`OAuth rate limit exceeded for IP: ${ip}`);
    return next(
      new AppError("Too many OAuth attempts, please try again later", 429)
    );
  }

  recentAttempts.push(now);
  global.oauthAttempts.set(ip, recentAttempts);

  next();
};

/**
 * Validate Facebook-specific OAuth parameters
 */
export const validateFacebookOAuthCallback = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { code, error, error_code, error_description, error_reason } =
    req.query;

  // Check for Facebook-specific OAuth errors
  if (error || error_code) {
    logger.warn(
      `Facebook OAuth error: ${error || error_code} - ${
        error_description || error_reason
      }`
    );

    // Redirect to frontend with error
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const errorMessage = (error || error_code) as string;
    return res.redirect(
      `${frontendUrl}/auth/error?error=${encodeURIComponent(errorMessage)}`
    );
  }

  // Check for authorization code
  if (!code || typeof code !== "string") {
    logger.warn("Missing authorization code in Facebook OAuth callback");
    return next(new AppError("Missing authorization code", 400));
  }

  next();
};
