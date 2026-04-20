import { Router } from "express";
import {
  approveBranchBook,
  approveBranchCourse,
  approveBranchUser,
  createBranchAnnouncement,
  deleteBranchAnnouncement,
  getBranchAnalytics,
  getBranchDashboard,
  getBranchOwnerProfile,
  getBranchSettings,
  listBranchAnnouncements,
  listBranchBooks,
  listBranchCourses,
  listBranchStudents,
  listBranchTeachers,
  getBranchUserDetails,
  listPendingBranchUsers,
  rejectBranchBook,
  rejectBranchCourse,
  rejectBranchUser,
  removeBranchUser,
  updateBranchAnnouncement,
  updateBranchOwnerProfile,
  updateBranchSettings,
} from "../controllers/branchOwnerController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import {
  requireBranchOwner,
  requireLiveBranch,
} from "../middleware/branchScopeMiddleware.js";

const router = Router();

router.use(requireAuth(["branch_owner"]));
router.use(requireBranchOwner);

router.get("/dashboard", getBranchDashboard);
router.get("/profile", getBranchOwnerProfile);
router.patch("/profile", updateBranchOwnerProfile);

router.get("/analytics", requireLiveBranch, getBranchAnalytics);
router.get("/settings", getBranchSettings);
router.patch("/settings", updateBranchSettings);

router.get("/teachers", requireLiveBranch, listBranchTeachers);
router.get("/students", requireLiveBranch, listBranchStudents);
router.get("/users/pending", requireLiveBranch, listPendingBranchUsers);
router.get("/users/:userId", requireLiveBranch, getBranchUserDetails);
router.patch("/users/:userId/approve", requireLiveBranch, approveBranchUser);
router.patch("/users/:userId/reject", requireLiveBranch, rejectBranchUser);
router.patch("/users/:userId/remove", requireLiveBranch, removeBranchUser);

router.get("/courses", requireLiveBranch, listBranchCourses);
router.patch("/courses/:courseId/approve", requireLiveBranch, approveBranchCourse);
router.patch("/courses/:courseId/reject", requireLiveBranch, rejectBranchCourse);

router.get("/books", requireLiveBranch, listBranchBooks);
router.patch("/books/:bookId/approve", requireLiveBranch, approveBranchBook);
router.patch("/books/:bookId/reject", requireLiveBranch, rejectBranchBook);

router.get("/announcements", requireLiveBranch, listBranchAnnouncements);
router.post("/announcements", requireLiveBranch, createBranchAnnouncement);
router.patch(
  "/announcements/:announcementId",
  requireLiveBranch,
  updateBranchAnnouncement
);
router.delete(
  "/announcements/:announcementId",
  requireLiveBranch,
  deleteBranchAnnouncement
);

export default router;
