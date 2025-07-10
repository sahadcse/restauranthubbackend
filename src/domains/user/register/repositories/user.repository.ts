import prisma from "../../../../db";
import { UserCreateData, UserResponseDto } from "../../types/user.types";
import {
  User,
  UserRole,
  AccountStatus,
} from "../../../../../prisma/generated/prisma";

// Function to find a user by email
export const findUserByEmail = async (email: string): Promise<User | null> => {
  return prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });
};

// Check if super admin exists
export const findSuperAdmin = async (): Promise<User | null> => {
  return prisma.user.findFirst({
    where: { role: UserRole.SUPER_ADMIN },
  });
};

// Transform database user to response DTO (remove sensitive fields)
export const transformUserToDto = (user: User): UserResponseDto => {
  const { passwordHash, ...userWithoutPassword } = user;
  return userWithoutPassword as UserResponseDto;
};

// Function to create a new user in the database
export const createUser = async (
  data: UserCreateData
): Promise<UserResponseDto> => {
  // Prepare data for creation, ensuring all required fields are included
  const newUser = await prisma.user.create({
    data: {
      email: data.email,
      passwordHash: data.passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      phoneNumber: data.phoneNumber,
      role: data.role,
      accountStatus: data.accountStatus,
      isActive: data.isActive,
      privacyConsent: data.privacyConsent,
      consentGivenAt: data.consentGivenAt,
      // Default system fields will be provided by Prisma
      // createdAt, updatedAt are automatically handled
    },
  });

  return transformUserToDto(newUser);
};

// Create user and audit record in a transaction
export const createUserWithAudit = async (
  userData: UserCreateData,
  auditData: {
    operation: string;
    changes?: any;
    ipAddress?: string;
    userAgent?: string;
    changedBy?: string;
  }
) => {
  return prisma.$transaction(async (tx) => {
    // Create user
    const newUser = await tx.user.create({
      data: userData,
    });

    // Create audit entry
    await tx.userAudit.create({
      data: {
        userId: newUser.id,
        operation: auditData.operation,
        changes: auditData.changes,
        ipAddress: auditData.ipAddress,
        userAgent: auditData.userAgent,
        changedBy: auditData.changedBy,
      },
    });

    return transformUserToDto(newUser);
  });
};

// Update user verification attributes
export const storeVerificationToken = async (
  userId: string,
  token: string,
  expiresAt: Date
): Promise<void> => {
  await prisma.user.update({
    where: { id: userId },
    data: {
      attributes: {
        emailVerification: {
          token,
          expiresAt: expiresAt.toISOString(),
        },
      },
    },
  });
};

// Activate user account after verification
export const activateUserAccount = async (userId: string): Promise<void> => {
  await prisma.user.update({
    where: { id: userId },
    data: {
      accountStatus: AccountStatus.ACTIVE,
      attributes: {
        emailVerification: null,
      },
    },
  });
};

// Create a new session for a user
export const createSession = async (
  userId: string,
  token: string,
  ipAddress?: string,
  deviceInfo?: any,
  expiresAt?: Date
) => {
  return prisma.session.create({
    data: {
      userId,
      token,
      ipAddress,
      deviceInfo: deviceInfo ? JSON.stringify(deviceInfo) : undefined,
      expiresAt: expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 7 days
    },
  });
};

// Find a user by ID
export const findUserById = async (id: string): Promise<User | null> => {
  return prisma.user.findUnique({
    where: { id },
  });
};

// Update user attributes (JSON field)
export const updateUserAttributes = async (
  userId: string,
  attributes: any
): Promise<void> => {
  await prisma.user.update({
    where: { id: userId },
    data: {
      attributes,
    },
  });
};

// Update user account status
export const updateUserStatus = async (
  userId: string,
  accountStatus: AccountStatus
): Promise<void> => {
  await prisma.user.update({
    where: { id: userId },
    data: {
      accountStatus,
      attributes: {
        emailVerification: null,
      },
    },
  });
};
