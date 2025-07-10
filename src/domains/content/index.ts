/**
 * Content Management Domain
 * -----------------------------------------------------------------------------
 * This module provides a unified interface for all content management operations
 * including sliders, banners, deals, and promotional sections.
 *
 * The domain follows a clean architecture pattern with:
 * - Controllers for HTTP request handling
 * - Services for business logic
 * - Repositories for data access
 * - Validation schemas for input validation
 *
 * Export structure:
 * - contentRoutes: Express router with all content routes
 * - contentService: Service functions for business logic
 * - contentValidation: Validation schemas
 * -----------------------------------------------------------------------------
 */

import contentRoutes from "./routes/content.routes";
import * as contentService from "./services/content.service";
import * as contentValidation from "./validations/content.validation";

// Export the main router and services
export { contentRoutes, contentService, contentValidation };

// Export default router for easy integration
export default contentRoutes;
