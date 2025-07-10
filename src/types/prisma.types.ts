/**
 * Type definition for Prisma query events
 */
export type PrismaQueryEvent = {
  timestamp: Date;
  query: string;
  params: string;
  duration: number;
  target: string;
};

/**
 * Type definition for Prisma log events
 */
export type PrismaLogEvent = {
  message: string;
  target: string;
};
