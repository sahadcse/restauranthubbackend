import { Request, Response, NextFunction } from "express";
import prisma from "../db";
import AppError from "../utils/AppError";
import logger from "../utils/logger";
import { UserRole } from "../../prisma/generated/prisma";
import { verifyToken, extractTokenFromHeader } from "../utils/jwt.utils";

// Authenticate: validate token, session and user status
export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  const token = extractTokenFromHeader(authHeader);

  if (!token) {
    return next(new AppError("Missing or invalid authorization header", 401));
  }

  const payload = verifyToken(token);
  if (!payload) {
    return next(new AppError("Invalid or expired token", 401));
  }

  // verify session
  const session = await prisma.session.findUnique({
    where: { token },
    include: {
      user: { select: { id: true, role: true, isActive: true } },
    },
  });

  if (
    !session ||
    !session.user ||
    session.revokedAt !== null ||
    session.expiresAt <= new Date()
  ) {
    return next(new AppError("Session no longer valid", 401));
  }

  if (!session.user.isActive) {
    return next(new AppError("User account is inactive", 403));
  }

  // Now TypeScript will recognize these properties due to our type extension
  req.user = { id: session.user.id, role: session.user.role };
  req.session = session;
  next();
};

// Authorize by user role - Updated to accept UserRole enum values
export const authorizeRoles = (...roles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError("Forbidden: insufficient role", 403));
    }
    next();
  };
};

// Authorize by explicit permission names
export const authorizePermissions = (...perms: string[]) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError("Forbidden", 403));
    }

    const granted = await prisma.rolePermission.findMany({
      where: {
        role: req.user.role as UserRole, // Ensure role is cast to UserRole
        permission: { name: { in: perms } },
      },
      include: {
        permission: true, // Include the permission relation
      },
    });

    const grantedNames = granted.map(
      (rp) => rp.permission.name // Access permission.name directly
    );

    const missing = perms.filter((p) => !grantedNames.includes(p));
    if (missing.length) {
      logger.warn(`Role ${req.user.role} missing permissions: ${missing}`);
      return next(new AppError("Forbidden: insufficient permissions", 403));
    }

    next();
  };
};
