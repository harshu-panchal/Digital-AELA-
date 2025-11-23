import { Router } from "express";
import {
  approveCourse,
  approveEbook,
  approveJob,
  approveTeacher,
  approveStudent,
  createCourse,
  createEbook,
  createBlog,
  uploadAdminCourseBrochure,
  getAdminCourseById,
  updateAdminCourse,
  getContentManagementStats,
  getAllCoursesForManagement,
  getAllBooksForManagement,
  deleteCourse,
  deleteBook,
  toggleCourseVisibility,
  toggleBookVisibility,
} from "../controllers/adminContentController.js";
import {
  getPendingCourses,
  getPendingEbooks,
  getPendingJobs,
  getPendingTeachers,
  getPendingStudents,
  getCoursePreview,
  getEbookPreview,
  getJobPreview,
} from "../controllers/adminApprovalController.js";
import {
  getPendingBlogs,
  approveBlog,
  getBlogPreview,
} from "../controllers/adminBlogApprovalController.js";
import {
  getPendingJoinUsApplications,
  getJoinUsApplicationById,
  approveJoinUsApplication,
  rejectJoinUsApplication,
} from "../controllers/joinUsApplicationController.js";
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
router.get("/pending/students", getPendingStudents);
router.get("/pending/blogs", getPendingBlogs);
router.get("/pending/join-us-applications", getPendingJoinUsApplications);

// Preview routes (full content for super admin)
router.get("/pending/blogs/:blogId/preview", getBlogPreview);
router.get("/pending/courses/:courseId/preview", getCoursePreview);
router.get("/pending/ebooks/:ebookId/preview", getEbookPreview);
router.get("/pending/jobs/:jobId/preview", getJobPreview);
router.get("/pending/join-us-applications/:applicationId", getJoinUsApplicationById);

// Approval routes
router.patch("/courses/:courseId/approve", approveCourse);
router.patch("/ebooks/:ebookId/approve", approveEbook);
router.patch("/jobs/:jobId/approve", approveJob);
router.patch("/teachers/:userId/approve", approveTeacher);
router.patch("/students/:userId/approve", approveStudent);
router.patch("/blogs/:blogId/approve", approveBlog);
router.patch("/join-us-applications/:applicationId/approve", approveJoinUsApplication);
router.patch("/join-us-applications/:applicationId/reject", rejectJoinUsApplication);

// Content creation routes
router.post("/courses", createCourse);
// Get course by ID (super admin can view their own courses)
router.get("/courses/:courseId", getAdminCourseById);
// Update course (super admin can edit their own courses)
router.put("/courses/:courseId", updateAdminCourse);
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

// Content Management routes
router.get("/content/stats", getContentManagementStats);
router.get("/content/courses", getAllCoursesForManagement);
router.get("/content/books", getAllBooksForManagement);
router.delete("/content/courses/:courseId", deleteCourse);
router.delete("/content/books/:bookId", deleteBook);
router.patch("/content/courses/:courseId/visibility", toggleCourseVisibility);
router.patch("/content/books/:bookId/visibility", toggleBookVisibility);

export default router;

