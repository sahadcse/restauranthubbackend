import { Request, Response, NextFunction } from "express";
import auth0Config from "../../../../config/auth0.config";
import { Auth0Service } from "../services/auth0.service";
import AppError from "../../../../utils/AppError";
import logger from "../../../../utils/logger";

/**
 * Initiate Google OAuth flow
 */
export const initiateGoogleAuth = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const state = req.query.state as string;
    const authUrl = auth0Config.getGoogleAuthUrl(state);

    logger.info("Initiating Google OAuth flow");
    res.redirect(authUrl);
  } catch (error) {
    logger.error("Failed to initiate Google OAuth:", error);
    next(new AppError("Failed to initiate Google authentication", 500));
  }
};

/**
 * Initiate Facebook OAuth flow
 */
export const initiateFacebookAuth = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const state = req.query.state as string;
    const authUrl = auth0Config.getFacebookAuthUrl(state);

    logger.info("Initiating Facebook OAuth flow");
    res.redirect(authUrl);
  } catch (error) {
    logger.error("Failed to initiate Facebook OAuth:", error);
    next(new AppError("Failed to initiate Facebook authentication", 500));
  }
};

/**
 * Handle Google OAuth callback
 */
export const handleGoogleCallback = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const code = req.query.code as string;
    const ipAddress =
      req.ip ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      "unknown";
    const userAgent = req.headers["user-agent"] || "unknown";

    // Process OAuth callback
    const result = await Auth0Service.handleGoogleCallback(
      code,
      ipAddress,
      userAgent
    );

    // Build success redirect URL
    const frontendUrl = auth0Config.google.frontendUrl;
    const redirectUrl = new URL("/social-login-success", frontendUrl);

    // Add token and user info as query parameters
    redirectUrl.searchParams.set("token", result.tokens.accessToken);
    redirectUrl.searchParams.set("refresh_token", result.tokens.refreshToken);
    redirectUrl.searchParams.set("user_id", result.user.id);
    redirectUrl.searchParams.set(
      "is_new_user",
      result.user.isNewUser.toString()
    );

    logger.info(`Google OAuth successful for user: ${result.user.email}`);

    // Redirect to frontend with tokens
    res.redirect(redirectUrl.toString());
  } catch (error) {
    logger.error("Google OAuth callback failed:", error);

    // Redirect to frontend with error
    const frontendUrl = auth0Config.google.frontendUrl;
    const errorMessage =
      error instanceof AppError ? error.message : "Authentication failed";
    const redirectUrl = `${frontendUrl}/auth/error?error=${encodeURIComponent(
      errorMessage
    )}`;

    res.redirect(redirectUrl);
  }
};

/**
 * Handle Facebook OAuth callback
 */
export const handleFacebookCallback = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const code = req.query.code as string;
    const ipAddress =
      req.ip ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      "unknown";
    const userAgent = req.headers["user-agent"] || "unknown";

    // Process OAuth callback
    const result = await Auth0Service.handleFacebookCallback(
      code,
      ipAddress,
      userAgent
    );

    // Build success redirect URL
    const frontendUrl = auth0Config.facebook.frontendUrl;
    const redirectUrl = new URL("/social-login-success", frontendUrl);

    // Add token and user info as query parameters
    redirectUrl.searchParams.set("token", result.tokens.accessToken);
    redirectUrl.searchParams.set("refresh_token", result.tokens.refreshToken);
    redirectUrl.searchParams.set("user_id", result.user.id);
    redirectUrl.searchParams.set(
      "is_new_user",
      result.user.isNewUser.toString()
    );

    logger.info(`Facebook OAuth successful for user: ${result.user.email}`);

    // Redirect to frontend with tokens
    res.redirect(redirectUrl.toString());
  } catch (error) {
    logger.error("Facebook OAuth callback failed:", error);

    // Redirect to frontend with error
    const frontendUrl = auth0Config.facebook.frontendUrl;
    const errorMessage =
      error instanceof AppError ? error.message : "Authentication failed";
    const redirectUrl = `${frontendUrl}/auth/error?error=${encodeURIComponent(
      errorMessage
    )}`;

    res.redirect(redirectUrl);
  }
};

/**
 * Get OAuth configuration (public endpoint)
 */
export const getOAuthConfig = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    res.json({
      google: {
        clientId: auth0Config.google.clientId,
        redirectUri: auth0Config.google.redirectUri,
        scope: auth0Config.google.scope,
      },
      facebook: {
        appId: auth0Config.facebook.appId,
        redirectUri: auth0Config.facebook.redirectUri,
        scope: auth0Config.facebook.scope,
      },
    });
  } catch (error) {
    next(new AppError("Failed to get OAuth configuration", 500));
  }
};
