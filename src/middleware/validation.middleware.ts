import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import logger from "../utils/logger";
// Add notification integration for validation errors
import { notificationIntegration } from "../domains/notification/services/integration.service";

/**
 * Middleware for validating request data using Zod schemas
 */
export const validateRequest = (
  schema: ZodSchema,
  source: "body" | "query" | "params" = "body"
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      let dataToValidate;

      switch (source) {
        case "query":
          dataToValidate = req.query;
          break;
        case "params":
          dataToValidate = req.params;
          break;
        case "body":
        default:
          dataToValidate = req.body;
          break;
      }

      const validatedData = schema.parse(dataToValidate);

      // For query parameters, store validated data in a custom property
      // instead of trying to overwrite req.query which is read-only
      if (source === "query") {
        // Store validated query parameters in a custom property
        (req as any).validatedQuery = validatedData;
      } else if (source === "params") {
        (req as any).validatedParams = validatedData;
      } else {
        req.body = validatedData;
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorDetails = error.errors.map((err) => ({
          path: err.path.join("."),
          message: err.message,
        }));

        logger.warn("Validation error:", errorDetails);

        // Send security alert for repeated validation failures
        if (req.user && req.headers["x-validation-failures"]) {
          const failures = parseInt(
            req.headers["x-validation-failures"] as string
          );
          if (failures > 5) {
            try {
              notificationIntegration.system.securityAlert(
                req.user.id,
                "repeated_validation_failures",
                {
                  failureCount: failures,
                  lastFailure: new Date().toISOString(),
                  endpoint: req.originalUrl,
                }
              );
            } catch (notificationError) {
              logger.warn(
                "Failed to send validation failure notification:",
                notificationError
              );
            }
          }
        }

        res.status(400).json({
          status: "error",
          message: "Validation error",
          details: {
            errors: errorDetails,
          },
          requestId: req.headers["x-request-id"] || "unknown",
        });
        return;
      }

      logger.error("Unexpected validation error:", error);
      res.status(500).json({
        status: "error",
        message: "Internal server error during validation",
        requestId: req.headers["x-request-id"] || "unknown",
      });
    }
  };
};

// Convenience functions for different validation sources
export const validateBody = (schema: ZodSchema) =>
  validateRequest(schema, "body");
export const validateQuery = (schema: ZodSchema) =>
  validateRequest(schema, "query");
export const validateParams = (schema: ZodSchema) =>
  validateRequest(schema, "params");

/**
 * Enhanced validation middleware that supports nested schema validation
 */
export const validateRequestAdvanced = (schemas: {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validationResults: any = {};

      // Validate body if schema provided
      if (schemas.body) {
        validationResults.body = schemas.body.parse(req.body);
        req.body = validationResults.body;
      }

      // Validate query if schema provided
      if (schemas.query) {
        validationResults.query = schemas.query.parse(req.query);
        (req as any).validatedQuery = validationResults.query;
      }

      // Validate params if schema provided
      if (schemas.params) {
        validationResults.params = schemas.params.parse(req.params);
        (req as any).validatedParams = validationResults.params;
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorDetails = error.errors.map((err) => ({
          path: err.path.join("."),
          message: err.message,
        }));

        logger.warn("Advanced validation error:", errorDetails);

        res.status(400).json({
          status: "error",
          message: "Validation error",
          details: {
            errors: errorDetails,
          },
          requestId: req.headers["x-request-id"] || "unknown",
        });
        return;
      }

      logger.error("Unexpected advanced validation error:", error);
      res.status(500).json({
        status: "error",
        message: "Internal server error during validation",
        requestId: req.headers["x-request-id"] || "unknown",
      });
    }
  };
};
