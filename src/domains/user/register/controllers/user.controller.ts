import { Request, Response, NextFunction } from "express";
import * as userService from "../services/user.service";
import { UserCreateDto } from "../../types/user.types";
import AppError from "../../../../utils/AppError";
import { generateToken, JwtPayload } from "../../../../utils/jwt.utils";
import { UserRole } from "../../../../../prisma/generated/prisma";
import { generateRandomPassword } from "../../../../utils/crypto.utils";
import { isValidPassword } from "../../../../utils/validation.utils";
import prisma from "../../../../db";
import { generateCustomToken } from "../../../../utils/jwt.utils";
import * as userRepo from "./../repositories/user.repository";
import { getVerificationEmailTemplate } from "../../../../utils/email.utils";
import { sendEmail } from "../../../../utils/email.utils";
import logger from "../../../../utils/logger";

/**
 * Base registration handler that all role-specific registration methods use
 */
const handleRegistration = async (
  req: Request,
  res: Response,
  next: NextFunction,
  role: UserRole
) => {
  try {
    // Extract all required fields from the request body
    const {
      email,
      password,
      firstName,
      lastName,
      phoneNumber,
      privacyConsent,
    } = req.body;

    // Extract client information for security logging
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers["user-agent"];

    // Extract device info if available
    const deviceInfo = req.body.deviceInfo || {
      type: req.headers["sec-ch-ua-mobile"] ? "mobile" : "desktop",
      platform: req.headers["sec-ch-ua-platform"] || "unknown",
    };

    // Validate required fields
    if (!email || !password) {
      return next(new AppError("Email and password are required", 400));
    }

    if (privacyConsent !== true) {
      return next(new AppError("You must accept the privacy policy", 400));
    }

    const userData: UserCreateDto = {
      email,
      password,
      firstName,
      lastName,
      phoneNumber,
      role, // Explicitly set the role based on the endpoint used
      privacyConsent,
    };

    // Create user with security context
    const user = await userService.createUser(userData, ipAddress, userAgent);

    // Generate verification token
    const verificationToken = generateCustomToken(
      {
        userId: user.id,
        email: user.email,
        type: "email_verification",
      },
      60 * 60 * 24 // 24 hours expiration
    );

    // Store verification token with expiration
    await userRepo.updateUserAttributes(user.id, {
      emailVerification: {
        token: verificationToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
    });

    // Generate verification link
    const verificationLink = `${
      process.env.FRONTEND_URL || "http://localhost:3000"
    }/auth/verify-email?token=${encodeURIComponent(verificationToken)}`;

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

    // Create an initial session for the user
    const session = await userService.createInitialSession(
      user.id,
      ipAddress,
      deviceInfo
    );

    // Create a JWT token for immediate authentication using the utility
    const jwtPayload: JwtPayload = {
      userId: user.id,
      role: user.role,
      sessionId: session.token,
      email: user.email,
    };

    const token = generateToken(jwtPayload);

    // Return created user with authentication token
    res.status(201).json({
      success: true,
      message: `${role} registered successfully. Please check your email to verify your account.`,
      data: {
        user,
        token,
        expiresAt: session.expiresAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Register a customer user (default role)
 */
export const registerCustomer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  return handleRegistration(req, res, next, UserRole.CUSTOMER);
};

/**
 * Register a restaurant owner
 * Business details will be added later after registration
 */
export const registerRestaurantOwner = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // No business validation required at registration time
  // Business details will be created in a separate flow after account creation
  return handleRegistration(req, res, next, UserRole.RESTAURANT_OWNER);
};

/**
 * Register restaurant staff
 * Requires association with a restaurant
 */
export const registerRestaurantStaff = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Staff registration might require a restaurant ID to associate with
  const { restaurantId } = req.body;

  if (!restaurantId) {
    return next(
      new AppError("Restaurant ID is required for staff registration", 400)
    );
  }

  return handleRegistration(req, res, next, UserRole.RESTAURANT_STAFF);
};

/**
 * Register admin user
 * This endpoint is restricted to SUPER_ADMIN users only
 */
export const registerAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Only SUPER_ADMIN can register new admins
    if (!req.user || req.user.role !== UserRole.SUPER_ADMIN) {
      return next(
        new AppError("Only SUPER_ADMIN can create admin accounts", 403)
      );
    }

    // Extract basic user information
    const { email, firstName, lastName, phoneNumber } = req.body;

    // Validate required fields
    if (!email) {
      return next(new AppError("Email is required", 400));
    }

    // Generate a secure random password for the new admin
    const generatedPassword = generateRandomPassword();

    const userData: UserCreateDto = {
      email,
      password: generatedPassword, // Use generated password
      firstName,
      lastName,
      phoneNumber,
      role: UserRole.ADMIN, // Explicitly set role as ADMIN
      privacyConsent: true, // Auto-consent for admin accounts
    };

    // Log the creating admin's information
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers["user-agent"];
    const createdBy = req.user.id; // Track which SUPER_ADMIN created this account

    // Create admin account
    const user = await userService.createUser(
      userData,
      ipAddress,
      userAgent,
      createdBy
    );

    // Return both the user and the generated password (only time the password is exposed)
    res.status(201).json({
      success: true,
      message: `Admin account created successfully. Please securely share the credentials with the new admin.`,
      data: {
        user,
        temporaryPassword: generatedPassword,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Create initial SUPER_ADMIN - can only be called once when no SUPER_ADMIN exists
 * Protected by a setup key to prevent unauthorized access
 */
export const createFirstSuperAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Check for setup key to prevent unauthorized access
    const { setupKey } = req.body;
    const SETUP_KEY = process.env.INITIAL_SETUP_KEY;

    if (!SETUP_KEY) {
      return next(new AppError("Missing setup key", 403));
    }

    if (setupKey !== SETUP_KEY) {
      return next(new AppError("Invalid setup key", 403));
    }

    // Check if SUPER_ADMIN already exists
    const existingSuperAdmin = await prisma.user.findFirst({
      where: { role: UserRole.SUPER_ADMIN },
    });

    if (existingSuperAdmin) {
      return next(
        new AppError("A SUPER_ADMIN already exists in the system", 400)
      );
    }

    // Extract required fields from request body
    const { email, password, firstName, lastName, phoneNumber } = req.body;

    // Validate inputs
    if (!email || !password) {
      return next(new AppError("Email and password are required", 400));
    }

    if (!isValidPassword(password, 8)) {
      return next(new AppError("Password must be at least 8 characters", 400));
    }

    // Client information for audit log
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers["user-agent"];

    // Create SUPER_ADMIN user
    const userData: UserCreateDto = {
      email,
      password,
      firstName,
      lastName,
      phoneNumber,
      role: UserRole.SUPER_ADMIN,
      privacyConsent: true, // Auto-consent for initial setup
    };

    // Create SUPER_ADMIN user with active status
    const user = await userService.createSuperAdmin(
      userData,
      ipAddress,
      userAgent
    );

    // Return the created SUPER_ADMIN
    res.status(201).json({
      success: true,
      message:
        "SUPER_ADMIN created successfully. Store these credentials securely.",
      data: { user },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Register a new user
 * @deprecated Use role-specific endpoints instead
 */
export const registerUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userData: UserCreateDto = req.body;
    const ipAddress = req.ip;
    const userAgent = req.headers["user-agent"];

    const result = await userService.registerUser(
      userData,
      ipAddress,
      userAgent
    );

    res.status(201).json({
      status: "success",
      message:
        "User registered successfully. Please check your email to verify your account.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify user email with verification token
 */
export const verifyEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { token } = req.params;

    if (!token) {
      throw new AppError("Verification token is required", 400);
    }

    const user = await userService.verifyEmail(token);

    res.status(200).json({
      status: "success",
      message:
        "Email verified successfully. You can now login to your account.",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Resend verification email
 */
export const resendVerificationEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = req.body;

    if (!email) {
      throw new AppError("Email is required", 400);
    }

    await userService.resendVerificationEmail(email);

    // Always return success to avoid email enumeration
    res.status(200).json({
      status: "success",
      message:
        "If your email is registered and not verified, a new verification email has been sent.",
    });
  } catch (error) {
    next(error);
  }
};
