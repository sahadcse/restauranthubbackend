import { Router } from "express";
import * as authController from "./../controllers/auth.controller";
import { authenticate } from "../../../../middleware/auth.middleware";
import { validateRequest } from "../../../../middleware/validation.middleware";
import {
  loginSchema,
  refreshTokenSchema,
  passwordResetRequestSchema,
  passwordResetConfirmSchema,
  passwordChangeSchema,
} from "../../types/auth.validation";

const router = Router();

/**
 * @route POST /auth/login
 * @desc Login and get tokens
 * @access Public
 */
router.post("/login", validateRequest(loginSchema), authController.login);

/**
 * @route POST /auth/refresh
 * @desc Refresh access token
 * @access Public
 */
router.post(
  "/refresh",
  validateRequest(refreshTokenSchema),
  authController.refreshToken
);

/**
 * @route POST /auth/logout
 * @desc Logout and invalidate token
 * @access Private
 */
router.post("/logout", authenticate, authController.logout);

/**
 * @route GET /auth/me
 * @desc Get current user info
 * @access Private
 */
router.get("/me", authenticate, authController.getCurrentUser);

/**
 * @route POST /auth/password/reset-request
 * @desc Request password reset
 * @access Public
 */
router.post(
  "/password/reset-request",
  validateRequest(passwordResetRequestSchema),
  authController.requestPasswordReset
);

/**
 * @route POST /auth/password/reset-confirm
 * @desc Confirm password reset with token
 * @access Public
 */
router.post(
  "/password/reset-confirm",
  validateRequest(passwordResetConfirmSchema),
  authController.confirmPasswordReset
);

/**
 * @route PUT /auth/password/change
 * @desc Change password (when logged in)
 * @access Private
 */
router.put(
  "/password/change",
  authenticate,
  validateRequest(passwordChangeSchema),
  authController.changePassword
);

export default router;
