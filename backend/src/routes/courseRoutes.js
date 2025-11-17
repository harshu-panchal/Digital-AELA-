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

// Enrollment routes (authenticated students only)
router.post("/:courseId/enroll", requireAuth(["student"]), enrollInCourse);
router.get("/:courseId/enrollment", requireAuth(["student"]), getEnrollmentStatus);
router.patch("/:courseId/enrollment", requireAuth(["student"]), updateEnrollmentStatus);
router.delete("/:courseId/enroll", requireAuth(["student"]), unenrollFromCourse);

// Public course detail route (must be last to avoid matching other routes)
router.get("/:courseId", getCourseById);

export default router;

