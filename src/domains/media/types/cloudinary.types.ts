export interface CloudinaryResponse {
  publicId: string;
  url: string;
  secureUrl: string;
  originalFilename?: string;
  width?: number;
  height?: number;
  format: string;
  resourceType: string;
  createdAt: string;
  bytes?: number;
  tags?: string[];
  etag?: string;
}

export interface TransformationOptions {
  width?: number;
  height?: number;
  crop?: string;
  quality?: number;
  format?: string;
  effect?: string;
  angle?: number;
  overlay?: string;
  underlay?: string;
  gravity?: string;
  radius?: number | string;
  background?: string;
  [key: string]: any; // For any other Cloudinary transformation options
}

/**
 * Interface for Cloudinary upload options
 * Maps to parameters accepted by cloudinary.uploader.upload
 */
export interface UploadApiOptions {
  // Core upload options
  resource_type?: "image" | "video" | "raw" | "auto"; // Using literal union type
  public_id?: string;
  folder?: string;
  use_filename?: boolean;
  unique_filename?: boolean;
  overwrite?: boolean;
  tags?: string[];

  // Transformation and format options
  transformation?: TransformationOptions | TransformationOptions[];
  format?: string;
  type?: string;

  // Access control
  access_mode?: "public" | "authenticated" | "private";

  // Eager transformations
  eager?: TransformationOptions | TransformationOptions[];
  eager_async?: boolean;
  eager_notification_url?: string;

  // File processing options
  invalidate?: boolean;
  discard_original_filename?: boolean;
  faces?: boolean;
  quality?: number | string;
  quality_analysis?: boolean;
  colors?: boolean;
  phash?: boolean;

  // AI and analysis options
  auto_tagging?: number;
  categorization?: string;
  detection?: string;
  ocr?: string | boolean;

  // Delivery and setup options
  upload_preset?: string;
  proxy?: string;
  backup?: boolean;
  exif?: boolean;
  image_metadata?: boolean;
  raw_convert?: string;
  async?: boolean;

  // Webhook options
  headers?: Record<string, string>;
  notification_url?: string;
  context?: Record<string, any>;

  // Allow for other properties
  [key: string]: any;
}

/**
 * Interface for Cloudinary resource metadata
 * Maps to the response from cloudinary.api.resource()
 */
export interface AdminApiResource {
  public_id: string;
  version: number;
  signature: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
  created_at: string;
  tags: string[];
  bytes: number;
  type: string;
  etag: string;
  placeholder: boolean;
  url: string;
  secure_url: string;
  access_mode: string;
  original_filename: string;
  api_key: string;
  asset_id: string;
  context?: Record<string, any>;
  colors?: string[][];
  exif?: Record<string, any>;
  faces?: number[][];
  quality?: number;
  pages?: number;
  next_cursor?: string;
  derived?: Array<Record<string, any>>;
  moderation?: Array<Record<string, any>>;
  [key: string]: any; // Allow for additional properties
}

/**
 * Interface for Cloudinary upload response
 * Maps to the response from cloudinary.uploader.upload() and destroy()
 */
export interface UploadApiResponse {
  public_id: string;
  version: number;
  signature: string;
  width?: number;
  height?: number;
  format: string;
  resource_type: string;
  created_at: string;
  tags?: string[];
  bytes: number;
  type: string;
  etag: string;
  placeholder?: boolean;
  url: string;
  secure_url: string;
  access_mode?: string;
  original_filename?: string;
  api_key?: string;
  asset_id?: string;

  // Fields specific to delete/destroy operations
  result?: string; // "ok" for successful deletion

  // Fields for error cases
  error?: {
    message: string;
    name?: string;
    http_code?: number;
  };

  // Allow for other properties returned by Cloudinary
  [key: string]: any;
}
