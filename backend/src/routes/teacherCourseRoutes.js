import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import {
  createTeacherCourse,
  getTeacherCourses,
  getTeacherCourseById,
  updateTeacherCourse,
  uploadCourseBrochure,
} from "../controllers/teacherCourseController.js";
import {
  uploadSinglePdf,
  handleUploadError,
} from "../middleware/uploadMiddleware.js";
import { getTeacherDashboard } from "../controllers/teacherDashboardController.js";
import {
  getTeacherAnalytics,
  getCourseAnalytics,
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

// Get a specific course by ID
router.get("/courses/:courseId", getTeacherCourseById);

// Update a course (only if draft)
router.put("/courses/:courseId", updateTeacherCourse);

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
router.get("/courses/:courseId/analytics", getCourseAnalytics);

// Student Management endpoints
router.get("/students", getTeacherStudents);
router.get("/courses/:courseId/students", getCourseStudents);
router.get("/students/:studentId", getStudentDetails);

export default router;

