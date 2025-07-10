import {
  LoginDto,
  AuthResponseDto,
  RefreshTokenDto,
  TokenResponseDto,
  PasswordResetRequestDto,
  PasswordResetConfirmDto,
  PasswordChangeDto,
} from "../../types/auth.types";
import * as authRepo from "../repositories/auth.repository";
import { hashPassword, verifyPassword } from "../../../../utils/crypto.utils";
import {
  generateAuthTokens,
  verifyToken,
  JwtPayload,
  generateCustomToken,
} from "../../../../utils/jwt.utils";
import AppError from "../../../../utils/AppError";
import { createUserAudit } from "../../../audit/audit.service";
import logger from "../../../../utils/logger";
import { AccountStatus } from "../../../../../prisma/generated/prisma";
import { randomUUID } from "crypto";
import {
  sendEmail,
  getPasswordResetEmailTemplate,
} from "../../../../utils/email.utils";

/**
 * Authenticate a user and generate tokens
 */
export const login = async (
  loginData: LoginDto,
  ipAddress?: string,
  userAgent?: string
): Promise<AuthResponseDto> => {
  const { email, password, rememberMe } = loginData;

  // Find user by email
  const user = await authRepo.findUserByEmail(email);
  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  // Check if account is active
  if (user.accountStatus !== AccountStatus.ACTIVE) {
    if (user.accountStatus === AccountStatus.PENDING_VERIFICATION) {
      throw new AppError("Please verify your account before logging in", 403);
    } else if (user.accountStatus === AccountStatus.SUSPENDED) {
      throw new AppError("Your account has been suspended", 403);
    } else {
      throw new AppError("Account is not active", 403);
    }
  }

  // Verify password
  const isPasswordValid = await verifyPassword(password, user.passwordHash);
  if (!isPasswordValid) {
    // Increment failed login attempts
    const attempts = await authRepo.incrementFailedLoginAttempts(user.id);

    // If too many failed attempts, lock account
    if (attempts >= 5) {
      // In a production system, you might want to suspend the account
      logger.warn(
        `Account ${user.email} has had ${attempts} failed login attempts`
      );
    }

    throw new AppError("Invalid email or password", 401);
  }

  // Generate tokens - extend expiration if rememberMe is true
  const tokenPayload: JwtPayload = {
    userId: user.id,
    role: user.role,
    email: user.email,
  };

  const expiration = rememberMe ? 60 * 60 * 24 * 30 : undefined; // 30 days for "remember me"
  const tokens = generateAuthTokens(tokenPayload, expiration);

  // Create session
  const deviceInfoObj = userAgent ? { userAgent } : undefined;
  await authRepo.createSession(
    user.id,
    tokens.accessToken,
    tokens.refreshToken,
    ipAddress,
    deviceInfoObj,
    tokens.expiresIn
  );

  // Update last login timestamp
  await authRepo.updateUserLastLogin(user.id);

  // Create audit log entry
  await createUserAudit({
    userId: user.id,
    operation: "LOGIN",
    ipAddress,
    userAgent,
  });

  // Return user data and tokens
  return {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      accountStatus: user.accountStatus,
    },
    tokens: {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      tokenType: "Bearer",
    },
  };
};

/**
 * Refresh access token using a refresh token
 */
export const refreshToken = async (
  refreshData: RefreshTokenDto,
  ipAddress?: string,
  userAgent?: string
): Promise<TokenResponseDto> => {
  const { refreshToken } = refreshData;

  // Find session by refresh token
  const session = await authRepo.findSessionByRefreshToken(refreshToken);
  if (
    !session ||
    session.revokedAt !== null ||
    session.expiresAt < new Date()
  ) {
    throw new AppError("Invalid or expired refresh token", 401);
  }

  // Verify user account status
  if (
    !session.user.isActive ||
    session.user.accountStatus !== AccountStatus.ACTIVE
  ) {
    throw new AppError("Account is no longer active", 403);
  }

  // Generate new tokens
  const tokenPayload: JwtPayload = {
    userId: session.user.id,
    role: session.user.role,
    email: session.user.email,
    sessionId: session.id,
  };

  const tokens = generateAuthTokens(tokenPayload);

  // Revoke old session
  await authRepo.revokeSession(session.id);

  // Create new session
  const deviceInfoObj = userAgent ? { userAgent } : undefined;
  await authRepo.createSession(
    session.user.id,
    tokens.accessToken,
    tokens.refreshToken,
    ipAddress,
    deviceInfoObj,
    tokens.expiresIn
  );

  // Create audit log entry
  await createUserAudit({
    userId: session.user.id,
    operation: "TOKEN_REFRESH",
    ipAddress,
    userAgent,
  });

  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresIn: tokens.expiresIn,
    tokenType: "Bearer",
  };
};

/**
 * Logout user by revoking the current session
 */
export const logout = async (
  token: string,
  allDevices: boolean = false
): Promise<void> => {
  const session = await authRepo.findSessionByToken(token);
  if (!session) {
    throw new AppError("Invalid session", 400);
  }

  if (allDevices) {
    // Logout from all devices
    await authRepo.revokeAllUserSessions(session.userId);
  } else {
    // Logout from current device only
    await authRepo.revokeSession(session.id);
  }

  // Create audit log entry
  await createUserAudit({
    userId: session.userId,
    operation: allDevices ? "LOGOUT_ALL" : "LOGOUT",
  });
};

/**
 * Request a password reset
 */
export const requestPasswordReset = async (
  resetData: PasswordResetRequestDto,
  ipAddress?: string
): Promise<void> => {
  const { email } = resetData;

  // Find user by email
  const user = await authRepo.findUserByEmail(email);
  if (!user) {
    // Don't reveal if the email exists or not for security
    return;
  }

  // Generate reset token
  const resetToken = randomUUID();

  // Store token with expiration (1 hour)
  const expiresAt = new Date(Date.now() + 3600 * 1000);
  await authRepo.storePasswordResetToken(user.id, resetToken, expiresAt);

  // Create audit log entry
  await createUserAudit({
    userId: user.id,
    operation: "PASSWORD_RESET_REQUEST",
    ipAddress,
  });

  // Generate reset link - The token format combines email and token for security
  const encodedEmail = encodeURIComponent(email);
  const encodedToken = encodeURIComponent(resetToken);
  const resetLink = `${
    process.env.FRONTEND_URL || "http://localhost:3000"
  }/reset-password?email=${encodedEmail}&token=${encodedToken}`;

  // Send email with reset link
  const userName = user.firstName || user.email.split("@")[0];
  const emailTemplate = getPasswordResetEmailTemplate(userName, resetLink);

  const emailSent = await sendEmail(
    email,
    "Reset Your Password - Restaurant Hub",
    emailTemplate
  );

  if (!emailSent) {
    logger.error(`Failed to send password reset email to ${email}`);
    // We still continue without throwing an error to avoid revealing user existence
  } else {
    logger.info(`Password reset email sent to ${email}`);
  }
};

/**
 * Confirm password reset with token and set new password
 */
export const confirmPasswordReset = async (
  data: PasswordResetConfirmDto,
  ipAddress?: string
): Promise<string> => {
  // Ensure return type is string (userId)
  try {
    // Extract email and token from the provided data
    const tokenParts = data.token.split("|");
    if (tokenParts.length !== 2) {
      throw new AppError("Invalid reset token", 400);
    }

    const email = decodeURIComponent(tokenParts[0]);
    const resetToken = decodeURIComponent(tokenParts[1]);

    // Validate token
    const user = await authRepo.validatePasswordResetToken(email, resetToken);
    if (!user) {
      throw new AppError("Invalid or expired reset token", 400);
    }

    // Hash new password
    const passwordHash = await hashPassword(data.newPassword);

    // Update user's password using repository
    await authRepo.updateUserPassword(user.id, passwordHash);

    // Clear reset token
    await authRepo.clearPasswordResetToken(user.id);

    // Revoke all sessions for security
    await authRepo.revokeAllUserSessions(user.id);

    // Create audit log entry
    await createUserAudit({
      userId: user.id,
      operation: "PASSWORD_RESET_COMPLETE",
      ipAddress,
    });

    // Send confirmation email that password was reset
    const userName = user.firstName || user.email.split("@")[0];
    await sendEmail(
      user.email,
      "Your Password Has Been Reset - Restaurant Hub",
      `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Password Reset Successful</h2>
        <p>Hello ${userName},</p>
        <p>Your password has been successfully reset. You can now log in with your new password.</p>
        <p>If you did not request this change, please contact our support team immediately as your account may be compromised.</p>
        <p>Thank you,<br>The Restaurant Hub Team</p>
      </div>
      `
    );

    // After successfully resetting the password, return the userId
    const userId = user.id;
    return userId;
  } catch (error) {
    logger.error("Service error in confirmPasswordReset:", error);
    throw error;
  }
};

/**
 * Change password when already logged in
 */
export const changePassword = async (
  userId: string,
  passwordData: PasswordChangeDto,
  ipAddress?: string
): Promise<void> => {
  const { currentPassword, newPassword } = passwordData;

  // Get user
  const user = await authRepo.findUserById(userId, {
    id: true,
    passwordHash: true,
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  // Verify current password
  const isPasswordValid = await verifyPassword(
    currentPassword,
    user.passwordHash
  );
  if (!isPasswordValid) {
    throw new AppError("Current password is incorrect", 400);
  }

  // Hash new password
  const passwordHash = await hashPassword(newPassword);

  // Update password using repository
  await authRepo.updateUserPassword(userId, passwordHash);

  // Create audit log entry
  await createUserAudit({
    userId: user.id,
    operation: "PASSWORD_CHANGE",
    ipAddress,
  });
};
