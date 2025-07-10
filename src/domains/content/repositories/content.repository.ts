import { PrismaClient } from "../../../../prisma/generated/prisma";
import logger from "../../../utils/logger";

const prisma = new PrismaClient();

// Helper function for pagination
const getPagination = (page: number, limit: number) => {
  const skip = (page - 1) * limit;
  return { skip, take: limit };
};

//-----------------------------------------------------------------------------
// HeroSlider repositories
//-----------------------------------------------------------------------------
export const findAllHeroSliders = async (
  page = 1,
  limit = 10,
  filters: any = {}
) => {
  try {
    const { skip, take } = getPagination(page, limit);

    const where: any = {};

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.tenantId) {
      where.tenantId = filters.tenantId;
    }

    // Handle date range filtering
    const now = new Date();
    if (filters.activeOnly) {
      where.isActive = true;
      where.OR = [
        { startDate: null, endDate: null },
        { startDate: { lte: now }, endDate: { gte: now } },
        { startDate: { lte: now }, endDate: null },
        { startDate: null, endDate: { gte: now } },
      ];
    }

    const total = await prisma.heroSlider.count({ where });

    const sliders = await prisma.heroSlider.findMany({
      where,
      orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
      skip,
      take,
    });

    return {
      data: sliders,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error("Repository error in findAllHeroSliders:", error);
    throw error;
  }
};

export const findHeroSliderById = async (id: string) => {
  try {
    return await prisma.heroSlider.findUnique({
      where: { id },
    });
  } catch (error) {
    logger.error(`Repository error in findHeroSliderById for id ${id}:`, error);
    throw error;
  }
};

export const createHeroSlider = async (data: any) => {
  try {
    return await prisma.heroSlider.create({
      data,
    });
  } catch (error) {
    logger.error("Repository error in createHeroSlider:", error);
    throw error;
  }
};

export const updateHeroSlider = async (id: string, data: any) => {
  try {
    return await prisma.heroSlider.update({
      where: { id },
      data,
    });
  } catch (error) {
    logger.error(`Repository error in updateHeroSlider for id ${id}:`, error);
    throw error;
  }
};

export const deleteHeroSlider = async (id: string) => {
  try {
    return await prisma.heroSlider.delete({
      where: { id },
    });
  } catch (error) {
    logger.error(`Repository error in deleteHeroSlider for id ${id}:`, error);
    throw error;
  }
};

//-----------------------------------------------------------------------------
// DealSection repositories
//-----------------------------------------------------------------------------
export const findAllDealSections = async (
  page = 1,
  limit = 10,
  filters: any = {}
) => {
  try {
    const { skip, take } = getPagination(page, limit);

    const where: any = {};

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.tenantId) {
      where.tenantId = filters.tenantId;
    }

    const total = await prisma.dealSection.count({ where });

    const dealSections = await prisma.dealSection.findMany({
      where,
      include: {
        menuItems: {
          include: {
            images: {
              where: { isPrimary: true },
              take: 1,
            },
            category: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    });

    return {
      data: dealSections,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error("Repository error in findAllDealSections:", error);
    throw error;
  }
};

export const findDealSectionById = async (id: string) => {
  try {
    return await prisma.dealSection.findUnique({
      where: { id },
      include: {
        menuItems: {
          include: {
            images: {
              where: { isPrimary: true },
              take: 1,
            },
            category: {
              select: { name: true },
            },
          },
        },
      },
    });
  } catch (error) {
    logger.error(
      `Repository error in findDealSectionById for id ${id}:`,
      error
    );
    throw error;
  }
};

export const createDealSection = async (data: any) => {
  try {
    return await prisma.dealSection.create({
      data,
    });
  } catch (error) {
    logger.error("Repository error in createDealSection:", error);
    throw error;
  }
};

export const updateDealSection = async (id: string, data: any) => {
  try {
    return await prisma.dealSection.update({
      where: { id },
      data,
    });
  } catch (error) {
    logger.error(`Repository error in updateDealSection for id ${id}:`, error);
    throw error;
  }
};

export const deleteDealSection = async (id: string) => {
  try {
    return await prisma.dealSection.delete({
      where: { id },
    });
  } catch (error) {
    logger.error(`Repository error in deleteDealSection for id ${id}:`, error);
    throw error;
  }
};

//-----------------------------------------------------------------------------
// Banner repositories
//-----------------------------------------------------------------------------
export const findAllBanners = async (
  page = 1,
  limit = 10,
  filters: any = {}
) => {
  try {
    const { skip, take } = getPagination(page, limit);

    const where: any = {};

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.tenantId) {
      where.tenantId = filters.tenantId;
    }

    const total = await prisma.banner.count({ where });

    const banners = await prisma.banner.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
    });

    return {
      data: banners,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error("Repository error in findAllBanners:", error);
    throw error;
  }
};

export const findBannerById = async (id: string) => {
  try {
    return await prisma.banner.findUnique({
      where: { id },
    });
  } catch (error) {
    logger.error(`Repository error in findBannerById for id ${id}:`, error);
    throw error;
  }
};

export const createBanner = async (data: any) => {
  try {
    return await prisma.banner.create({
      data,
    });
  } catch (error) {
    logger.error("Repository error in createBanner:", error);
    throw error;
  }
};

export const updateBanner = async (id: string, data: any) => {
  try {
    return await prisma.banner.update({
      where: { id },
      data,
    });
  } catch (error) {
    logger.error(`Repository error in updateBanner for id ${id}:`, error);
    throw error;
  }
};

export const deleteBanner = async (id: string) => {
  try {
    return await prisma.banner.delete({
      where: { id },
    });
  } catch (error) {
    logger.error(`Repository error in deleteBanner for id ${id}:`, error);
    throw error;
  }
};

//-----------------------------------------------------------------------------
// OfferBanner repositories
//-----------------------------------------------------------------------------
export const findAllOfferBanners = async (
  page = 1,
  limit = 10,
  filters: any = {}
) => {
  try {
    const { skip, take } = getPagination(page, limit);

    const where: any = {};

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.tenantId) {
      where.tenantId = filters.tenantId;
    }

    const total = await prisma.offerBanner.count({ where });

    const offerBanners = await prisma.offerBanner.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
    });

    return {
      data: offerBanners,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error("Repository error in findAllOfferBanners:", error);
    throw error;
  }
};

export const findOfferBannerById = async (id: string) => {
  try {
    return await prisma.offerBanner.findUnique({
      where: { id },
    });
  } catch (error) {
    logger.error(
      `Repository error in findOfferBannerById for id ${id}:`,
      error
    );
    throw error;
  }
};

export const createOfferBanner = async (data: any) => {
  try {
    return await prisma.offerBanner.create({
      data,
    });
  } catch (error) {
    logger.error("Repository error in createOfferBanner:", error);
    throw error;
  }
};

export const updateOfferBanner = async (id: string, data: any) => {
  try {
    return await prisma.offerBanner.update({
      where: { id },
      data,
    });
  } catch (error) {
    logger.error(`Repository error in updateOfferBanner for id ${id}:`, error);
    throw error;
  }
};

export const deleteOfferBanner = async (id: string) => {
  try {
    return await prisma.offerBanner.delete({
      where: { id },
    });
  } catch (error) {
    logger.error(`Repository error in deleteOfferBanner for id ${id}:`, error);
    throw error;
  }
};

//-----------------------------------------------------------------------------
// NewArrivalsSection repositories
//-----------------------------------------------------------------------------
export const findAllNewArrivalsSections = async (
  page = 1,
  limit = 10,
  filters: any = {}
) => {
  try {
    const { skip, take } = getPagination(page, limit);

    const where: any = {};

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.tenantId) {
      where.tenantId = filters.tenantId;
    }

    const total = await prisma.newArrivalsSection.count({ where });

    const sections = await prisma.newArrivalsSection.findMany({
      where,
      include: {
        tabs: {
          where: { isActive: true },
          orderBy: { order: "asc" },
          include: {
            menuItems: {
              include: {
                images: {
                  where: { isPrimary: true },
                  take: 1,
                },
              },
            },
          },
        },
        menuItems: {
          include: {
            images: {
              where: { isPrimary: true },
              take: 1,
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    });

    return {
      data: sections,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error("Repository error in findAllNewArrivalsSections:", error);
    throw error;
  }
};

export const findNewArrivalsSectionById = async (id: string) => {
  try {
    return await prisma.newArrivalsSection.findUnique({
      where: { id },
      include: {
        tabs: {
          where: { isActive: true },
          orderBy: { order: "asc" },
          include: {
            menuItems: {
              include: {
                images: {
                  where: { isPrimary: true },
                  take: 1,
                },
              },
            },
          },
        },
        menuItems: {
          include: {
            images: {
              where: { isPrimary: true },
              take: 1,
            },
          },
        },
      },
    });
  } catch (error) {
    logger.error(
      `Repository error in findNewArrivalsSectionById for id ${id}:`,
      error
    );
    throw error;
  }
};

export const createNewArrivalsSection = async (data: any) => {
  try {
    return await prisma.newArrivalsSection.create({
      data,
    });
  } catch (error) {
    logger.error("Repository error in createNewArrivalsSection:", error);
    throw error;
  }
};

export const updateNewArrivalsSection = async (id: string, data: any) => {
  try {
    return await prisma.newArrivalsSection.update({
      where: { id },
      data,
    });
  } catch (error) {
    logger.error(
      `Repository error in updateNewArrivalsSection for id ${id}:`,
      error
    );
    throw error;
  }
};

export const deleteNewArrivalsSection = async (id: string) => {
  try {
    return await prisma.newArrivalsSection.delete({
      where: { id },
    });
  } catch (error) {
    logger.error(
      `Repository error in deleteNewArrivalsSection for id ${id}:`,
      error
    );
    throw error;
  }
};

//-----------------------------------------------------------------------------
// Tab repositories
//-----------------------------------------------------------------------------
export const findTabsBySectionId = async (sectionId: string) => {
  try {
    return await prisma.tab.findMany({
      where: {
        sectionId,
        isActive: true,
      },
      include: {
        menuItems: {
          include: {
            images: {
              where: { isPrimary: true },
              take: 1,
            },
          },
        },
      },
      orderBy: { order: "asc" },
    });
  } catch (error) {
    logger.error(
      `Repository error in findTabsBySectionId for sectionId ${sectionId}:`,
      error
    );
    throw error;
  }
};

export const findTabById = async (id: string) => {
  try {
    return await prisma.tab.findUnique({
      where: { id },
      include: {
        section: true,
        menuItems: {
          include: {
            images: {
              where: { isPrimary: true },
              take: 1,
            },
          },
        },
      },
    });
  } catch (error) {
    logger.error(`Repository error in findTabById for id ${id}:`, error);
    throw error;
  }
};

export const createTab = async (data: any) => {
  try {
    return await prisma.tab.create({
      data,
      include: {
        section: true,
      },
    });
  } catch (error) {
    logger.error("Repository error in createTab:", error);
    throw error;
  }
};

export const updateTab = async (id: string, data: any) => {
  try {
    return await prisma.tab.update({
      where: { id },
      data,
      include: {
        section: true,
      },
    });
  } catch (error) {
    logger.error(`Repository error in updateTab for id ${id}:`, error);
    throw error;
  }
};

export const deleteTab = async (id: string) => {
  try {
    return await prisma.tab.delete({
      where: { id },
    });
  } catch (error) {
    logger.error(`Repository error in deleteTab for id ${id}:`, error);
    throw error;
  }
};

//-----------------------------------------------------------------------------
// OfferSection repositories
//-----------------------------------------------------------------------------
export const findAllOfferSections = async (
  page = 1,
  limit = 10,
  filters: any = {}
) => {
  try {
    const { skip, take } = getPagination(page, limit);

    const where: any = {};

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.tenantId) {
      where.tenantId = filters.tenantId;
    }

    const total = await prisma.offerSection.count({ where });

    const sections = await prisma.offerSection.findMany({
      where,
      include: {
        banner: true,
        sliders: {
          where: { isActive: true },
          orderBy: { displayOrder: "asc" },
          include: {
            menuItems: {
              include: {
                menuItem: {
                  include: {
                    images: {
                      where: { isPrimary: true },
                      take: 1,
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    });

    return {
      data: sections,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error("Repository error in findAllOfferSections:", error);
    throw error;
  }
};

export const findOfferSectionById = async (id: string) => {
  try {
    return await prisma.offerSection.findUnique({
      where: { id },
      include: {
        banner: true,
        sliders: {
          where: { isActive: true },
          orderBy: { displayOrder: "asc" },
          include: {
            menuItems: {
              include: {
                menuItem: {
                  include: {
                    images: {
                      where: { isPrimary: true },
                      take: 1,
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
  } catch (error) {
    logger.error(
      `Repository error in findOfferSectionById for id ${id}:`,
      error
    );
    throw error;
  }
};

export const createOfferSection = async (data: any) => {
  try {
    return await prisma.offerSection.create({
      data,
    });
  } catch (error) {
    logger.error("Repository error in createOfferSection:", error);
    throw error;
  }
};

export const updateOfferSection = async (id: string, data: any) => {
  try {
    return await prisma.offerSection.update({
      where: { id },
      data,
    });
  } catch (error) {
    logger.error(`Repository error in updateOfferSection for id ${id}:`, error);
    throw error;
  }
};

export const deleteOfferSection = async (id: string) => {
  try {
    return await prisma.offerSection.delete({
      where: { id },
    });
  } catch (error) {
    logger.error(`Repository error in deleteOfferSection for id ${id}:`, error);
    throw error;
  }
};

//-----------------------------------------------------------------------------
// OfferSectionBanner repositories
//-----------------------------------------------------------------------------
export const findOfferSectionBannerByOfferSectionId = async (
  offerSectionId: string
) => {
  try {
    return await prisma.offerSectionBanner.findUnique({
      where: { offerSectionId },
      include: {
        offerSection: true,
      },
    });
  } catch (error) {
    logger.error(
      `Repository error in findOfferSectionBannerByOfferSectionId for offerSectionId ${offerSectionId}:`,
      error
    );
    throw error;
  }
};

export const createOfferSectionBanner = async (data: any) => {
  try {
    return await prisma.offerSectionBanner.create({
      data,
      include: {
        offerSection: true,
      },
    });
  } catch (error) {
    logger.error("Repository error in createOfferSectionBanner:", error);
    throw error;
  }
};

export const updateOfferSectionBanner = async (id: string, data: any) => {
  try {
    return await prisma.offerSectionBanner.update({
      where: { id },
      data,
      include: {
        offerSection: true,
      },
    });
  } catch (error) {
    logger.error(
      `Repository error in updateOfferSectionBanner for id ${id}:`,
      error
    );
    throw error;
  }
};

export const deleteOfferSectionBanner = async (id: string) => {
  try {
    return await prisma.offerSectionBanner.delete({
      where: { id },
    });
  } catch (error) {
    logger.error(
      `Repository error in deleteOfferSectionBanner for id ${id}:`,
      error
    );
    throw error;
  }
};

//-----------------------------------------------------------------------------
// Slider repositories
//-----------------------------------------------------------------------------
export const findSlidersByOfferSectionId = async (offerSectionId: string) => {
  try {
    return await prisma.slider.findMany({
      where: {
        offerSectionId,
        isActive: true,
      },
      include: {
        menuItems: {
          include: {
            menuItem: {
              include: {
                images: {
                  where: { isPrimary: true },
                  take: 1,
                },
              },
            },
          },
        },
      },
      orderBy: { displayOrder: "asc" },
    });
  } catch (error) {
    logger.error(
      `Repository error in findSlidersByOfferSectionId for offerSectionId ${offerSectionId}:`,
      error
    );
    throw error;
  }
};

export const findSliderById = async (id: string) => {
  try {
    return await prisma.slider.findUnique({
      where: { id },
      include: {
        offerSection: true,
        menuItems: {
          include: {
            menuItem: {
              include: {
                images: {
                  where: { isPrimary: true },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });
  } catch (error) {
    logger.error(`Repository error in findSliderById for id ${id}:`, error);
    throw error;
  }
};

export const createSlider = async (data: any) => {
  try {
    return await prisma.slider.create({
      data,
      include: {
        offerSection: true,
      },
    });
  } catch (error) {
    logger.error("Repository error in createSlider:", error);
    throw error;
  }
};

export const updateSlider = async (id: string, data: any) => {
  try {
    return await prisma.slider.update({
      where: { id },
      data,
      include: {
        offerSection: true,
      },
    });
  } catch (error) {
    logger.error(`Repository error in updateSlider for id ${id}:`, error);
    throw error;
  }
};

export const deleteSlider = async (id: string) => {
  try {
    return await prisma.slider.delete({
      where: { id },
    });
  } catch (error) {
    logger.error(`Repository error in deleteSlider for id ${id}:`, error);
    throw error;
  }
};

//-----------------------------------------------------------------------------
// MenuItemsOnSliders repositories
//-----------------------------------------------------------------------------
export const assignMenuItemToSlider = async (
  sliderId: string,
  menuItemId: string,
  order?: number
) => {
  try {
    return await prisma.menuItemsOnSliders.create({
      data: {
        sliderId,
        menuItemId,
        order,
        assignedAt: new Date(),
      },
      include: {
        menuItem: {
          include: {
            images: {
              where: { isPrimary: true },
              take: 1,
            },
          },
        },
      },
    });
  } catch (error) {
    logger.error(
      `Repository error in assignMenuItemToSlider for sliderId ${sliderId} and menuItemId ${menuItemId}:`,
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
    return await prisma.menuItemsOnSliders.update({
      where: {
        menuItemId_sliderId: {
          menuItemId,
          sliderId,
        },
      },
      data,
      include: {
        menuItem: {
          include: {
            images: {
              where: { isPrimary: true },
              take: 1,
            },
          },
        },
      },
    });
  } catch (error) {
    logger.error(
      `Repository error in updateMenuItemOnSlider for sliderId ${sliderId} and menuItemId ${menuItemId}:`,
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
    return await prisma.menuItemsOnSliders.delete({
      where: {
        menuItemId_sliderId: {
          menuItemId,
          sliderId,
        },
      },
    });
  } catch (error) {
    logger.error(
      `Repository error in removeMenuItemFromSlider for sliderId ${sliderId} and menuItemId ${menuItemId}:`,
      error
    );
    throw error;
  }
};
