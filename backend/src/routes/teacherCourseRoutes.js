import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import {
  createTeacherCourse,
  getTeacherCourses,
  getTeacherCourseById,
  updateTeacherCourse,
  deleteTeacherCourse,
  uploadCourseBrochure,
  bulkCourseOperations,
} from "../controllers/teacherCourseController.js";
import {
  uploadSinglePdf,
  handleUploadError,
} from "../middleware/uploadMiddleware.js";
import { getTeacherDashboard } from "../controllers/teacherDashboardController.js";
import {
  getTeacherAnalytics,
  getCourseAnalytics,
  getEnhancedAnalyticsReport,
  compareAnalytics,
} from "../controllers/teacherAnalyticsController.js";
import {
  getTeacherStudents,
  getCourseStudents,
  getStudentDetails,
} from "../controllers/teacherStudentController.js";

const router = express.Router();

// All routes require teacher authentication
router.use(requireAuth(["teacher"]));

// Get teacher dashboard data
router.get("/dashboard", getTeacherDashboard);

// Create a new course (draft status)
router.post("/courses", createTeacherCourse);

// Get all courses created by the teacher
router.get("/courses", getTeacherCourses);

// Bulk operations for courses
router.post("/courses/bulk", bulkCourseOperations);

// Get a specific course by ID
router.get("/courses/:courseId", getTeacherCourseById);

// Update a course (any status)
router.put("/courses/:courseId", updateTeacherCourse);

// Delete a course (any status)
router.delete("/courses/:courseId", deleteTeacherCourse);

// Upload course brochure PDF
router.post(
  "/courses/:courseId/brochure",
  requireAuth(),
  uploadSinglePdf("brochure"),
  handleUploadError,
  uploadCourseBrochure
);

// Teacher Analytics endpoints
router.get("/analytics", getTeacherAnalytics);
router.get("/analytics/report", getEnhancedAnalyticsReport);
router.get("/analytics/compare", compareAnalytics);
router.get("/courses/:courseId/analytics", getCourseAnalytics);

// Student Management endpoints
router.get("/students", getTeacherStudents);
router.get("/courses/:courseId/students", getCourseStudents);
router.get("/students/:studentId", getStudentDetails);

export default router;

