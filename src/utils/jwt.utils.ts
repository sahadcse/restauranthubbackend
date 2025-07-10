/**
 * Utility functions for JWT operations
 */
import jwt from "jsonwebtoken";
import { UserRole } from "../../prisma/generated/prisma";

// Get JWT secret from environment variables with fallback
const JWT_SECRET = process.env.JWT_SECRET || "no-secret-key";

// Default JWT expiration time (7 days in seconds)
const DEFAULT_EXPIRATION = 60 * 60 * 24 * 7; // 7 days

/**
 * JWT payload structure
 */
export interface JwtPayload {
  userId: string;
  role: UserRole;
  sessionId?: string;
  email?: string;
  [key: string]: any; // Additional custom claims
}

/**
 * Generate a JWT token
 *
 * @param payload The data to encode in the token
 * @param expiresIn Token expiration time in seconds (default: 7 days)
 * @returns The generated JWT token
 */
export const generateToken = (
  payload: JwtPayload,
  expiresIn: number = DEFAULT_EXPIRATION
): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
};

/**
 * Verify and decode a JWT token
 *
 * @param token The JWT token to verify
 * @returns The decoded token payload or null if invalid
 */
export const verifyToken = (token: string): JwtPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (error) {
    return null;
  }
};

/**
 * Extract token from authorization header
 *
 * @param authorizationHeader The Authorization header value
 * @returns The token or null if not found/invalid
 */
export const extractTokenFromHeader = (
  authorizationHeader?: string
): string | null => {
  if (!authorizationHeader?.startsWith("Bearer ")) {
    return null;
  }

  return authorizationHeader.split(" ")[1];
};

/**
 * Generate a refresh token (can have different properties than the access token)
 *
 * @param userId The user ID
 * @param expiresIn Token expiration time in seconds (default: 30 days)
 * @returns The generated refresh token
 */
export const generateRefreshToken = (
  userId: string,
  expiresIn: number = 60 * 60 * 24 * 30 // 30 days
): string => {
  return jwt.sign(
    {
      userId,
      type: "refresh",
    },
    JWT_SECRET,
    { expiresIn }
  );
};

/**
 * Generate tokens for authentication (both access and refresh tokens)
 *
 * @param payload The data to encode in the access token
 * @param expiresIn Optional custom expiration time in seconds
 * @returns Object containing both tokens and their expiration times
 */
export const generateAuthTokens = (
  payload: JwtPayload,
  expiresIn: number = DEFAULT_EXPIRATION
): {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
} => {
  const refreshExpiresIn = 60 * 60 * 24 * 30; // 30 days

  const accessToken = generateToken(payload, expiresIn);
  const refreshToken = generateRefreshToken(payload.userId, refreshExpiresIn);

  return {
    accessToken,
    refreshToken,
    expiresIn,
  };
};

/**
 * Generate a custom token for specific purposes like email verification
 *
 * @param payload The data to encode in the token
 * @param expiresIn Token expiration time in seconds
 * @param secret Optional custom secret to use
 * @returns The generated token
 */
export const generateCustomToken = (
  payload: any,
  expiresIn: number = 60 * 60 * 24, // 24 hours default for verification tokens
  secret: string = JWT_SECRET
): string => {
  return jwt.sign(payload, secret, { expiresIn });
};

/**
 * Verify a custom token
 *
 * @param token The token to verify
 * @param secret Optional custom secret to use
 * @returns The decoded token payload or null if invalid
 */
export const verifyCustomToken = (
  token: string,
  secret: string = JWT_SECRET
): any | null => {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    return null;
  }
};
