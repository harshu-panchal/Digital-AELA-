import { Router } from "express";
import {
  getAllGalleryImages,
  getGalleryImages,
  uploadGalleryImage,
  deleteGalleryImage,
} from "../controllers/galleryController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import {
  uploadSingle,
  handleUploadError,
} from "../middleware/uploadMiddleware.js";

// Public router for gallery images
const publicRouter = Router();
publicRouter.get("/", getAllGalleryImages);

// Admin router for gallery management
const adminRouter = Router();
adminRouter.use(requireAuth(["super-admin"]));

// Get all gallery images with pagination (admin)
adminRouter.get("/", getGalleryImages);

// Upload gallery image (admin)
adminRouter.post(
  "/",
  uploadSingle("image"),
  handleUploadError,
  uploadGalleryImage
);

// Delete gallery image (admin)
adminRouter.delete("/:id", deleteGalleryImage);

export { publicRouter, adminRouter };

