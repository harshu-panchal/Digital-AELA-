import { Router } from "express";
import {
  getAllTestimonials,
  getTestimonialsBySection,
  getAdminTestimonials,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
  toggleTestimonialStatus,
} from "../controllers/testimonialController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import {
  uploadSingle,
  handleUploadError,
} from "../middleware/uploadMiddleware.js";

const router = Router();

// Public routes (no authentication required)
router.get("/", getAllTestimonials);
router.get("/section/:section", getTestimonialsBySection);

// Admin routes (super-admin only)
const adminRouter = Router();
adminRouter.use(requireAuth(["super-admin"]));

// Get all testimonials for admin (with pagination)
adminRouter.get("/", getAdminTestimonials);

// Create testimonial (with optional image upload)
adminRouter.post(
  "/",
  uploadSingle("avatar"),
  handleUploadError,
  createTestimonial
);

// Update testimonial (with optional image upload)
adminRouter.put(
  "/:id",
  uploadSingle("avatar"),
  handleUploadError,
  updateTestimonial
);

// Delete testimonial
adminRouter.delete("/:id", deleteTestimonial);

// Toggle testimonial status
adminRouter.patch("/:id/status", toggleTestimonialStatus);

export { router as publicRouter, adminRouter };

