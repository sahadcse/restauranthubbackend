import { Request, Response } from "express";
import * as contentService from "../services/content.service";
import logger from "../../../utils/logger";

//-----------------------------------------------------------------------------
// HeroSlider controllers
//-----------------------------------------------------------------------------
export const getAllHeroSliders = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      page = "1",
      limit = "10",
      isActive,
      tenantId,
      activeOnly,
    } = req.query;

    const filters: any = {};
    if (isActive !== undefined) filters.isActive = isActive === "true";
    if (tenantId) filters.tenantId = tenantId as string;
    if (activeOnly !== undefined) filters.activeOnly = activeOnly === "true";

    const sliders = await contentService.getAllHeroSliders(
      parseInt(page as string, 10),
      parseInt(limit as string, 10),
      filters
    );

    res.status(200).json(sliders);
  } catch (error) {
    logger.error("Error in getAllHeroSliders:", error);
    res.status(500).json({
      message: "Failed to fetch hero sliders",
      error: (error as Error).message,
    });
  }
};

export const getHeroSliderById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const slider = await contentService.getHeroSliderById(id);

    if (!slider) {
      res.status(404).json({ message: "Hero slider not found" });
      return;
    }

    res.status(200).json(slider);
  } catch (error) {
    logger.error(`Error in getHeroSliderById for id ${req.params.id}:`, error);
    res.status(500).json({
      message: "Failed to fetch hero slider",
      error: (error as Error).message,
    });
  }
};

export const createHeroSlider = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const slider = await contentService.createHeroSlider(req.body);
    res.status(201).json(slider);
  } catch (error) {
    logger.error("Error in createHeroSlider:", error);
    res.status(500).json({
      message: "Failed to create hero slider",
      error: (error as Error).message,
    });
  }
};

export const updateHeroSlider = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const slider = await contentService.updateHeroSlider(id, req.body);

    if (!slider) {
      res.status(404).json({ message: "Hero slider not found" });
      return;
    }

    res.status(200).json(slider);
  } catch (error) {
    logger.error(`Error in updateHeroSlider for id ${req.params.id}:`, error);
    res.status(500).json({
      message: "Failed to update hero slider",
      error: (error as Error).message,
    });
  }
};

export const deleteHeroSlider = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    await contentService.deleteHeroSlider(id);
    res.status(204).send();
  } catch (error) {
    logger.error(`Error in deleteHeroSlider for id ${req.params.id}:`, error);
    res.status(500).json({
      message: "Failed to delete hero slider",
      error: (error as Error).message,
    });
  }
};

//-----------------------------------------------------------------------------
// DealSection controllers
//-----------------------------------------------------------------------------
export const getAllDealSections = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { page = "1", limit = "10", isActive, tenantId } = req.query;

    const filters: any = {};
    if (isActive !== undefined) filters.isActive = isActive === "true";
    if (tenantId) filters.tenantId = tenantId as string;

    const dealSections = await contentService.getAllDealSections(
      parseInt(page as string, 10),
      parseInt(limit as string, 10),
      filters
    );

    res.status(200).json(dealSections);
  } catch (error) {
    logger.error("Error in getAllDealSections:", error);
    res.status(500).json({
      message: "Failed to fetch deal sections",
      error: (error as Error).message,
    });
  }
};

export const getDealSectionById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const dealSection = await contentService.getDealSectionById(id);

    if (!dealSection) {
      res.status(404).json({ message: "Deal section not found" });
      return;
    }

    res.status(200).json(dealSection);
  } catch (error) {
    logger.error(`Error in getDealSectionById for id ${req.params.id}:`, error);
    res.status(500).json({
      message: "Failed to fetch deal section",
      error: (error as Error).message,
    });
  }
};

export const createDealSection = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const dealSection = await contentService.createDealSection(req.body);
    res.status(201).json(dealSection);
  } catch (error) {
    logger.error("Error in createDealSection:", error);
    res.status(500).json({
      message: "Failed to create deal section",
      error: (error as Error).message,
    });
  }
};

export const updateDealSection = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const dealSection = await contentService.updateDealSection(id, req.body);

    if (!dealSection) {
      res.status(404).json({ message: "Deal section not found" });
      return;
    }

    res.status(200).json(dealSection);
  } catch (error) {
    logger.error(`Error in updateDealSection for id ${req.params.id}:`, error);
    res.status(500).json({
      message: "Failed to update deal section",
      error: (error as Error).message,
    });
  }
};

export const deleteDealSection = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    await contentService.deleteDealSection(id);
    res.status(204).send();
  } catch (error) {
    logger.error(`Error in deleteDealSection for id ${req.params.id}:`, error);
    res.status(500).json({
      message: "Failed to delete deal section",
      error: (error as Error).message,
    });
  }
};

//-----------------------------------------------------------------------------
// Banner controllers
//-----------------------------------------------------------------------------
export const getAllBanners = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { page = "1", limit = "10", isActive, tenantId } = req.query;

    const filters: any = {};
    if (isActive !== undefined) filters.isActive = isActive === "true";
    if (tenantId) filters.tenantId = tenantId as string;

    const banners = await contentService.getAllBanners(
      parseInt(page as string, 10),
      parseInt(limit as string, 10),
      filters
    );

    res.status(200).json(banners);
  } catch (error) {
    logger.error("Error in getAllBanners:", error);
    res.status(500).json({
      message: "Failed to fetch banners",
      error: (error as Error).message,
    });
  }
};

export const getBannerById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const banner = await contentService.getBannerById(id);

    if (!banner) {
      res.status(404).json({ message: "Banner not found" });
      return;
    }

    res.status(200).json(banner);
  } catch (error) {
    logger.error(`Error in getBannerById for id ${req.params.id}:`, error);
    res.status(500).json({
      message: "Failed to fetch banner",
      error: (error as Error).message,
    });
  }
};

export const createBanner = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const banner = await contentService.createBanner(req.body);
    res.status(201).json(banner);
  } catch (error) {
    logger.error("Error in createBanner:", error);
    res.status(500).json({
      message: "Failed to create banner",
      error: (error as Error).message,
    });
  }
};

export const updateBanner = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const banner = await contentService.updateBanner(id, req.body);

    if (!banner) {
      res.status(404).json({ message: "Banner not found" });
      return;
    }

    res.status(200).json(banner);
  } catch (error) {
    logger.error(`Error in updateBanner for id ${req.params.id}:`, error);
    res.status(500).json({
      message: "Failed to update banner",
      error: (error as Error).message,
    });
  }
};

export const deleteBanner = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    await contentService.deleteBanner(id);
    res.status(204).send();
  } catch (error) {
    logger.error(`Error in deleteBanner for id ${req.params.id}:`, error);
    res.status(500).json({
      message: "Failed to delete banner",
      error: (error as Error).message,
    });
  }
};

//-----------------------------------------------------------------------------
// OfferBanner controllers
//-----------------------------------------------------------------------------
export const getAllOfferBanners = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { page = "1", limit = "10", isActive, tenantId } = req.query;

    const filters: any = {};
    if (isActive !== undefined) filters.isActive = isActive === "true";
    if (tenantId) filters.tenantId = tenantId as string;

    const offerBanners = await contentService.getAllOfferBanners(
      parseInt(page as string, 10),
      parseInt(limit as string, 10),
      filters
    );

    res.status(200).json(offerBanners);
  } catch (error) {
    logger.error("Error in getAllOfferBanners:", error);
    res.status(500).json({
      message: "Failed to fetch offer banners",
      error: (error as Error).message,
    });
  }
};

export const getOfferBannerById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const offerBanner = await contentService.getOfferBannerById(id);

    if (!offerBanner) {
      res.status(404).json({ message: "Offer banner not found" });
      return;
    }

    res.status(200).json(offerBanner);
  } catch (error) {
    logger.error(`Error in getOfferBannerById for id ${req.params.id}:`, error);
    res.status(500).json({
      message: "Failed to fetch offer banner",
      error: (error as Error).message,
    });
  }
};

export const createOfferBanner = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const offerBanner = await contentService.createOfferBanner(req.body);
    res.status(201).json(offerBanner);
  } catch (error) {
    logger.error("Error in createOfferBanner:", error);
    res.status(500).json({
      message: "Failed to create offer banner",
      error: (error as Error).message,
    });
  }
};

export const updateOfferBanner = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const offerBanner = await contentService.updateOfferBanner(id, req.body);

    if (!offerBanner) {
      res.status(404).json({ message: "Offer banner not found" });
      return;
    }

    res.status(200).json(offerBanner);
  } catch (error) {
    logger.error(`Error in updateOfferBanner for id ${req.params.id}:`, error);
    res.status(500).json({
      message: "Failed to update offer banner",
      error: (error as Error).message,
    });
  }
};

export const deleteOfferBanner = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    await contentService.deleteOfferBanner(id);
    res.status(204).send();
  } catch (error) {
    logger.error(`Error in deleteOfferBanner for id ${req.params.id}:`, error);
    res.status(500).json({
      message: "Failed to delete offer banner",
      error: (error as Error).message,
    });
  }
};

//-----------------------------------------------------------------------------
// NewArrivalsSection controllers
//-----------------------------------------------------------------------------
export const getAllNewArrivalsSections = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { page = "1", limit = "10", isActive, tenantId } = req.query;

    const filters: any = {};
    if (isActive !== undefined) filters.isActive = isActive === "true";
    if (tenantId) filters.tenantId = tenantId as string;

    const sections = await contentService.getAllNewArrivalsSections(
      parseInt(page as string, 10),
      parseInt(limit as string, 10),
      filters
    );

    res.status(200).json(sections);
  } catch (error) {
    logger.error("Error in getAllNewArrivalsSections:", error);
    res.status(500).json({
      message: "Failed to fetch new arrivals sections",
      error: (error as Error).message,
    });
  }
};

export const getNewArrivalsSectionById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const section = await contentService.getNewArrivalsSectionById(id);

    if (!section) {
      res.status(404).json({ message: "New arrivals section not found" });
      return;
    }

    res.status(200).json(section);
  } catch (error) {
    logger.error(
      `Error in getNewArrivalsSectionById for id ${req.params.id}:`,
      error
    );
    res.status(500).json({
      message: "Failed to fetch new arrivals section",
      error: (error as Error).message,
    });
  }
};

export const createNewArrivalsSection = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const section = await contentService.createNewArrivalsSection(req.body);
    res.status(201).json(section);
  } catch (error) {
    logger.error("Error in createNewArrivalsSection:", error);
    res.status(500).json({
      message: "Failed to create new arrivals section",
      error: (error as Error).message,
    });
  }
};

export const updateNewArrivalsSection = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const section = await contentService.updateNewArrivalsSection(id, req.body);

    if (!section) {
      res.status(404).json({ message: "New arrivals section not found" });
      return;
    }

    res.status(200).json(section);
  } catch (error) {
    logger.error(
      `Error in updateNewArrivalsSection for id ${req.params.id}:`,
      error
    );
    res.status(500).json({
      message: "Failed to update new arrivals section",
      error: (error as Error).message,
    });
  }
};

export const deleteNewArrivalsSection = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    await contentService.deleteNewArrivalsSection(id);
    res.status(204).send();
  } catch (error) {
    logger.error(
      `Error in deleteNewArrivalsSection for id ${req.params.id}:`,
      error
    );
    res.status(500).json({
      message: "Failed to delete new arrivals section",
      error: (error as Error).message,
    });
  }
};

//-----------------------------------------------------------------------------
// Tab controllers
//-----------------------------------------------------------------------------
export const getTabsBySectionId = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { sectionId } = req.params;
    const tabs = await contentService.getTabsBySectionId(sectionId);
    res.status(200).json(tabs);
  } catch (error) {
    logger.error(
      `Error in getTabsBySectionId for sectionId ${req.params.sectionId}:`,
      error
    );
    res.status(500).json({
      message: "Failed to fetch tabs",
      error: (error as Error).message,
    });
  }
};

export const getTabById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const tab = await contentService.getTabById(id);

    if (!tab) {
      res.status(404).json({ message: "Tab not found" });
      return;
    }

    res.status(200).json(tab);
  } catch (error) {
    logger.error(`Error in getTabById for id ${req.params.id}:`, error);
    res.status(500).json({
      message: "Failed to fetch tab",
      error: (error as Error).message,
    });
  }
};

export const createTab = async (req: Request, res: Response): Promise<void> => {
  try {
    const tab = await contentService.createTab(req.body);
    res.status(201).json(tab);
  } catch (error) {
    logger.error("Error in createTab:", error);
    res.status(500).json({
      message: "Failed to create tab",
      error: (error as Error).message,
    });
  }
};

export const updateTab = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const tab = await contentService.updateTab(id, req.body);

    if (!tab) {
      res.status(404).json({ message: "Tab not found" });
      return;
    }

    res.status(200).json(tab);
  } catch (error) {
    logger.error(`Error in updateTab for id ${req.params.id}:`, error);
    res.status(500).json({
      message: "Failed to update tab",
      error: (error as Error).message,
    });
  }
};

export const deleteTab = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await contentService.deleteTab(id);
    res.status(204).send();
  } catch (error) {
    logger.error(`Error in deleteTab for id ${req.params.id}:`, error);
    res.status(500).json({
      message: "Failed to delete tab",
      error: (error as Error).message,
    });
  }
};

//-----------------------------------------------------------------------------
// OfferSection controllers
//-----------------------------------------------------------------------------
export const getAllOfferSections = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { page = "1", limit = "10", isActive, tenantId } = req.query;

    const filters: any = {};
    if (isActive !== undefined) filters.isActive = isActive === "true";
    if (tenantId) filters.tenantId = tenantId as string;

    const sections = await contentService.getAllOfferSections(
      parseInt(page as string, 10),
      parseInt(limit as string, 10),
      filters
    );

    res.status(200).json(sections);
  } catch (error) {
    logger.error("Error in getAllOfferSections:", error);
    res.status(500).json({
      message: "Failed to fetch offer sections",
      error: (error as Error).message,
    });
  }
};

export const getOfferSectionById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const section = await contentService.getOfferSectionById(id);

    if (!section) {
      res.status(404).json({ message: "Offer section not found" });
      return;
    }

    res.status(200).json(section);
  } catch (error) {
    logger.error(
      `Error in getOfferSectionById for id ${req.params.id}:`,
      error
    );
    res.status(500).json({
      message: "Failed to fetch offer section",
      error: (error as Error).message,
    });
  }
};

export const createOfferSection = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const section = await contentService.createOfferSection(req.body);
    res.status(201).json(section);
  } catch (error) {
    logger.error("Error in createOfferSection:", error);
    res.status(500).json({
      message: "Failed to create offer section",
      error: (error as Error).message,
    });
  }
};

export const updateOfferSection = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const section = await contentService.updateOfferSection(id, req.body);

    if (!section) {
      res.status(404).json({ message: "Offer section not found" });
      return;
    }

    res.status(200).json(section);
  } catch (error) {
    logger.error(`Error in updateOfferSection for id ${req.params.id}:`, error);
    res.status(500).json({
      message: "Failed to update offer section",
      error: (error as Error).message,
    });
  }
};

export const deleteOfferSection = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    await contentService.deleteOfferSection(id);
    res.status(204).send();
  } catch (error) {
    logger.error(`Error in deleteOfferSection for id ${req.params.id}:`, error);
    res.status(500).json({
      message: "Failed to delete offer section",
      error: (error as Error).message,
    });
  }
};

//-----------------------------------------------------------------------------
// OfferSectionBanner controllers
//-----------------------------------------------------------------------------
export const getOfferSectionBannerByOfferSectionId = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { offerSectionId } = req.params;
    const banner = await contentService.getOfferSectionBannerByOfferSectionId(
      offerSectionId
    );

    if (!banner) {
      res.status(404).json({ message: "Offer section banner not found" });
      return;
    }

    res.status(200).json(banner);
  } catch (error) {
    logger.error(
      `Error in getOfferSectionBannerByOfferSectionId for offerSectionId ${req.params.offerSectionId}:`,
      error
    );
    res.status(500).json({
      message: "Failed to fetch offer section banner",
      error: (error as Error).message,
    });
  }
};

export const createOfferSectionBanner = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const banner = await contentService.createOfferSectionBanner(req.body);
    res.status(201).json(banner);
  } catch (error) {
    logger.error("Error in createOfferSectionBanner:", error);
    res.status(500).json({
      message: "Failed to create offer section banner",
      error: (error as Error).message,
    });
  }
};

export const updateOfferSectionBanner = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const banner = await contentService.updateOfferSectionBanner(id, req.body);

    if (!banner) {
      res.status(404).json({ message: "Offer section banner not found" });
      return;
    }

    res.status(200).json(banner);
  } catch (error) {
    logger.error(
      `Error in updateOfferSectionBanner for id ${req.params.id}:`,
      error
    );
    res.status(500).json({
      message: "Failed to update offer section banner",
      error: (error as Error).message,
    });
  }
};

export const deleteOfferSectionBanner = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    await contentService.deleteOfferSectionBanner(id);
    res.status(204).send();
  } catch (error) {
    logger.error(
      `Error in deleteOfferSectionBanner for id ${req.params.id}:`,
      error
    );
    res.status(500).json({
      message: "Failed to delete offer section banner",
      error: (error as Error).message,
    });
  }
};

//-----------------------------------------------------------------------------
// Slider controllers
//-----------------------------------------------------------------------------
export const getSlidersByOfferSectionId = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { offerSectionId } = req.params;
    const sliders = await contentService.getSlidersByOfferSectionId(
      offerSectionId
    );
    res.status(200).json(sliders);
  } catch (error) {
    logger.error(
      `Error in getSlidersByOfferSectionId for offerSectionId ${req.params.offerSectionId}:`,
      error
    );
    res.status(500).json({
      message: "Failed to fetch sliders",
      error: (error as Error).message,
    });
  }
};

export const getSliderById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const slider = await contentService.getSliderById(id);

    if (!slider) {
      res.status(404).json({ message: "Slider not found" });
      return;
    }

    res.status(200).json(slider);
  } catch (error) {
    logger.error(`Error in getSliderById for id ${req.params.id}:`, error);
    res.status(500).json({
      message: "Failed to fetch slider",
      error: (error as Error).message,
    });
  }
};

export const createSlider = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const slider = await contentService.createSlider(req.body);
    res.status(201).json(slider);
  } catch (error) {
    logger.error("Error in createSlider:", error);
    res.status(500).json({
      message: "Failed to create slider",
      error: (error as Error).message,
    });
  }
};

export const updateSlider = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const slider = await contentService.updateSlider(id, req.body);

    if (!slider) {
      res.status(404).json({ message: "Slider not found" });
      return;
    }

    res.status(200).json(slider);
  } catch (error) {
    logger.error(`Error in updateSlider for id ${req.params.id}:`, error);
    res.status(500).json({
      message: "Failed to update slider",
      error: (error as Error).message,
    });
  }
};

export const deleteSlider = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    await contentService.deleteSlider(id);
    res.status(204).send();
  } catch (error) {
    logger.error(`Error in deleteSlider for id ${req.params.id}:`, error);
    res.status(500).json({
      message: "Failed to delete slider",
      error: (error as Error).message,
    });
  }
};

//-----------------------------------------------------------------------------
// MenuItemsOnSliders controllers
//-----------------------------------------------------------------------------
export const assignMenuItemToSlider = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { sliderId } = req.params;
    const { menuItemId, order } = req.body;

    const assignment = await contentService.assignMenuItemToSlider(
      sliderId,
      menuItemId,
      order
    );
    res.status(201).json(assignment);
  } catch (error) {
    logger.error(
      `Error in assignMenuItemToSlider for sliderId ${req.params.sliderId}:`,
      error
    );
    res.status(500).json({
      message: "Failed to assign menu item to slider",
      error: (error as Error).message,
    });
  }
};

export const updateMenuItemOnSlider = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { sliderId, menuItemId } = req.params;
    const assignment = await contentService.updateMenuItemOnSlider(
      sliderId,
      menuItemId,
      req.body
    );

    if (!assignment) {
      res.status(404).json({ message: "Menu item assignment not found" });
      return;
    }

    res.status(200).json(assignment);
  } catch (error) {
    logger.error(
      `Error in updateMenuItemOnSlider for sliderId ${req.params.sliderId} and menuItemId ${req.params.menuItemId}:`,
      error
    );
    res.status(500).json({
      message: "Failed to update menu item on slider",
      error: (error as Error).message,
    });
  }
};

export const removeMenuItemFromSlider = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { sliderId, menuItemId } = req.params;
    await contentService.removeMenuItemFromSlider(sliderId, menuItemId);
    res.status(204).send();
  } catch (error) {
    logger.error(
      `Error in removeMenuItemFromSlider for sliderId ${req.params.sliderId} and menuItemId ${req.params.menuItemId}:`,
      error
    );
    res.status(500).json({
      message: "Failed to remove menu item from slider",
      error: (error as Error).message,
    });
  }
};
