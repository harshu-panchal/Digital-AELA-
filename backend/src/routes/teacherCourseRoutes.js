import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import {
  createTeacherCourse,
  getTeacherCourses,
  getTeacherCourseById,
  updateTeacherCourse,
} from "../controllers/teacherCourseController.js";

const router = express.Router();

// All routes require teacher authentication
router.use(requireAuth(["teacher"]));

// Create a new course (draft status)
router.post("/courses", createTeacherCourse);

// Get all courses created by the teacher
router.get("/courses", getTeacherCourses);

// Get a specific course by ID
router.get("/courses/:courseId", getTeacherCourseById);

// Update a course (only if draft)
router.put("/courses/:courseId", updateTeacherCourse);

export default router;

