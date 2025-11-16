import { Router } from "express";
import { getDashboardData, searchLearners } from "../controllers/learnEarnController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

// Get Learn & Earn dashboard data (authenticated user)
router.get("/dashboard", requireAuth([]), getDashboardData);

// Search for learners (authenticated user)
router.get("/search", requireAuth([]), searchLearners);

export default router;

