import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import {
  createTeacherEbook,
  getTeacherEbooks,
  getTeacherEbookById,
  updateTeacherEbook,
} from "../controllers/teacherEbookController.js";
import { uploadSinglePdf, handleUploadError } from "../middleware/uploadMiddleware.js";
import { requireFeature } from "../middleware/featureFlagMiddleware.js";

const router = express.Router();

// Apply feature flag check for ebooks
router.use(requireFeature("ebooks"));

// All routes require teacher or super-admin authentication
router.use(requireAuth(["teacher", "super-admin"]));

// Create a new ebook (isPublic: false - requires approval)
// Accepts PDF file upload via multipart/form-data
router.post(
  "/ebooks",
  uploadSinglePdf("pdf"),
  handleUploadError,
  createTeacherEbook
);

// Get all ebooks created by the teacher
router.get("/ebooks", getTeacherEbooks);

// Get a specific ebook by ID
router.get("/ebooks/:ebookId", getTeacherEbookById);

// Update an ebook (only if not yet approved)
router.put("/ebooks/:ebookId", updateTeacherEbook);

export default router;

