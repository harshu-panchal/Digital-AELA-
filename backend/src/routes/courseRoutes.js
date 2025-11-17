import express from "express";
import { getPublishedCourses, getCourseById } from "../controllers/courseController.js";
import {
  enrollInCourse,
  getEnrolledCourses,
  getEnrollmentStatus,
  unenrollFromCourse,
  updateEnrollmentStatus,
} from "../controllers/enrollmentController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes - no authentication required
router.get("/", getPublishedCourses);
router.get("/enrolled", requireAuth(["student"]), getEnrolledCourses);

// Enrollment routes
// For free courses: any authenticated user can enroll
// For paid courses: only students can enroll (checked in controller)
router.post("/:courseId/enroll", requireAuth(), enrollInCourse);
router.get("/:courseId/enrollment", requireAuth(), getEnrollmentStatus);
router.patch("/:courseId/enrollment", requireAuth(), updateEnrollmentStatus);
router.delete("/:courseId/enroll", requireAuth(), unenrollFromCourse);

// Public course detail route (must be last to avoid matching other routes)
router.get("/:courseId", getCourseById);

export default router;

