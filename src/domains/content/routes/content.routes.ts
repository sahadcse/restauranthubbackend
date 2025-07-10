/**
 * Content Management Domain Routes
 * -----------------------------------------------------------------------------
 * This file defines all Express routes for the Content Management domain, including:
 *   - Hero Sliders management
 *   - Deal Sections management
 *   - Banner management
 *   - Offer Banner management
 *   - New Arrivals Sections management
 *   - Tab management
 *   - Offer Sections management
 *   - Slider management
 *   - Menu item assignments to sliders
 *
 * All routes are protected and validated according to business requirements.
 * Middleware is used for authentication, authorization, and request validation.
 *
 * Best Practices:
 *   - Use role-based access control for sensitive operations
 *   - Validate all incoming requests using schema validation
 *   - Organize routes by resource and HTTP method
 *   - Export a single router instance for modular integration
 * -----------------------------------------------------------------------------
 */

import { Router } from "express";
import * as contentController from "../controllers/content.controller";
import {
  authenticate,
  authorizeRoles,
} from "../../../middleware/auth.middleware";
import { validateRequest } from "../../../middleware/validation.middleware";
import {
  createHeroSliderSchema,
  updateHeroSliderSchema,
  createDealSectionSchema,
  updateDealSectionSchema,
  createBannerSchema,
  updateBannerSchema,
  createOfferBannerSchema,
  updateOfferBannerSchema,
  createNewArrivalsSectionSchema,
  updateNewArrivalsSectionSchema,
  createTabSchema,
  updateTabSchema,
  createOfferSectionSchema,
  updateOfferSectionSchema,
  createOfferSectionBannerSchema,
  updateOfferSectionBannerSchema,
  createSliderSchema,
  updateSliderSchema,
  assignMenuItemToSliderSchema,
  updateMenuItemOnSliderSchema,
} from "../validations/content.validation";
import { UserRole } from "../../../../prisma/generated/prisma";

const router = Router();

//-----------------------------------------------------------------------------
// IMPORTANT: Static routes MUST come before parameterized routes
// This prevents Express from matching static paths as IDs
//-----------------------------------------------------------------------------

//-----------------------------------------------------------------------------
// Hero Slider routes
//-----------------------------------------------------------------------------

/**
 * @route   GET /hero-sliders
 * @desc    Get all hero sliders
 * @access  Public
 */
router.get("/hero-sliders", contentController.getAllHeroSliders);

/**
 * @route   POST /hero-sliders
 * @desc    Create a new hero slider
 * @access  Private (Admin, Super Admin)
 */
router.post(
  "/hero-sliders",
  authenticate,
  authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateRequest(createHeroSliderSchema),
  contentController.createHeroSlider
);

/**
 * @route   GET /hero-sliders/:id
 * @desc    Get hero slider by ID
 * @access  Public
 */
router.get("/hero-sliders/:id", contentController.getHeroSliderById);

/**
 * @route   PUT /hero-sliders/:id
 * @desc    Update hero slider by ID
 * @access  Private (Admin, Super Admin)
 */
router.put(
  "/hero-sliders/:id",
  authenticate,
  authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateRequest(updateHeroSliderSchema),
  contentController.updateHeroSlider
);

/**
 * @route   DELETE /hero-sliders/:id
 * @desc    Delete hero slider by ID
 * @access  Private (Admin, Super Admin)
 */
router.delete(
  "/hero-sliders/:id",
  authenticate,
  authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  contentController.deleteHeroSlider
);

//-----------------------------------------------------------------------------
// Deal Section routes
//-----------------------------------------------------------------------------

/**
 * @route   GET /deal-sections
 * @desc    Get all deal sections
 * @access  Public
 */
router.get("/deal-sections", contentController.getAllDealSections);

/**
 * @route   POST /deal-sections
 * @desc    Create a new deal section
 * @access  Private (Restaurant Owner, Admin, Super Admin)
 */
router.post(
  "/deal-sections",
  authenticate,
  authorizeRoles(
    UserRole.RESTAURANT_OWNER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  validateRequest(createDealSectionSchema),
  contentController.createDealSection
);

/**
 * @route   GET /deal-sections/:id
 * @desc    Get deal section by ID
 * @access  Public
 */
router.get("/deal-sections/:id", contentController.getDealSectionById);

/**
 * @route   PUT /deal-sections/:id
 * @desc    Update deal section by ID
 * @access  Private (Restaurant Owner, Admin, Super Admin)
 */
router.put(
  "/deal-sections/:id",
  authenticate,
  authorizeRoles(
    UserRole.RESTAURANT_OWNER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  validateRequest(updateDealSectionSchema),
  contentController.updateDealSection
);

/**
 * @route   DELETE /deal-sections/:id
 * @desc    Delete deal section by ID
 * @access  Private (Restaurant Owner, Admin, Super Admin)
 */
router.delete(
  "/deal-sections/:id",
  authenticate,
  authorizeRoles(
    UserRole.RESTAURANT_OWNER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  contentController.deleteDealSection
);

//-----------------------------------------------------------------------------
// Banner routes
//-----------------------------------------------------------------------------

/**
 * @route   GET /banners
 * @desc    Get all banners
 * @access  Public
 */
router.get("/banners", contentController.getAllBanners);

/**
 * @route   POST /banners
 * @desc    Create a new banner
 * @access  Private (Admin, Super Admin)
 */
router.post(
  "/banners",
  authenticate,
  authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateRequest(createBannerSchema),
  contentController.createBanner
);

/**
 * @route   GET /banners/:id
 * @desc    Get banner by ID
 * @access  Public
 */
router.get("/banners/:id", contentController.getBannerById);

/**
 * @route   PUT /banners/:id
 * @desc    Update banner by ID
 * @access  Private (Admin, Super Admin)
 */
router.put(
  "/banners/:id",
  authenticate,
  authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateRequest(updateBannerSchema),
  contentController.updateBanner
);

/**
 * @route   DELETE /banners/:id
 * @desc    Delete banner by ID
 * @access  Private (Admin, Super Admin)
 */
router.delete(
  "/banners/:id",
  authenticate,
  authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  contentController.deleteBanner
);

//-----------------------------------------------------------------------------
// Offer Banner routes
//-----------------------------------------------------------------------------

/**
 * @route   GET /offer-banners
 * @desc    Get all offer banners
 * @access  Public
 */
router.get("/offer-banners", contentController.getAllOfferBanners);

/**
 * @route   POST /offer-banners
 * @desc    Create a new offer banner
 * @access  Private (Admin, Super Admin)
 */
router.post(
  "/offer-banners",
  authenticate,
  authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateRequest(createOfferBannerSchema),
  contentController.createOfferBanner
);

/**
 * @route   GET /offer-banners/:id
 * @desc    Get offer banner by ID
 * @access  Public
 */
router.get("/offer-banners/:id", contentController.getOfferBannerById);

/**
 * @route   PUT /offer-banners/:id
 * @desc    Update offer banner by ID
 * @access  Private (Admin, Super Admin)
 */
router.put(
  "/offer-banners/:id",
  authenticate,
  authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateRequest(updateOfferBannerSchema),
  contentController.updateOfferBanner
);

/**
 * @route   DELETE /offer-banners/:id
 * @desc    Delete offer banner by ID
 * @access  Private (Admin, Super Admin)
 */
router.delete(
  "/offer-banners/:id",
  authenticate,
  authorizeRoles(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  contentController.deleteOfferBanner
);

//-----------------------------------------------------------------------------
// New Arrivals Section routes
//-----------------------------------------------------------------------------

/**
 * @route   GET /new-arrivals-sections
 * @desc    Get all new arrivals sections
 * @access  Public
 */
router.get(
  "/new-arrivals-sections",
  contentController.getAllNewArrivalsSections
);

/**
 * @route   POST /new-arrivals-sections
 * @desc    Create a new arrivals section
 * @access  Private (Restaurant Owner, Admin, Super Admin)
 */
router.post(
  "/new-arrivals-sections",
  authenticate,
  authorizeRoles(
    UserRole.RESTAURANT_OWNER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  validateRequest(createNewArrivalsSectionSchema),
  contentController.createNewArrivalsSection
);

/**
 * @route   GET /new-arrivals-sections/:id
 * @desc    Get new arrivals section by ID
 * @access  Public
 */
router.get(
  "/new-arrivals-sections/:id",
  contentController.getNewArrivalsSectionById
);

/**
 * @route   PUT /new-arrivals-sections/:id
 * @desc    Update new arrivals section by ID
 * @access  Private (Restaurant Owner, Admin, Super Admin)
 */
router.put(
  "/new-arrivals-sections/:id",
  authenticate,
  authorizeRoles(
    UserRole.RESTAURANT_OWNER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  validateRequest(updateNewArrivalsSectionSchema),
  contentController.updateNewArrivalsSection
);

/**
 * @route   DELETE /new-arrivals-sections/:id
 * @desc    Delete new arrivals section by ID
 * @access  Private (Restaurant Owner, Admin, Super Admin)
 */
router.delete(
  "/new-arrivals-sections/:id",
  authenticate,
  authorizeRoles(
    UserRole.RESTAURANT_OWNER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  contentController.deleteNewArrivalsSection
);

//-----------------------------------------------------------------------------
// Tab routes (nested under sections)
//-----------------------------------------------------------------------------

/**
 * @route   GET /new-arrivals-sections/:sectionId/tabs
 * @desc    Get tabs by section ID
 * @access  Public
 */
router.get(
  "/new-arrivals-sections/:sectionId/tabs",
  contentController.getTabsBySectionId
);

/**
 * @route   POST /tabs
 * @desc    Create a new tab
 * @access  Private (Restaurant Owner, Admin, Super Admin)
 */
router.post(
  "/tabs",
  authenticate,
  authorizeRoles(
    UserRole.RESTAURANT_OWNER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  validateRequest(createTabSchema),
  contentController.createTab
);

/**
 * @route   GET /tabs/:id
 * @desc    Get tab by ID
 * @access  Public
 */
router.get("/tabs/:id", contentController.getTabById);

/**
 * @route   PUT /tabs/:id
 * @desc    Update tab by ID
 * @access  Private (Restaurant Owner, Admin, Super Admin)
 */
router.put(
  "/tabs/:id",
  authenticate,
  authorizeRoles(
    UserRole.RESTAURANT_OWNER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  validateRequest(updateTabSchema),
  contentController.updateTab
);

/**
 * @route   DELETE /tabs/:id
 * @desc    Delete tab by ID
 * @access  Private (Restaurant Owner, Admin, Super Admin)
 */
router.delete(
  "/tabs/:id",
  authenticate,
  authorizeRoles(
    UserRole.RESTAURANT_OWNER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  contentController.deleteTab
);

//-----------------------------------------------------------------------------
// Offer Section routes
//-----------------------------------------------------------------------------

/**
 * @route   GET /offer-sections
 * @desc    Get all offer sections
 * @access  Public
 */
router.get("/offer-sections", contentController.getAllOfferSections);

/**
 * @route   POST /offer-sections
 * @desc    Create a new offer section
 * @access  Private (Restaurant Owner, Admin, Super Admin)
 */
router.post(
  "/offer-sections",
  authenticate,
  authorizeRoles(
    UserRole.RESTAURANT_OWNER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  validateRequest(createOfferSectionSchema),
  contentController.createOfferSection
);

/**
 * @route   GET /offer-sections/:id
 * @desc    Get offer section by ID
 * @access  Public
 */
router.get("/offer-sections/:id", contentController.getOfferSectionById);

/**
 * @route   PUT /offer-sections/:id
 * @desc    Update offer section by ID
 * @access  Private (Restaurant Owner, Admin, Super Admin)
 */
router.put(
  "/offer-sections/:id",
  authenticate,
  authorizeRoles(
    UserRole.RESTAURANT_OWNER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  validateRequest(updateOfferSectionSchema),
  contentController.updateOfferSection
);

/**
 * @route   DELETE /offer-sections/:id
 * @desc    Delete offer section by ID
 * @access  Private (Restaurant Owner, Admin, Super Admin)
 */
router.delete(
  "/offer-sections/:id",
  authenticate,
  authorizeRoles(
    UserRole.RESTAURANT_OWNER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  contentController.deleteOfferSection
);

//-----------------------------------------------------------------------------
// Offer Section Banner routes
//-----------------------------------------------------------------------------

/**
 * @route   GET /offer-sections/:offerSectionId/banner
 * @desc    Get offer section banner by offer section ID
 * @access  Public
 */
router.get(
  "/offer-sections/:offerSectionId/banner",
  contentController.getOfferSectionBannerByOfferSectionId
);

/**
 * @route   POST /offer-section-banners
 * @desc    Create a new offer section banner
 * @access  Private (Restaurant Owner, Admin, Super Admin)
 */
router.post(
  "/offer-section-banners",
  authenticate,
  authorizeRoles(
    UserRole.RESTAURANT_OWNER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  validateRequest(createOfferSectionBannerSchema),
  contentController.createOfferSectionBanner
);

/**
 * @route   PUT /offer-section-banners/:id
 * @desc    Update offer section banner by ID
 * @access  Private (Restaurant Owner, Admin, Super Admin)
 */
router.put(
  "/offer-section-banners/:id",
  authenticate,
  authorizeRoles(
    UserRole.RESTAURANT_OWNER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  validateRequest(updateOfferSectionBannerSchema),
  contentController.updateOfferSectionBanner
);

/**
 * @route   DELETE /offer-section-banners/:id
 * @desc    Delete offer section banner by ID
 * @access  Private (Restaurant Owner, Admin, Super Admin)
 */
router.delete(
  "/offer-section-banners/:id",
  authenticate,
  authorizeRoles(
    UserRole.RESTAURANT_OWNER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  contentController.deleteOfferSectionBanner
);

//-----------------------------------------------------------------------------
// Slider routes
//-----------------------------------------------------------------------------

/**
 * @route   GET /offer-sections/:offerSectionId/sliders
 * @desc    Get sliders by offer section ID
 * @access  Public
 */
router.get(
  "/offer-sections/:offerSectionId/sliders",
  contentController.getSlidersByOfferSectionId
);

/**
 * @route   POST /sliders
 * @desc    Create a new slider
 * @access  Private (Restaurant Owner, Admin, Super Admin)
 */
router.post(
  "/sliders",
  authenticate,
  authorizeRoles(
    UserRole.RESTAURANT_OWNER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  validateRequest(createSliderSchema),
  contentController.createSlider
);

/**
 * @route   GET /sliders/:id
 * @desc    Get slider by ID
 * @access  Public
 */
router.get("/sliders/:id", contentController.getSliderById);

/**
 * @route   PUT /sliders/:id
 * @desc    Update slider by ID
 * @access  Private (Restaurant Owner, Admin, Super Admin)
 */
router.put(
  "/sliders/:id",
  authenticate,
  authorizeRoles(
    UserRole.RESTAURANT_OWNER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  validateRequest(updateSliderSchema),
  contentController.updateSlider
);

/**
 * @route   DELETE /sliders/:id
 * @desc    Delete slider by ID
 * @access  Private (Restaurant Owner, Admin, Super Admin)
 */
router.delete(
  "/sliders/:id",
  authenticate,
  authorizeRoles(
    UserRole.RESTAURANT_OWNER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  contentController.deleteSlider
);

//-----------------------------------------------------------------------------
// Menu Items on Sliders routes
//-----------------------------------------------------------------------------

/**
 * @route   POST /sliders/:sliderId/menu-items
 * @desc    Assign menu item to slider
 * @access  Private (Restaurant Owner, Restaurant Staff, Admin, Super Admin)
 */
router.post(
  "/sliders/:sliderId/menu-items",
  authenticate,
  authorizeRoles(
    UserRole.RESTAURANT_OWNER,
    UserRole.RESTAURANT_STAFF,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  validateRequest(assignMenuItemToSliderSchema),
  contentController.assignMenuItemToSlider
);

/**
 * @route   PUT /sliders/:sliderId/menu-items/:menuItemId
 * @desc    Update menu item assignment on slider
 * @access  Private (Restaurant Owner, Restaurant Staff, Admin, Super Admin)
 */
router.put(
  "/sliders/:sliderId/menu-items/:menuItemId",
  authenticate,
  authorizeRoles(
    UserRole.RESTAURANT_OWNER,
    UserRole.RESTAURANT_STAFF,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  validateRequest(updateMenuItemOnSliderSchema),
  contentController.updateMenuItemOnSlider
);

/**
 * @route   DELETE /sliders/:sliderId/menu-items/:menuItemId
 * @desc    Remove menu item from slider
 * @access  Private (Restaurant Owner, Restaurant Staff, Admin, Super Admin)
 */
router.delete(
  "/sliders/:sliderId/menu-items/:menuItemId",
  authenticate,
  authorizeRoles(
    UserRole.RESTAURANT_OWNER,
    UserRole.RESTAURANT_STAFF,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  contentController.removeMenuItemFromSlider
);

export default router;
