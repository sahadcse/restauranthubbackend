import * as userRepo from "./../repositories/user.repository";
import { UserCreateDto, UserResponseDto } from "../../types/user.types";
import AppError from "../../../../utils/AppError";
import {
  UserRole,
  AccountStatus,
} from "../../../../../prisma/generated/prisma";
import {
  isValidEmail,
  isValidPassword,
} from "../../../../utils/validation.utils";
import { hashPassword } from "../../../../utils/crypto.utils";
import { createUserAudit } from "../../../audit/audit.service";
import { generateRandomToken } from "../../../../utils/crypto.utils";
import { generateCustomToken } from "../../../../utils/jwt.utils";
import {
  sendEmail,
  getVerificationEmailTemplate,
} from "../../../../utils/email.utils";
import logger from "../../../../utils/logger";
import jwt from "jsonwebtoken";
// Add notification integration
import { notificationIntegration } from "../../../notification/services/integration.service";

/**
 * Create a new user in the system
 * @param data - The user data to create
 * @param ipAddress - The IP address of the user
 * @param userAgent - The user agent string of the user's device
 * @param createdBy - The ID of the user who created this account
 * @returns The created user
 */
export const createUser = async (
  data: UserCreateDto,
  ipAddress?: string,
  userAgent?: string,
  createdBy?: string
): Promise<UserResponseDto> => {
  // Check if email already exists
  const existingUser = await userRepo.findUserByEmail(data.email);
  if (existingUser) {
    throw new AppError("Email already in use", 400);
  }

  // Validate email format
  if (!isValidEmail(data.email)) {
    throw new AppError("Invalid email format", 400);
  }

  // Password requirements (min 8 chars)
  if (!isValidPassword(data.password, 8)) {
    throw new AppError("Password must be at least 8 characters", 400);
  }

  // Ensure privacy consent is provided
  if (!data.privacyConsent) {
    throw new AppError("Privacy policy consent is required", 400);
  }

  // Hash password using the utility function
  const passwordHash = await hashPassword(data.password);

  // Set default role if not provided (CUSTOMER)
  const role = data.role || UserRole.CUSTOMER;

  // Prepare user data
  const userData = {
    email: data.email,
    passwordHash,
    firstName: data.firstName,
    lastName: data.lastName,
    phoneNumber: data.phoneNumber,
    role,
    accountStatus: AccountStatus.PENDING_VERIFICATION,
    isActive: true,
    privacyConsent: data.privacyConsent,
    consentGivenAt: data.privacyConsent ? new Date() : undefined,
  };

  // Create user with audit record using repository
  const result = await userRepo.createUserWithAudit(userData, {
    operation: "CREATE",
    changes: { ...userData, passwordHash: "[REDACTED]" },
    ipAddress,
    userAgent,
    changedBy: createdBy,
  });

  // Send welcome notification
  try {
    await notificationIntegration.system.securityAlert(
      result.id,
      "account_created",
      {
        email: data.email,
        role: role,
        createdAt: new Date().toISOString(),
      }
    );
  } catch (notificationError) {
    logger.warn(
      "Failed to send account creation notification:",
      notificationError
    );
  }

  // After transaction completes successfully, create an additional audit log
  await createUserAudit({
    userId: result.id,
    operation: "ACCOUNT_CREATED",
    changes: { email: data.email },
    ipAddress,
    userAgent,
  });

  return result;
};

/**
 * Create the first SUPER_ADMIN user in the system
 * This should only be used during initial setup
 */
export const createSuperAdmin = async (
  data: UserCreateDto,
  ipAddress?: string,
  userAgent?: string
): Promise<UserResponseDto> => {
  // Check if a SUPER_ADMIN already exists
  const existingSuperAdmin = await userRepo.findSuperAdmin();

  if (existingSuperAdmin) {
    throw new AppError("A SUPER_ADMIN already exists in the system", 400);
  }

  // Check if email already exists
  const existingUser = await userRepo.findUserByEmail(data.email);
  if (existingUser) {
    throw new AppError("Email already in use", 400);
  }

  // Validate email format
  if (!isValidEmail(data.email)) {
    throw new AppError("Invalid email format", 400);
  }

  // Password requirements (stricter for SUPER_ADMIN - min 8 chars)
  if (!isValidPassword(data.password, 8)) {
    throw new AppError("Password must be at least 8 characters", 400);
  }

  // Hash password using the utility function
  const passwordHash = await hashPassword(data.password);

  // Prepare super admin data
  const userData = {
    email: data.email,
    passwordHash,
    firstName: data.firstName,
    lastName: data.lastName,
    phoneNumber: data.phoneNumber,
    role: UserRole.SUPER_ADMIN,
    accountStatus: AccountStatus.ACTIVE, // Immediately active
    isActive: true,
    privacyConsent: true,
    consentGivenAt: new Date(),
  };

  // Create super admin with audit record
  return userRepo.createUserWithAudit(userData, {
    operation: "SUPER_ADMIN_CREATION",
    changes: { ...userData, passwordHash: "[REDACTED]" },
    ipAddress,
    userAgent,
  });
};

// Create an initial session for the newly registered user
export const createInitialSession = async (
  userId: string,
  ipAddress?: string,
  deviceInfo?: any
): Promise<{ token: string; expiresAt: Date }> => {
  // Generate a unique token
  const token = generateRandomToken(64);

  // Set expiration (e.g., 7 days from now)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  // Create session record using repository
  const session = await userRepo.createSession(
    userId,
    token,
    ipAddress,
    deviceInfo,
    expiresAt
  );

  // Create an audit log for the session creation
  await createUserAudit({
    userId,
    operation: "SESSION_CREATED",
    changes: {
      sessionId: session.id,
      expiresAt: session.expiresAt,
    },
    ipAddress,
  });

  return {
    token: session.token,
    expiresAt: session.expiresAt,
  };
};

/**
 * Register a new user with email verification
 * @deprecated Use role-specific endpoints instead
 */
export const registerUser = async (
  userData: UserCreateDto,
  ipAddress?: string,
  userAgent?: string
): Promise<UserResponseDto> => {
  const { email, password, firstName, lastName, phoneNumber, privacyConsent } =
    userData;

  // Check if email already exists
  const existingUser = await userRepo.findUserByEmail(email);
  if (existingUser) {
    throw new AppError("Email already registered", 400);
  }

  // Hash the password
  const passwordHash = await hashPassword(password);

  // Prepare user data
  const userDataToCreate = {
    email: email.toLowerCase(),
    passwordHash,
    firstName,
    lastName,
    phoneNumber,
    role: UserRole.CUSTOMER, // Default role
    accountStatus: AccountStatus.PENDING_VERIFICATION,
    isActive: true, // Adding the missing isActive property
    privacyConsent,
    consentGivenAt: privacyConsent ? new Date() : null,
    lastActivityAt: new Date(),
  };

  // Create user with audit record
  const newUser = await userRepo.createUserWithAudit(userDataToCreate, {
    operation: "REGISTER",
    ipAddress,
    userAgent,
  });

  // Generate verification token
  const verificationToken = generateCustomToken(
    {
      userId: newUser.id,
      email: newUser.email,
      type: "email_verification",
    },
    60 * 60 * 24 // 24 hours expiration
  );

  // Store verification token with expiration
  await userRepo.updateUserAttributes(newUser.id, {
    emailVerification: {
      token: verificationToken,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    },
  });

  // Generate verification link
  const verificationLink = `${
    process.env.FRONTEND_URL || "http://localhost:3000"
  }/verify-email?token=${encodeURIComponent(verificationToken)}`;

  // Send verification email
  const userName = firstName || email.split("@")[0];
  const emailTemplate = getVerificationEmailTemplate(
    userName,
    verificationLink
  );

  const emailSent = await sendEmail(
    email,
    "Verify Your Email - Restaurant Hub",
    emailTemplate
  );

  if (!emailSent) {
    logger.warn(`Failed to send verification email to ${email}`);
  }

  // Send welcome notification
  try {
    await notificationIntegration.promotional.personalizedDiscount(
      newUser.id,
      "WELCOME10",
      10,
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      undefined // Remove tenantId since User model doesn't have it
    );
  } catch (notificationError) {
    logger.warn("Failed to send welcome notification:", notificationError);
  }

  // Return user data without sensitive information
  return {
    id: newUser.id,
    email: newUser.email,
    firstName: newUser.firstName,
    lastName: newUser.lastName,
    phoneNumber: newUser.phoneNumber,
    role: newUser.role,
    accountStatus: newUser.accountStatus,
    privacyConsent: newUser.privacyConsent,
    createdAt: newUser.createdAt,
  };
};

/**
 * Verify a user's email using the verification token
 */
export const verifyEmail = async (token: string): Promise<void> => {
  try {
    // Verify and decode the token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "no-secret-key"
    ) as any;

    if (decoded.type !== "email_verification") {
      throw new AppError("Invalid verification token", 400);
    }

    const user = await userRepo.findUserById(decoded.userId);

    if (!user) {
      throw new AppError("User not found", 404);
    }

    if (user.accountStatus === AccountStatus.ACTIVE) {
      // Already verified
      return;
    }

    // Update user status to active
    await userRepo.updateUserStatus(user.id, AccountStatus.ACTIVE);

    // Send account activation notification
    try {
      await notificationIntegration.system.securityAlert(
        user.id,
        "email_verified",
        {
          verifiedAt: new Date().toISOString(),
        }
      );
    } catch (notificationError) {
      logger.warn(
        "Failed to send email verification notification:",
        notificationError
      );
    }

    // Create audit log for verification
    await createUserAudit({
      userId: user.id,
      operation: "EMAIL_VERIFIED",
    });

    // Send welcome email
    await sendEmail(
      user.email,
      "Welcome to Restaurant Hub!",
      `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Welcome to Restaurant Hub!</h2>
        <p>Hello ${user.firstName || user.email.split("@")[0]},</p>
        <p>Your email has been successfully verified. Your account is now active and you can enjoy all features of our platform.</p>
        <p>Thank you for joining us!</p>
        <p>The Restaurant Hub Team</p>
      </div>
      `
    );
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AppError("Invalid or expired verification token", 400);
    }
    throw error;
  }
};

/**
 * Resend verification email for a pending user
 */
export const resendVerificationEmail = async (email: string): Promise<void> => {
  const user = await userRepo.findUserByEmail(email.toLowerCase());

  if (!user) {
    // Don't reveal if the email exists or not
    return;
  }

  if (user.accountStatus === AccountStatus.ACTIVE) {
    // No need to verify again
    return;
  }

  // Generate new verification token
  const verificationToken = generateCustomToken(
    {
      userId: user.id,
      email: user.email,
      type: "email_verification",
    },
    60 * 60 * 24 // 24 hours expiration
  );

  // Store new verification token
  await userRepo.updateUserAttributes(user.id, {
    emailVerification: {
      token: verificationToken,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    },
  });

  // Generate verification link
  const verificationLink = `${
    process.env.FRONTEND_URL || "http://localhost:3000"
  }/verify-email?token=${encodeURIComponent(verificationToken)}`;

  // Send verification email
  const userName = user.firstName || email.split("@")[0];
  const emailTemplate = getVerificationEmailTemplate(
    userName,
    verificationLink
  );

  await sendEmail(email, "Verify Your Email - Restaurant Hub", emailTemplate);
};
