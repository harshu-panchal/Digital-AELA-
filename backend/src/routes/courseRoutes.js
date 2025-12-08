import express from "express";
import { getPublishedCourses, getCourseById, getPremiumCourseCount } from "../controllers/courseController.js";
import {
  enrollInCourse,
  getEnrolledCourses,
  getEnrollmentStatus,
  unenrollFromCourse,
  updateEnrollmentStatus,
} from "../controllers/enrollmentController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { requireFeature } from "../middleware/featureFlagMiddleware.js";
import { cacheMiddleware } from "../middleware/cacheMiddleware.js";

const router = express.Router();

// Apply feature flag check for courses
router.use(requireFeature("courses"));

// Public routes - no authentication required
router.get("/", cacheMiddleware, getPublishedCourses);
router.get("/premium-count", cacheMiddleware, getPremiumCourseCount); // Get count of premium courses
router.get("/enrolled", requireAuth(["student"]), getEnrolledCourses);

// Enrollment routes
// For free courses: any authenticated user can enroll
// For paid courses: only students can enroll (checked in controller)
router.post("/:courseId/enroll", requireAuth(), enrollInCourse);
router.get("/:courseId/enrollment", requireAuth(), getEnrollmentStatus);
router.patch("/:courseId/enrollment", requireAuth(), updateEnrollmentStatus);
router.delete("/:courseId/enroll", requireAuth(), unenrollFromCourse);

// Public course detail route (must be last to avoid matching other routes)
router.get("/:courseId", cacheMiddleware, getCourseById);

export default router;

