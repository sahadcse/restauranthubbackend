/**
 * Notification Management Domain
 * -----------------------------------------------------------------------------
 * This module provides a comprehensive notification and feedback management system
 * for the restaurant e-commerce platform.
 *
 * The domain follows a clean architecture pattern with:
 * - Controllers for HTTP request handling
 * - Services for business logic and orchestration
 * - Repositories for data access and persistence
 * - Types for data transfer objects and interfaces
 * - Validation schemas for input validation
 *
 * Features:
 * - User notifications with multiple channels (email, SMS, push, in-app)
 * - Feedback collection and management
 * - Notification statistics and analytics
 * - Bulk notification capabilities
 * - Role-based access control
 *
 * Export structure:
 * - notificationRoutes: Express router with all notification and feedback routes
 * - notificationService: Service functions for notification business logic
 * - feedbackService: Service functions for feedback business logic
 * - notificationValidation: Validation schemas for requests
 * - notificationTypes: TypeScript interfaces and types
 * -----------------------------------------------------------------------------
 */

import notificationRoutes from "./routes/notification.routes";
import * as notificationService from "./services/notification.service";
import * as feedbackService from "./services/feedback.service";
import * as notificationValidation from "./validations/notification.validation";
import * as notificationTypes from "./types/notification.types";

// Export the main router and services
export {
  notificationRoutes,
  notificationService,
  feedbackService,
  notificationValidation,
  notificationTypes,
};

// Export default router for easy integration
export default notificationRoutes;
