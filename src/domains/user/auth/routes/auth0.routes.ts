import { Router } from "express";
import * as auth0Controller from "../controllers/auth0.controller";
import {
  validateOAuthCallback,
  oauthRateLimit,
} from "../../../../middleware/auth0.middleware";

const router = Router();

/**
 * @route GET /auth/google/config
 * @desc Get OAuth configuration (Google & Facebook)
 * @access Public
 */
router.get("/oauth/config", auth0Controller.getOAuthConfig);

/**
 * @route GET /auth/google
 * @desc Initiate Google OAuth flow
 * @access Public
 */
router.get("/google", oauthRateLimit, auth0Controller.initiateGoogleAuth);

/**
 * @route GET /auth/google/callback
 * @desc Handle Google OAuth callback
 * @access Public
 */
router.get(
  "/google/callback",
  oauthRateLimit,
  validateOAuthCallback,
  auth0Controller.handleGoogleCallback
);

/**
 * @route GET /auth/facebook
 * @desc Initiate Facebook OAuth flow
 * @access Public
 */
router.get("/facebook", oauthRateLimit, auth0Controller.initiateFacebookAuth);

/**
 * @route GET /auth/facebook/callback
 * @desc Handle Facebook OAuth callback
 * @access Public
 */
router.get(
  "/facebook/callback",
  oauthRateLimit,
  validateOAuthCallback,
  auth0Controller.handleFacebookCallback
);

// Backward compatibility for Google config endpoint
router.get("/google/config", auth0Controller.getOAuthConfig);

export default router;
