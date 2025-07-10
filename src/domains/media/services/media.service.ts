import { v2 as cloudinary } from "cloudinary";
import {
  CloudinaryResponse,
  TransformationOptions,
  UploadApiOptions,
  UploadApiResponse,
  AdminApiResource,
} from "../types/cloudinary.types";
import logger from "../../../utils/logger";

/**
 * MediaService provides an interface for interacting with Cloudinary
 * for file storage, retrieval, and manipulation operations.
 */
export class MediaService {
  constructor() {
    // Configure Cloudinary with credentials from environment variables
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    logger.info("MediaService initialized with Cloudinary configuration");
  }

  /**
   * Upload a file to Cloudinary
   * @param fileBuffer - The file buffer to upload
   * @param options - Optional upload options (folder, resource_type, etc.)
   * @returns Promise resolving to the uploaded file metadata
   */
  async uploadFile(
    fileBuffer: Buffer,
    options: UploadApiOptions = {}
  ): Promise<CloudinaryResponse> {
    try {
      // Convert buffer to base64 string for Cloudinary
      const base64String = fileBuffer.toString("base64");
      const dataURI = `data:image/jpeg;base64,${base64String}`;

      // Define resource_type with correct type to satisfy TypeScript
      const uploadOptions = {
        resource_type: "auto" as "auto", // Type assertion for literal type
        ...options,
      };

      const result = await cloudinary.uploader.upload(dataURI, uploadOptions);

      logger.info(
        `File uploaded successfully to Cloudinary with ID: ${result.public_id}`
      );

      return {
        publicId: result.public_id,
        url: result.url,
        secureUrl: result.secure_url,
        originalFilename: result.original_filename,
        width: result.width,
        height: result.height,
        format: result.format,
        resourceType: result.resource_type,
        createdAt: result.created_at,
        bytes: result.bytes,
        tags: result.tags,
        etag: result.etag,
      };
    } catch (error) {
      logger.error("Error uploading file to Cloudinary:", error);

      if (error instanceof Error) {
        // Handle specific error types
        if (error.message.includes("upload_preset")) {
          throw new Error("Invalid upload preset configuration");
        } else if (error.message.includes("allowed_formats")) {
          throw new Error(
            "Invalid file format. Please upload an allowed format"
          );
        } else if (error.message.includes("File size too large")) {
          throw new Error("File size exceeds the maximum allowed limit");
        }

        throw new Error(`Failed to upload file: ${error.message}`);
      }

      throw new Error("An unexpected error occurred during file upload");
    }
  }

  /**
   * Retrieve metadata of a file from Cloudinary
   * @param publicId - The public ID of the file
   * @returns Promise resolving to the file metadata
   */
  async getFileMetadata(publicId: string): Promise<AdminApiResource> {
    try {
 
      const result = await cloudinary.api.resource(publicId);
      logger.info(`Retrieved metadata for file: ${publicId}`);
 
      return result;
    } catch (error: any) {
      logger.error(`Error getting metadata for file ${publicId}:`, error);

      // Check for Cloudinary's "not found" API response pattern
      if (
        (error instanceof Error && error.message.includes("not found")) ||
        (error && error.error && typeof error.error.message === "string" && error.error.message.includes("Resource not found"))
      ) {
        throw new Error(`File with ID ${publicId} not found on Cloudinary`);
      }

      if (error instanceof Error) {
        throw new Error(`Failed to get file metadata: ${error.message}`);
      }

      throw new Error("An unexpected error occurred while retrieving file metadata");
    }
    
  }

  /**
   * Delete a file from Cloudinary
   * @param publicId - The public ID of the file to delete
   * @returns Promise resolving when the file is deleted
   */
  async deleteFile(publicId: string): Promise<UploadApiResponse> {
    try {
      const result = await cloudinary.uploader.destroy(publicId);

      // Check if resource was actually deleted
      if (result.result !== "ok") {
        if (result.result === "not found") {
          throw new Error(`File with ID ${publicId} not found on Cloudinary`);
        }
        throw new Error(`Failed to delete file: ${result.result}`);
      }

      logger.info(`File deleted successfully: ${publicId}`);
      return result;
    } catch (error) {
      logger.error(`Error deleting file ${publicId}:`, error);

      if (error instanceof Error) {
        // Check for Cloudinary's "not found" API response pattern
        if (
          error.message.includes("not found") ||
          (typeof error === "object" &&
            error !== null &&
            "error" in error &&
            typeof error.error === "object" &&
            error.error !== null &&
            "message" in error.error &&
            error.error.message === "Resource not found")
        ) {
          throw new Error(`File with ID ${publicId} not found on Cloudinary`);
        }
        throw new Error(`Failed to delete file: ${error.message}`);
      }

      throw new Error("An unexpected error occurred while deleting the file");
    }
  }

  /**
   * Generate a transformation URL for a file
   * @param publicId - The public ID of the file
   * @param options - Transformation options (width, height, crop, etc.)
   * @returns The transformed URL
   */
  generateTransformationUrl(
    publicId: string,
    options: TransformationOptions
  ): string {
    try {
      // Always use secure URLs (HTTPS)
      const url = cloudinary.url(publicId, {
        secure: true,
        ...options,
      });

      logger.debug(
        `Generated transformation URL for ${publicId} with options:`,
        options
      );
      return url;
    } catch (error) {
      logger.error(
        `Error generating transformation URL for ${publicId}:`,
        error
      );

      if (error instanceof Error) {
        throw new Error(
          `Failed to generate transformation URL: ${error.message}`
        );
      }

      throw new Error(
        "An unexpected error occurred while generating the transformation URL"
      );
    }
  }
}

// Export a singleton instance for application-wide use
export default new MediaService();
