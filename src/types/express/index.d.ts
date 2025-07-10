import { UserRole } from "../../../prisma/generated/prisma";
import { Session } from "../../../prisma/generated/prisma";

// Extend Express Request interface with custom properties
declare global {
  namespace Express {
    interface Request {
      id?: string;
      user?: {
        id: string;
        role: UserRole;
        [key: string]: any;
      };
      session?: Session;
    }
  }
}

// Add an empty export to make this file a module
export {};
