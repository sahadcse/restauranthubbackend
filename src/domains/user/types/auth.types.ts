import { UserRole, AccountStatus } from "../../../../prisma/generated/prisma";

/**
 * Data transfer object for user login
 */
export interface LoginDto {
  email: string;
  password: string;
  rememberMe?: boolean;
}

/**
 * Data transfer object for token refresh
 */
export interface RefreshTokenDto {
  refreshToken: string;
}

/**
 * Response with authentication tokens
 */
export interface TokenResponseDto {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

/**
 * Response containing user info after successful authentication
 */
export interface AuthResponseDto {
  user: {
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    role: UserRole;
    accountStatus: AccountStatus;
  };
  tokens: TokenResponseDto;
}

/**
 * Data transfer object for password reset request
 */
export interface PasswordResetRequestDto {
  email: string;
}

/**
 * Data transfer object for password reset confirmation
 */
export interface PasswordResetConfirmDto {
  token: string;
  newPassword: string;
}

/**
 * Data transfer object for password change (when logged in)
 */
export interface PasswordChangeDto {
  currentPassword: string;
  newPassword: string;
}

/**
 * Verification token payload structure
 */
export interface VerificationTokenPayload {
  userId: string;
  email: string;
  type: "email_verification" | "password_reset";
  expiresAt: number;
}
