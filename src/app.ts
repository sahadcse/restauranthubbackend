/// <reference path="./types/express/index.d.ts" />
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import { v4 as uuidv4 } from "uuid";
import routes from "./routes";
import AppError from "./utils/AppError";
import logger from "./utils/logger";

// Initialize Express app
const app = express();

// Add request ID to each request for tracking
app.use((req: Request, _res: Response, next: NextFunction) => {
  req.id = uuidv4();
  next();
});

// Configure security middleware
app.use(
  helmet({
    contentSecurityPolicy:
      process.env.NODE_ENV === "production" ? undefined : false,
    crossOriginEmbedderPolicy: process.env.NODE_ENV === "production",
  })
);

// Configure CORS
const corsOptions = {
  origin:
    process.env.NODE_ENV === "production"
      ? (process.env.ALLOWED_ORIGINS || process.env.FRONTEND_URL)?.split(",")
      : "*",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  maxAge: 86400, // 24 hours
};
app.use(cors(corsOptions));

// Enable gzip compression
app.use(compression());

// Configure request body parsers with limits
app.use(
  express.json({
    limit: "1mb",
    verify: (req: Request, res: Response, buf: Buffer, encoding: string) => {
      try {
        JSON.parse(buf.toString());
      } catch (e) {
        res.status(400).json({
          status: "error",
          message: "Invalid JSON payload",
        });
        throw new Error("Invalid JSON");
      }
    },
  })
);
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser());

// Set up rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: "error",
    message: "Too many requests, please try again later.",
  },
});
app.use("/api/", apiLimiter);

// Configure request logging
if (process.env.NODE_ENV !== "test") {
  app.use(
    morgan("combined", {
      stream: {
        write: (message: string) => logger.info(message.trim()),
      },
    })
  );
}

// Log request details for debugging
app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.info(`${req.id} - ${req.method} ${req.originalUrl}`);
  next();
});

// Set security headers
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("X-Frame-Options", "DENY");
  next();
});

// Use the centralized routes
app.use("/api", routes);

// Handle 404 errors
app.use((_req: Request, res: Response, next: NextFunction) => {
  next(new AppError("Resource not found", 404));
});

// Global error handler
app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  // Log error details
  if (statusCode >= 500) {
    logger.error(`${req.id} - ${statusCode} - ${message}`, {
      stack: err.stack,
      path: req.originalUrl,
      method: req.method,
      ip: req.ip,
    });
  } else {
    logger.warn(`${req.id} - ${statusCode} - ${message}`, {
      path: req.originalUrl,
      method: req.method,
    });
  }

  // Send error response
  res.status(statusCode).json({
    status: "error",
    message,
    ...(err.details && { details: err.details }),
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    requestId: req.id,
  });
});

export default app;
