import { Router } from "express";
import {
  listPublishedJobs,
  searchJobs,
  submitApplication,
  getMyApplications,
  getApplicationStats,
} from "../controllers/jobController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { requireFeature } from "../middleware/featureFlagMiddleware.js";
import { cacheMiddleware } from "../middleware/cacheMiddleware.js";

const router = Router();

// Apply feature flag check for jobs
router.use(requireFeature("jobs"));

// Public endpoint - anyone can view published jobs
router.get("/", cacheMiddleware, listPublishedJobs);

// Advanced search endpoint
router.get("/search", cacheMiddleware, searchJobs);

// Allow any authenticated user (student, teacher, etc.) to apply
router.post("/:jobId/apply", requireAuth([]), submitApplication);

// Job application tracking endpoints (for students/job seekers)
router.get("/applications", requireAuth([]), getMyApplications);
router.get("/applications/stats", requireAuth([]), getApplicationStats);

export default router;

