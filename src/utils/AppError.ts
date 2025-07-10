/**
 * Custom error class for application errors
 * Allows for consistent error formatting across the application
 */
export default class AppError extends Error {
  statusCode: number;
  details: any;
  isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    details: any = null,
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = isOperational;

    // Preserve proper stack trace for error stack
    Error.captureStackTrace(this, this.constructor);
  }
}
