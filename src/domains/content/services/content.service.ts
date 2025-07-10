import * as contentRepository from "../repositories/content.repository";
import logger from "../../../utils/logger";

//-----------------------------------------------------------------------------
// HeroSlider services
//-----------------------------------------------------------------------------
export const getAllHeroSliders = async (page = 1, limit = 10, filters = {}) => {
  try {
    return await contentRepository.findAllHeroSliders(page, limit, filters);
  } catch (error) {
    logger.error("Service error in getAllHeroSliders:", error);
    throw error;
  }
};

export const getHeroSliderById = async (id: string) => {
  try {
    return await contentRepository.findHeroSliderById(id);
  } catch (error) {
    logger.error(`Service error in getHeroSliderById for id ${id}:`, error);
    throw error;
  }
};

export const createHeroSlider = async (data: any) => {
  try {
    // Handle date parsing
    if (data.startDate) {
      data.startDate = new Date(data.startDate);
    }
    if (data.endDate) {
      data.endDate = new Date(data.endDate);
    }

    // Validate date range
    if (data.startDate && data.endDate && data.startDate >= data.endDate) {
      throw new Error("Start date must be before end date");
    }

    return await contentRepository.createHeroSlider(data);
  } catch (error) {
    logger.error("Service error in createHeroSlider:", error);
    throw error;
  }
};

export const updateHeroSlider = async (id: string, data: any) => {
  try {
    // Handle date parsing
    if (data.startDate) {
      data.startDate = new Date(data.startDate);
    }
    if (data.endDate) {
      data.endDate = new Date(data.endDate);
    }

    // Validate date range
    if (data.startDate && data.endDate && data.startDate >= data.endDate) {
      throw new Error("Start date must be before end date");
    }

    return await contentRepository.updateHeroSlider(id, data);
  } catch (error) {
    logger.error(`Service error in updateHeroSlider for id ${id}:`, error);
    throw error;
  }
};

export const deleteHeroSlider = async (id: string) => {
  try {
    return await contentRepository.deleteHeroSlider(id);
  } catch (error) {
    logger.error(`Service error in deleteHeroSlider for id ${id}:`, error);
    throw error;
  }
};

//-----------------------------------------------------------------------------
// DealSection services
//-----------------------------------------------------------------------------
export const getAllDealSections = async (
  page = 1,
  limit = 10,
  filters = {}
) => {
  try {
    return await contentRepository.findAllDealSections(page, limit, filters);
  } catch (error) {
    logger.error("Service error in getAllDealSections:", error);
    throw error;
  }
};

export const getDealSectionById = async (id: string) => {
  try {
    return await contentRepository.findDealSectionById(id);
  } catch (error) {
    logger.error(`Service error in getDealSectionById for id ${id}:`, error);
    throw error;
  }
};

export const createDealSection = async (data: any) => {
  try {
    // Handle date parsing
    if (data.startDate) {
      data.startDate = new Date(data.startDate);
    }
    if (data.endDate) {
      data.endDate = new Date(data.endDate);
    }

    // Validate timer values
    if (data.timerDays !== undefined && data.timerDays < 0) {
      throw new Error("Timer days cannot be negative");
    }
    if (
      data.timerHours !== undefined &&
      (data.timerHours < 0 || data.timerHours > 23)
    ) {
      throw new Error("Timer hours must be between 0 and 23");
    }
    if (
      data.timerMinutes !== undefined &&
      (data.timerMinutes < 0 || data.timerMinutes > 59)
    ) {
      throw new Error("Timer minutes must be between 0 and 59");
    }

    return await contentRepository.createDealSection(data);
  } catch (error) {
    logger.error("Service error in createDealSection:", error);
    throw error;
  }
};

export const updateDealSection = async (id: string, data: any) => {
  try {
    // Handle date parsing
    if (data.startDate) {
      data.startDate = new Date(data.startDate);
    }
    if (data.endDate) {
      data.endDate = new Date(data.endDate);
    }

    // Validate timer values
    if (data.timerDays !== undefined && data.timerDays < 0) {
      throw new Error("Timer days cannot be negative");
    }
    if (
      data.timerHours !== undefined &&
      (data.timerHours < 0 || data.timerHours > 23)
    ) {
      throw new Error("Timer hours must be between 0 and 23");
    }
    if (
      data.timerMinutes !== undefined &&
      (data.timerMinutes < 0 || data.timerMinutes > 59)
    ) {
      throw new Error("Timer minutes must be between 0 and 59");
    }

    return await contentRepository.updateDealSection(id, data);
  } catch (error) {
    logger.error(`Service error in updateDealSection for id ${id}:`, error);
    throw error;
  }
};

export const deleteDealSection = async (id: string) => {
  try {
    return await contentRepository.deleteDealSection(id);
  } catch (error) {
    logger.error(`Service error in deleteDealSection for id ${id}:`, error);
    throw error;
  }
};

//-----------------------------------------------------------------------------
// Banner services
//-----------------------------------------------------------------------------
export const getAllBanners = async (page = 1, limit = 10, filters = {}) => {
  try {
    return await contentRepository.findAllBanners(page, limit, filters);
  } catch (error) {
    logger.error("Service error in getAllBanners:", error);
    throw error;
  }
};

export const getBannerById = async (id: string) => {
  try {
    return await contentRepository.findBannerById(id);
  } catch (error) {
    logger.error(`Service error in getBannerById for id ${id}:`, error);
    throw error;
  }
};

export const createBanner = async (data: any) => {
  try {
    // Handle date parsing
    if (data.startDate) {
      data.startDate = new Date(data.startDate);
    }
    if (data.endDate) {
      data.endDate = new Date(data.endDate);
    }

    return await contentRepository.createBanner(data);
  } catch (error) {
    logger.error("Service error in createBanner:", error);
    throw error;
  }
};

export const updateBanner = async (id: string, data: any) => {
  try {
    // Handle date parsing
    if (data.startDate) {
      data.startDate = new Date(data.startDate);
    }
    if (data.endDate) {
      data.endDate = new Date(data.endDate);
    }

    return await contentRepository.updateBanner(id, data);
  } catch (error) {
    logger.error(`Service error in updateBanner for id ${id}:`, error);
    throw error;
  }
};

export const deleteBanner = async (id: string) => {
  try {
    return await contentRepository.deleteBanner(id);
  } catch (error) {
    logger.error(`Service error in deleteBanner for id ${id}:`, error);
    throw error;
  }
};

//-----------------------------------------------------------------------------
// OfferBanner services
//-----------------------------------------------------------------------------
export const getAllOfferBanners = async (
  page = 1,
  limit = 10,
  filters = {}
) => {
  try {
    return await contentRepository.findAllOfferBanners(page, limit, filters);
  } catch (error) {
    logger.error("Service error in getAllOfferBanners:", error);
    throw error;
  }
};

export const getOfferBannerById = async (id: string) => {
  try {
    return await contentRepository.findOfferBannerById(id);
  } catch (error) {
    logger.error(`Service error in getOfferBannerById for id ${id}:`, error);
    throw error;
  }
};

export const createOfferBanner = async (data: any) => {
  try {
    // Handle date parsing
    if (data.startDate) {
      data.startDate = new Date(data.startDate);
    }
    if (data.endDate) {
      data.endDate = new Date(data.endDate);
    }

    return await contentRepository.createOfferBanner(data);
  } catch (error) {
    logger.error("Service error in createOfferBanner:", error);
    throw error;
  }
};

export const updateOfferBanner = async (id: string, data: any) => {
  try {
    // Handle date parsing
    if (data.startDate) {
      data.startDate = new Date(data.startDate);
    }
    if (data.endDate) {
      data.endDate = new Date(data.endDate);
    }

    return await contentRepository.updateOfferBanner(id, data);
  } catch (error) {
    logger.error(`Service error in updateOfferBanner for id ${id}:`, error);
    throw error;
  }
};

export const deleteOfferBanner = async (id: string) => {
  try {
    return await contentRepository.deleteOfferBanner(id);
  } catch (error) {
    logger.error(`Service error in deleteOfferBanner for id ${id}:`, error);
    throw error;
  }
};

//-----------------------------------------------------------------------------
// NewArrivalsSection services
//-----------------------------------------------------------------------------
export const getAllNewArrivalsSections = async (
  page = 1,
  limit = 10,
  filters = {}
) => {
  try {
    return await contentRepository.findAllNewArrivalsSections(
      page,
      limit,
      filters
    );
  } catch (error) {
    logger.error("Service error in getAllNewArrivalsSections:", error);
    throw error;
  }
};

export const getNewArrivalsSectionById = async (id: string) => {
  try {
    return await contentRepository.findNewArrivalsSectionById(id);
  } catch (error) {
    logger.error(
      `Service error in getNewArrivalsSectionById for id ${id}:`,
      error
    );
    throw error;
  }
};

export const createNewArrivalsSection = async (data: any) => {
  try {
    return await contentRepository.createNewArrivalsSection(data);
  } catch (error) {
    logger.error("Service error in createNewArrivalsSection:", error);
    throw error;
  }
};

export const updateNewArrivalsSection = async (id: string, data: any) => {
  try {
    return await contentRepository.updateNewArrivalsSection(id, data);
  } catch (error) {
    logger.error(
      `Service error in updateNewArrivalsSection for id ${id}:`,
      error
    );
    throw error;
  }
};

export const deleteNewArrivalsSection = async (id: string) => {
  try {
    return await contentRepository.deleteNewArrivalsSection(id);
  } catch (error) {
    logger.error(
      `Service error in deleteNewArrivalsSection for id ${id}:`,
      error
    );
    throw error;
  }
};

//-----------------------------------------------------------------------------
// Tab services
//-----------------------------------------------------------------------------
export const getTabsBySectionId = async (sectionId: string) => {
  try {
    return await contentRepository.findTabsBySectionId(sectionId);
  } catch (error) {
    logger.error(
      `Service error in getTabsBySectionId for sectionId ${sectionId}:`,
      error
    );
    throw error;
  }
};

export const getTabById = async (id: string) => {
  try {
    return await contentRepository.findTabById(id);
  } catch (error) {
    logger.error(`Service error in getTabById for id ${id}:`, error);
    throw error;
  }
};

export const createTab = async (data: any) => {
  try {
    // Verify section exists
    const section = await contentRepository.findNewArrivalsSectionById(
      data.sectionId
    );
    if (!section) {
      throw new Error(
        `New arrivals section with ID ${data.sectionId} not found`
      );
    }

    return await contentRepository.createTab(data);
  } catch (error) {
    logger.error("Service error in createTab:", error);
    throw error;
  }
};

export const updateTab = async (id: string, data: any) => {
  try {
    return await contentRepository.updateTab(id, data);
  } catch (error) {
    logger.error(`Service error in updateTab for id ${id}:`, error);
    throw error;
  }
};

export const deleteTab = async (id: string) => {
  try {
    return await contentRepository.deleteTab(id);
  } catch (error) {
    logger.error(`Service error in deleteTab for id ${id}:`, error);
    throw error;
  }
};

//-----------------------------------------------------------------------------
// OfferSection services
//-----------------------------------------------------------------------------
export const getAllOfferSections = async (
  page = 1,
  limit = 10,
  filters = {}
) => {
  try {
    return await contentRepository.findAllOfferSections(page, limit, filters);
  } catch (error) {
    logger.error("Service error in getAllOfferSections:", error);
    throw error;
  }
};

export const getOfferSectionById = async (id: string) => {
  try {
    return await contentRepository.findOfferSectionById(id);
  } catch (error) {
    logger.error(`Service error in getOfferSectionById for id ${id}:`, error);
    throw error;
  }
};

export const createOfferSection = async (data: any) => {
  try {
    return await contentRepository.createOfferSection(data);
  } catch (error) {
    logger.error("Service error in createOfferSection:", error);
    throw error;
  }
};

export const updateOfferSection = async (id: string, data: any) => {
  try {
    return await contentRepository.updateOfferSection(id, data);
  } catch (error) {
    logger.error(`Service error in updateOfferSection for id ${id}:`, error);
    throw error;
  }
};

export const deleteOfferSection = async (id: string) => {
  try {
    return await contentRepository.deleteOfferSection(id);
  } catch (error) {
    logger.error(`Service error in deleteOfferSection for id ${id}:`, error);
    throw error;
  }
};

//-----------------------------------------------------------------------------
// OfferSectionBanner services
//-----------------------------------------------------------------------------
export const getOfferSectionBannerByOfferSectionId = async (
  offerSectionId: string
) => {
  try {
    return await contentRepository.findOfferSectionBannerByOfferSectionId(
      offerSectionId
    );
  } catch (error) {
    logger.error(
      `Service error in getOfferSectionBannerByOfferSectionId for offerSectionId ${offerSectionId}:`,
      error
    );
    throw error;
  }
};

export const createOfferSectionBanner = async (data: any) => {
  try {
    // Verify offer section exists
    const offerSection = await contentRepository.findOfferSectionById(
      data.offerSectionId
    );
    if (!offerSection) {
      throw new Error(`Offer section with ID ${data.offerSectionId} not found`);
    }

    return await contentRepository.createOfferSectionBanner(data);
  } catch (error) {
    logger.error("Service error in createOfferSectionBanner:", error);
    throw error;
  }
};

export const updateOfferSectionBanner = async (id: string, data: any) => {
  try {
    return await contentRepository.updateOfferSectionBanner(id, data);
  } catch (error) {
    logger.error(
      `Service error in updateOfferSectionBanner for id ${id}:`,
      error
    );
    throw error;
  }
};

export const deleteOfferSectionBanner = async (id: string) => {
  try {
    return await contentRepository.deleteOfferSectionBanner(id);
  } catch (error) {
    logger.error(
      `Service error in deleteOfferSectionBanner for id ${id}:`,
      error
    );
    throw error;
  }
};

//-----------------------------------------------------------------------------
// Slider services
//-----------------------------------------------------------------------------
export const getSlidersByOfferSectionId = async (offerSectionId: string) => {
  try {
    return await contentRepository.findSlidersByOfferSectionId(offerSectionId);
  } catch (error) {
    logger.error(
      `Service error in getSlidersByOfferSectionId for offerSectionId ${offerSectionId}:`,
      error
    );
    throw error;
  }
};

export const getSliderById = async (id: string) => {
  try {
    return await contentRepository.findSliderById(id);
  } catch (error) {
    logger.error(`Service error in getSliderById for id ${id}:`, error);
    throw error;
  }
};

export const createSlider = async (data: any) => {
  try {
    // Verify offer section exists
    const offerSection = await contentRepository.findOfferSectionById(
      data.offerSectionId
    );
    if (!offerSection) {
      throw new Error(`Offer section with ID ${data.offerSectionId} not found`);
    }

    return await contentRepository.createSlider(data);
  } catch (error) {
    logger.error("Service error in createSlider:", error);
    throw error;
  }
};

export const updateSlider = async (id: string, data: any) => {
  try {
    return await contentRepository.updateSlider(id, data);
  } catch (error) {
    logger.error(`Service error in updateSlider for id ${id}:`, error);
    throw error;
  }
};

export const deleteSlider = async (id: string) => {
  try {
    return await contentRepository.deleteSlider(id);
  } catch (error) {
    logger.error(`Service error in deleteSlider for id ${id}:`, error);
    throw error;
  }
};

//-----------------------------------------------------------------------------
// MenuItemsOnSliders services
//-----------------------------------------------------------------------------
export const assignMenuItemToSlider = async (
  sliderId: string,
  menuItemId: string,
  order?: number
) => {
  try {
    return await contentRepository.assignMenuItemToSlider(
      sliderId,
      menuItemId,
      order
    );
  } catch (error) {
    logger.error(
      `Service error in assignMenuItemToSlider for sliderId ${sliderId} and menuItemId ${menuItemId}:`,
      error
    );
    throw error;
  }
};

export const updateMenuItemOnSlider = async (
  sliderId: string,
  menuItemId: string,
  data: any
) => {
  try {
    return await contentRepository.updateMenuItemOnSlider(
      sliderId,
      menuItemId,
      data
    );
  } catch (error) {
    logger.error(
      `Service error in updateMenuItemOnSlider for sliderId ${sliderId} and menuItemId ${menuItemId}:`,
      error
    );
    throw error;
  }
};

export const removeMenuItemFromSlider = async (
  sliderId: string,
  menuItemId: string
) => {
  try {
    return await contentRepository.removeMenuItemFromSlider(
      sliderId,
      menuItemId
    );
  } catch (error) {
    logger.error(
      `Service error in removeMenuItemFromSlider for sliderId ${sliderId} and menuItemId ${menuItemId}:`,
      error
    );
    throw error;
  }
};
