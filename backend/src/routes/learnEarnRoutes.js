import { Router } from "express";
import {
  getDashboardData,
  searchLearners,
  getEnhancedDashboardMetrics,
  advancedSearchLearners,
  getEnhancedLeaderboard,
  getRewardSystemStats,
} from "../controllers/learnEarnController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

// Get Learn & Earn dashboard data (authenticated user)
router.get("/dashboard", requireAuth([]), getDashboardData);

// Get enhanced dashboard metrics
router.get("/dashboard/metrics", requireAuth([]), getEnhancedDashboardMetrics);

// Search for learners (authenticated user)
router.get("/search", requireAuth([]), searchLearners);

// Advanced search for learners with filters
router.get("/search/advanced", requireAuth([]), advancedSearchLearners);

// Get enhanced leaderboard
router.get("/leaderboard", requireAuth([]), getEnhancedLeaderboard);

// Get reward system statistics
router.get("/rewards/stats", requireAuth([]), getRewardSystemStats);

export default router;

