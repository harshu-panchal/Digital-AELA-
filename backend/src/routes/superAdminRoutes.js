import { Router } from "express";
import {
  getDashboardStats,
  getPendingApprovals,
  getRecentActivity,
  getDashboardData,
} from "../controllers/superAdminController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

// All routes require super-admin role
router.use(requireAuth(["super-admin"]));

// Get all dashboard data (recommended - single call)
router.get("/dashboard", getDashboardData);

// Individual endpoints (for granular fetching if needed)
router.get("/stats", getDashboardStats);
router.get("/approvals", getPendingApprovals);
router.get("/activity", getRecentActivity);

export default router;

