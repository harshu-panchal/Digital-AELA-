import { Router } from "express";
import { listPublishedJobs, submitApplication } from "../controllers/jobController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

// Public endpoint - anyone can view published jobs
router.get("/", listPublishedJobs);

// Allow any authenticated user (student, teacher, etc.) to apply
router.post("/:jobId/apply", requireAuth([]), submitApplication);

export default router;

