import prisma from "../../../../db";
import {
  Session,
  User,
  UserRole,
  AccountStatus,
} from "../../../../../prisma/generated/prisma";
import { generateRandomToken } from "../../../../utils/crypto.utils";
import logger from "../../../../utils/logger";

/**
 * Find a user by email (for authentication)
 */
export const findUserByEmail = async (email: string): Promise<User | null> => {
  try {
    return await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
  } catch (error) {
    logger.error(`Error finding user by email: ${(error as Error).message}`);
    throw error;
  }
};

/**
 * Find a user by ID with selected fields
 */
export const findUserById = async (id: string, select?: any): Promise<any> => {
  try {
    return await prisma.user.findUnique({
      where: { id },
      select: select || {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        accountStatus: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });
  } catch (error) {
    logger.error(`Error finding user by ID: ${(error as Error).message}`);
    throw error;
  }
};

/**
 * Update user's last login timestamp
 */
export const updateUserLastLogin = async (userId: string): Promise<void> => {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        lastLoginAt: new Date(),
        lastActivityAt: new Date(),
        failedLoginAttempts: 0, // Reset failed attempts on successful login
      },
    });
  } catch (error) {
    logger.error(`Error updating user last login: ${(error as Error).message}`);
    throw error;
  }
};

/**
 * Increment user's failed login attempts
 */
export const incrementFailedLoginAttempts = async (
  userId: string
): Promise<number> => {
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: { increment: 1 },
      },
      select: {
        failedLoginAttempts: true,
      },
    });
    return user.failedLoginAttempts;
  } catch (error) {
    logger.error(
      `Error incrementing failed login attempts: ${(error as Error).message}`
    );
    throw error;
  }
};

/**
 * Create a new session for a logged-in user
 */
export const createSession = async (
  userId: string,
  token: string,
  refreshToken: string,
  ipAddress?: string,
  deviceInfo?: any,
  expiresIn: number = 60 * 60 * 24 * 7 // 7 days by default
): Promise<Session> => {
  try {
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    return await prisma.session.create({
      data: {
        userId: userId,
        token,
        refreshToken,
        ipAddress,
        deviceInfo: deviceInfo ? JSON.stringify(deviceInfo) : undefined,
        expiresAt,
      },
    });
  } catch (error) {
    logger.error(`Error creating session: ${(error as Error).message}`);
    throw error;
  }
};

/**
 * Find a session by its refresh token
 */
export const findSessionByRefreshToken = async (
  refreshToken: string
): Promise<(Session & { user: User }) | null> => {
  try {
    return await prisma.session.findUnique({
      where: { refreshToken },
      include: { user: true },
    });
  } catch (error) {
    logger.error(
      `Error finding session by refresh token: ${(error as Error).message}`
    );
    throw error;
  }
};

/**
 * Find a session by its token (access token)
 */
export const findSessionByToken = async (
  token: string
): Promise<(Session & { user: User }) | null> => {
  try {
    return await prisma.session.findUnique({
      where: { token },
      include: { user: true },
    });
  } catch (error) {
    logger.error(`Error finding session by token: ${(error as Error).message}`);
    throw error;
  }
};

/**
 * Revoke a specific session
 */
export const revokeSession = async (sessionId: string): Promise<void> => {
  try {
    await prisma.session.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });
  } catch (error) {
    logger.error(`Error revoking session: ${(error as Error).message}`);
    throw error;
  }
};

/**
 * Revoke all sessions for a user (for logout from all devices)
 */
export const revokeAllUserSessions = async (
  userId: string,
  exceptSessionId?: string
): Promise<void> => {
  try {
    await prisma.session.updateMany({
      where: {
        userId,
        id: exceptSessionId ? { not: exceptSessionId } : undefined,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });
  } catch (error) {
    logger.error(
      `Error revoking all user sessions: ${(error as Error).message}`
    );
    throw error;
  }
};

/**
 * Store a password reset token in the database
 */
export const storePasswordResetToken = async (
  userId: string,
  token: string,
  expiresAt: Date
): Promise<void> => {
  try {
    // Using Prisma's JSON field to store temporary tokens
    await prisma.user.update({
      where: { id: userId },
      data: {
        attributes: {
          passwordReset: {
            token,
            expiresAt: expiresAt.toISOString(),
          },
        },
      },
    });
  } catch (error) {
    logger.error(
      `Error storing password reset token: ${(error as Error).message}`
    );
    throw error;
  }
};

/**
 * Validate a password reset token
 */
export const validatePasswordResetToken = async (
  email: string,
  token: string
): Promise<User | null> => {
  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user || !user.attributes) return null;

    const resetData = (user.attributes as any).passwordReset;
    if (!resetData) return null;

    const { token: storedToken, expiresAt } = resetData;
    if (token !== storedToken) return null;

    if (new Date(expiresAt) < new Date()) return null;

    return user;
  } catch (error) {
    logger.error(
      `Error validating password reset token: ${(error as Error).message}`
    );
    throw error;
  }
};

/**
 * Clear password reset token after use
 */
export const clearPasswordResetToken = async (
  userId: string
): Promise<void> => {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        attributes: {
          passwordReset: null,
        },
      },
    });
  } catch (error) {
    logger.error(
      `Error clearing password reset token: ${(error as Error).message}`
    );
    throw error;
  }
};

/**
 * Update user's password
 */
export const updateUserPassword = async (
  userId: string,
  passwordHash: string
): Promise<void> => {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        failedLoginAttempts: 0, // Reset failed attempts when password changes
      },
    });
  } catch (error) {
    logger.error(`Error updating user password: ${(error as Error).message}`);
    throw error;
  }
};
