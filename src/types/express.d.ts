import { UserRole, Session } from "../../prisma/generated/prisma";

// Define a simplified user type for auth middleware
export interface AuthUser {
  id: string;
  role: UserRole;
  email?: string;
  firstName?: string;
  lastName?: string;
}

declare global {
  namespace Express {
    interface Request {
      // The authenticated user information (simplified)
      user?: AuthUser;

      // The current session
      session?: Session;

      // The validated query parameters
      validatedQuery?: any;

      // The validated route parameters
      validatedParams?: any;

      // OAuth-specific properties
      oauthProvider?: string;
      oauthState?: string;

      // Helper methods for IP address handling
      getClientIP?: () => string;
    }
  }

  // OAuth rate limiting storage
  var oauthAttempts: Map<string, number[]>;
}

export {};
