import { UserRole } from "../../prisma/generated/prisma";

// Define JsonValue type locally to be used across the application
type JsonValue =
  | string
  | number
  | boolean
  | null
  | { [key: string]: JsonValue }
  | JsonValue[];

declare global {
  namespace Express {
    interface Request {
      user?: {
        [key:string]: any;
        id: string;
        role: UserRole;
        email: string; // Added for payment processing
      };
      session?: {
        id: string;
        userId: string;
        token: string;
        refreshToken: string | null;
        ipAddress: string | null;
        deviceInfo: JsonValue;
        expiresAt: Date;
        revokedAt: Date | null;
        createdAt: Date;
      };
    }
  }
}

// This export is necessary to make this file a module
export {};
