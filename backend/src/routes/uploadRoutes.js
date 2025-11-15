import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { uploadSingle, uploadMultiple, handleUploadError } from "../middleware/uploadMiddleware.js";
import { uploadImage, uploadImages, deleteImage } from "../controllers/uploadController.js";

const router = express.Router();

// Upload single image (authenticated users only)
router.post(
  "/single",
  requireAuth(),
  uploadSingle("image"),
  handleUploadError,
  uploadImage
);

// Upload multiple images (authenticated users only)
router.post(
  "/multiple",
  requireAuth(),
  uploadMultiple("images", 10),
  handleUploadError,
  uploadImages
);

// Delete image (authenticated users only)
router.delete("/:public_id", requireAuth(), deleteImage);

export default router;

