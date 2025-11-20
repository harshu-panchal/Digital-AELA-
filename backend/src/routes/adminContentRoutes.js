import { Router } from "express";
import {
  approveCourse,
  approveEbook,
  approveJob,
  approveTeacher,
  createCourse,
  createEbook,
  createBlog,
  uploadAdminCourseBrochure,
} from "../controllers/adminContentController.js";
import {
  getPendingCourses,
  getPendingEbooks,
  getPendingJobs,
  getPendingTeachers,
} from "../controllers/adminApprovalController.js";
import {
  getLiveRoomsForModeration,
  moderateLiveRoom,
  deleteLiveRoom,
} from "../controllers/adminLiveRoomController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { uploadSinglePdf, handleUploadError } from "../middleware/uploadMiddleware.js";

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
// Accepts PDF file upload via multipart/form-data
router.post(
  "/ebooks",
  uploadSinglePdf("pdf"),
  handleUploadError,
  createEbook
);
router.post("/blogs", createBlog);

// Upload course brochure PDF
router.post(
  "/courses/:courseId/brochure",
  uploadSinglePdf("brochure"),
  handleUploadError,
  uploadAdminCourseBrochure
);

// Live Room Moderation routes
router.get("/live-rooms", getLiveRoomsForModeration);
router.patch("/live-rooms/:roomId/moderate", moderateLiveRoom);
router.delete("/live-rooms/:roomId", deleteLiveRoom);

export default router;

