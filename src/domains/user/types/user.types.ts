import { UserRole, AccountStatus } from "../../../../prisma/generated/prisma";

// Data needed to create a new user
export interface UserCreateDto {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  role?: UserRole; // Default will be set in service
  privacyConsent: boolean; // Required privacy consent
}

// Internal user data for creating a user record
export interface UserCreateData {
  email: string;
  passwordHash: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  role: UserRole;
  accountStatus: AccountStatus;
  isActive: boolean;
  privacyConsent: boolean;
  consentGivenAt?: Date | null; // Changed to accept null as well
  lastActivityAt?: Date; // Added optional lastActivityAt
}

// Response after user creation (excluding sensitive data)
export interface UserResponseDto {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  phoneNumber?: string | null;
  role: UserRole;
  accountStatus: AccountStatus;
  privacyConsent: boolean;
  createdAt: Date;
}
