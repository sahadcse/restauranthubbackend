import { z } from "zod";
import { SliderLinkType } from "../../../../prisma/generated/prisma";

// Helper schemas
const linkTypeSchema = z.nativeEnum(SliderLinkType);

// HeroSlider validation schemas
export const createHeroSliderSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  description: z.string().max(500, "Description too long").optional(),
  imageUrl: z.string().url("Invalid image URL"),
  price: z.number().positive("Price must be positive").optional(),
  buttonText: z.string().max(50, "Button text too long").optional(),
  linkUrl: z.string().url("Invalid link URL").optional(),
  linkType: linkTypeSchema.default(SliderLinkType.NONE),
  linkTargetId: z.string().uuid("Invalid target ID").optional(),
  displayOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  tenantId: z.string().uuid("Invalid tenant ID").optional(),
});

export const updateHeroSliderSchema = createHeroSliderSchema.partial();

// DealSection validation schemas
export const createDealSectionSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  subtitle: z.string().max(300, "Subtitle too long").optional(),
  timerDays: z.number().int().min(0).max(365).optional(),
  timerHours: z.number().int().min(0).max(23).optional(),
  timerMinutes: z.number().int().min(0).max(59).optional(),
  isActive: z.boolean().default(true),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  tenantId: z.string().uuid("Invalid tenant ID").optional(),
});

export const updateDealSectionSchema = createDealSectionSchema.partial();

// Banner validation schemas
export const createBannerSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  subtitle: z.string().max(300, "Subtitle too long").optional(),
  imageUrl: z.string().url("Invalid image URL").optional(),
  hurryText: z.string().max(100, "Hurry text too long").optional(),
  buttonText: z.string().max(50, "Button text too long").optional(),
  buttonLink: z.string().url("Invalid button link").optional(),
  linkType: linkTypeSchema.optional(),
  linkTargetId: z.string().uuid("Invalid target ID").optional(),
  isActive: z.boolean().default(true),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  tenantId: z.string().uuid("Invalid tenant ID").optional(),
});

export const updateBannerSchema = createBannerSchema.partial();

// OfferBanner validation schemas
export const createOfferBannerSchema = z.object({
  discount: z
    .string()
    .min(1, "Discount is required")
    .max(50, "Discount text too long"),
  image: z.string().url("Invalid image URL"),
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  subtitle: z
    .string()
    .min(1, "Subtitle is required")
    .max(300, "Subtitle too long"),
  buttonText: z
    .string()
    .min(1, "Button text is required")
    .max(50, "Button text too long"),
  buttonLink: z.string().url("Invalid button link"),
  linkType: linkTypeSchema.optional(),
  linkTargetId: z.string().uuid("Invalid target ID").optional(),
  isActive: z.boolean().default(true),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  tenantId: z.string().uuid("Invalid tenant ID").optional(),
});

export const updateOfferBannerSchema = createOfferBannerSchema.partial();

// NewArrivalsSection validation schemas
export const createNewArrivalsSectionSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  subtitle: z.string().max(300, "Subtitle too long").optional(),
  isActive: z.boolean().default(true),
  tenantId: z.string().uuid("Invalid tenant ID").optional(),
});

export const updateNewArrivalsSectionSchema =
  createNewArrivalsSectionSchema.partial();

// Tab validation schemas
export const createTabSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  order: z.number().int().min(0).default(0),
  sectionId: z.string().uuid("Invalid section ID"),
  isActive: z.boolean().default(true),
  tenantId: z.string().uuid("Invalid tenant ID").optional(),
});

export const updateTabSchema = createTabSchema
  .partial()
  .omit({ sectionId: true });

// OfferSection validation schemas
export const createOfferSectionSchema = z.object({
  isActive: z.boolean().default(true),
  tenantId: z.string().uuid("Invalid tenant ID").optional(),
});

export const updateOfferSectionSchema = createOfferSectionSchema.partial();

// OfferSectionBanner validation schemas
export const createOfferSectionBannerSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  buttonText: z
    .string()
    .min(1, "Button text is required")
    .max(50, "Button text too long"),
  buttonLink: z.string().url("Invalid button link"),
  offerSectionId: z.string().uuid("Invalid offer section ID"),
  isActive: z.boolean().default(true),
  tenantId: z.string().uuid("Invalid tenant ID").optional(),
});

export const updateOfferSectionBannerSchema = createOfferSectionBannerSchema
  .partial()
  .omit({ offerSectionId: true });

// Slider validation schemas
export const createSliderSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  offerSectionId: z.string().uuid("Invalid offer section ID"),
  displayOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  tenantId: z.string().uuid("Invalid tenant ID").optional(),
});

export const updateSliderSchema = createSliderSchema
  .partial()
  .omit({ offerSectionId: true });

// MenuItemsOnSliders validation schemas
export const assignMenuItemToSliderSchema = z.object({
  menuItemId: z.string().uuid("Invalid menu item ID"),
  order: z.number().int().min(0).optional(),
});

export const updateMenuItemOnSliderSchema = z.object({
  order: z.number().int().min(0).optional(),
});
