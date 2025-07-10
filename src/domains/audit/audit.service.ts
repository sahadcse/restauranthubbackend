import prisma from "../../db";

/**
 * Create an audit entry for user operations
 */
export const createUserAudit = async (data: {
  userId: string;
  operation: string;
  changedBy?: string;
  changes?: any;
  ipAddress?: string;
  userAgent?: string;
}) => {
  return prisma.userAudit.create({
    data: {
      userId: data.userId,
      operation: data.operation,
      changedBy: data.changedBy,
      changes: data.changes,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
    },
  });
};

/**
 * List audit records for a user
 */
export const getUserAudits = async (userId: string, limit = 50, offset = 0) => {
  return prisma.userAudit.findMany({
    where: { userId },
    orderBy: { timestamp: "desc" },
    take: limit,
    skip: offset,
  });
};
