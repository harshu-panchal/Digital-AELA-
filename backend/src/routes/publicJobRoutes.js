import { Router } from "express";
import {
  listPublishedJobs,
  submitApplication,
  getMyApplications,
  getApplicationStats,
} from "../controllers/jobController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

// Public endpoint - anyone can view published jobs
router.get("/", listPublishedJobs);

// Allow any authenticated user (student, teacher, etc.) to apply
router.post("/:jobId/apply", requireAuth([]), submitApplication);

// Job application tracking endpoints (for students/job seekers)
router.get("/applications", requireAuth([]), getMyApplications);
router.get("/applications/stats", requireAuth([]), getApplicationStats);

export default router;

