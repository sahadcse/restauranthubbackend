import { Request, Response } from "express";
import mediaService from "../services/media.service";
import logger from "../../../utils/logger";
import AppError from "../../../utils/AppError";

/**
 * Controller for handling media file uploads to Cloudinary
 * @param req Express request with file buffer
 * @param res Express response
 */
export const uploadFile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Verify that file exists in request
    if (!req.file) {
      throw new AppError("No file provided", 400);
    }

    // Extract file metadata
    const { originalname, mimetype, buffer } = req.file;

    // Set folder path within restaurant_hub folder
    let folder = "restaurant_hub/uploads";
    if (mimetype.startsWith("image/")) {
      folder = "restaurant_hub/images";
    } else if (mimetype.startsWith("video/")) {
      folder = "restaurant_hub/videos";
    }

    // Extract file extension
    const fileExtension = originalname.split(".").pop()?.toLowerCase();

    // Create a unique filename
    const uniqueFileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;

    // Set resource type based on mimetype
    const resourceType = mimetype.startsWith("image/")
      ? "image"
      : mimetype.startsWith("video/")
      ? "video"
      : "auto";

    console.log("Uploading file to Cloudinary...");
    // Upload file to Cloudinary
    const result = await mediaService.uploadFile(buffer, {
      folder,
      resource_type: resourceType as "image" | "video" | "raw" | "auto",
      public_id: uniqueFileName,
      format: fileExtension,
      overwrite: false,
      access_mode: "public",
    });

    // Return success response with file metadata
    res.status(201).json({
      success: true,
      data: {
        publicId: result.publicId,
        url: result.url,
        secureUrl: result.secureUrl,
        format: result.format,
        resourceType: result.resourceType,
        originalFilename: result.originalFilename,
        width: result.width,
        height: result.height,
        size: result.bytes,
      },
    });
  } catch (error) {
    logger.error("Error uploading file to Cloudinary:", error);

    // Handle different error types appropriately
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
      return;
    }

    // Generic error response
    res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while uploading the file",
    });
  }
};

/**
 * Processes a publicId to ensure it has the proper format
 * @param publicId The public ID string or string array to process
 * @param defaultFolder Optional default folder to use if publicId doesn't include a path
 * @returns Processed publicId as a string
 */
const processPublicId = (
  publicId: string | string[],
  defaultFolder?: string
): string => {
  // Handle array case first
  let processedId: string;
  
  if (Array.isArray(publicId)) {
    processedId = publicId.join("/");
    logger.debug(`Converted array publicId to string: ${processedId}`);
  } else {
    processedId = publicId;
  }

  // Check if it includes a folder path
  if (!processedId.includes("/")) {
    logger.warn(`PublicId doesn't contain folder path: ${processedId}`);
    
    // Apply default folder if provided
    if (defaultFolder) {
      processedId = `${defaultFolder}/${processedId}`;
      logger.debug(`Added default folder: ${processedId}`);
    }
  }

  return processedId;
};


/**
 * Controller for retrieving file metadata
 * @param req Express request with publicId
 * @param res Express response
 */
export const getFileMetadata = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { publicId } = req.params;
    const requestId = req.headers["x-request-id"] || `req-${Date.now()}`;

    if (!publicId) {
      res.status(400).json({
        success: false,
        message: "Public ID is required to retrieve file metadata",
        code: "MISSING_PUBLIC_ID",
        requestId,
      });
      return;
    }

    // as the publicId can be an array, we need to handle it accordingly
    // Check if publicId is an array and join it if needed
    let fullPublicId = processPublicId(publicId);


    const metadata = await mediaService.getFileMetadata(fullPublicId);

    if (!metadata) {
      res.status(404).json({
        success: false,
        message: "File not found",
        code: "FILE_NOT_FOUND",
        requestId,
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: metadata,
    });
  } catch (error) {
    logger.error(
      `Error retrieving metadata for file ${req.params.publicId}:`,
      error
    );

    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
      return;
    }

    // Special handling for "not found" errors
    if (error instanceof Error && error.message.includes("not found")) {
      res.status(404).json({
        success: false,
        message: error.message,
        requestId: req.headers["x-request-id"] || undefined,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while retrieving file metadata -Controller",
      code: "INTERNAL_SERVER_ERROR",
      requestId: req.headers["x-request-id"] || undefined,
    });
  }
};

/**
 * Controller for deleting files from Cloudinary
 * @param req Express request with publicId
 * @param res Express response
 */
export const deleteFile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { publicId } = req.params;

    // as the publicId can be an array, we need to handle it accordingly
    // Check if publicId is an array and join it if needed
    let fullPublicId = processPublicId(publicId);

    // Ensure we have a valid public ID
    if (!fullPublicId) {
      res.status(400).json({
        success: false,
        message: "Public ID is required",
        requestId: req.headers["x-request-id"] || undefined,
      });
      return;
    }

    // Handle the publicId parameter - it may need to include the full path
    // let fullPublicId = publicIdConvert;

    // Delete the file using the media service
    const result = await mediaService.deleteFile(fullPublicId);

    if (!result) {
      res.status(404).json({
        success: false,
        message: "File not found",
        requestId: req.headers["x-request-id"] || undefined,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "File deleted successfully",
      data: result,
      requestId: req.headers["x-request-id"] || undefined,
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
      return;
    }

    // Special handling for "not found" errors
    if (error instanceof Error && error.message.includes("not found")) {
      res.status(404).json({
        success: false,
        message: error.message,
        requestId: req.headers["x-request-id"] || undefined,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while deleting the file -Controller",
      requestId: req.headers["x-request-id"] || undefined,
    });
  }
};
