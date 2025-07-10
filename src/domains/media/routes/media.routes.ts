import { Router, Request } from "express";
import * as mediaController from "../controllers/media.controller";
import {
  authenticate,
  authorizeRoles,
} from "../../../middleware/auth.middleware";
import { UserRole } from "../../../../prisma/generated/prisma";
import multer, { FileFilterCallback } from "multer";

// Configure multer for memory storage (files as Buffer)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit per file
    files: 10, // Allow up to 10 files per request
  },
  fileFilter: (
    _req: Request,
    file: Express.Multer.File,
    callback: FileFilterCallback
  ) => {
    // Accept images, videos and documents
    if (
      file.mimetype.startsWith("image/") ||
      file.mimetype.startsWith("video/") ||
      file.mimetype === "application/pdf"
    ) {
      callback(null, true);
    } else {
      callback(
        new Error(
          "Unsupported file type. Only images, videos and PDFs are allowed."
        )
      );
    }
  },
});

const router = Router();

// Upload file route - restricted to authenticated users with specific roles
router.post(
  "/upload",
  authenticate,
  authorizeRoles(
    UserRole.RESTAURANT_OWNER,
    UserRole.RESTAURANT_STAFF,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  upload.single("file"),
  mediaController.uploadFile
);

// Delete file route - restricted to authenticated users with specific roles
// Use a regular parameter name and let Express handle path segments
router.delete(
  "/*publicId",
  authenticate,
  authorizeRoles(
    UserRole.RESTAURANT_OWNER,
    UserRole.RESTAURANT_STAFF,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  mediaController.deleteFile
);

// Get file metadata route - as a separate endpoint
// Use a regular parameter name and let Express handle path segments
router.get(
  "/metadata/*publicId",
  authenticate,
  authorizeRoles(
    UserRole.RESTAURANT_OWNER,
    UserRole.RESTAURANT_STAFF,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN
  ),
  mediaController.getFileMetadata
);

export default router;
