import { Router } from "express";
import {
  approveCourse,
  approveEbook,
  approveJob,
  approveTeacher,
  createCourse,
  createEbook,
  createBlog,
} from "../controllers/adminContentController.js";
import {
  getPendingCourses,
  getPendingEbooks,
  getPendingJobs,
  getPendingTeachers,
} from "../controllers/adminApprovalController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

// All routes require super-admin role
router.use(requireAuth(["super-admin"]));

// Get pending items
router.get("/pending/courses", getPendingCourses);
router.get("/pending/ebooks", getPendingEbooks);
router.get("/pending/jobs", getPendingJobs);
router.get("/pending/teachers", getPendingTeachers);

// Approval routes
router.patch("/courses/:courseId/approve", approveCourse);
router.patch("/ebooks/:ebookId/approve", approveEbook);
router.patch("/jobs/:jobId/approve", approveJob);
router.patch("/teachers/:userId/approve", approveTeacher);

// Content creation routes
router.post("/courses", createCourse);
router.post("/ebooks", createEbook);
router.post("/blogs", createBlog);

export default router;

