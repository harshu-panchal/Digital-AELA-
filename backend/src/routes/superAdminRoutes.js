import { Router } from "express";
import {
  getDashboardStats,
  getPendingApprovals,
  getRecentActivity,
  getDashboardData,
  getSystemHealth,
} from "../controllers/superAdminController.js";
import {
  getOverviewAnalytics,
  getUserAnalytics,
  getCourseAnalytics,
  getRevenueAnalytics,
  getJobAnalytics,
} from "../controllers/analyticsController.js";
import {
  getAllSettings,
  getSetting,
  updateSettings,
  updateSetting,
  deleteSetting,
  getSettingsByCategory,
  initializeDefaultSettings,
  verifyFinancialPassword,
  setFinancialPassword,
  requestFinancialPasswordReset,
  verifyFinancialPasswordToken,
  resetFinancialPasswordWithToken,
} from "../controllers/settingsController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { cacheMiddleware } from "../middleware/cacheMiddleware.js";

const router = Router();

// Public routes (no authentication required) - accessed from email links
router.get("/settings/financial-password/verify-token", verifyFinancialPasswordToken);
router.post("/settings/financial-password/reset", resetFinancialPasswordWithToken);

// All other routes require super-admin role
router.use(requireAuth(["super-admin"]));

// Get all dashboard data (recommended - single call)
router.get("/dashboard", cacheMiddleware, getDashboardData);

// System health endpoint
router.get("/system-health", getSystemHealth);

// Individual endpoints (for granular fetching if needed)
router.get("/stats", getDashboardStats);
router.get("/approvals", getPendingApprovals);
router.get("/activity", getRecentActivity);

// Advanced Analytics endpoints
router.get("/analytics/overview", cacheMiddleware, getOverviewAnalytics);
router.get("/analytics/users", cacheMiddleware, getUserAnalytics);
router.get("/analytics/courses", cacheMiddleware, getCourseAnalytics);
router.get("/analytics/revenue", cacheMiddleware, getRevenueAnalytics);
router.get("/analytics/jobs", cacheMiddleware, getJobAnalytics);

// System Settings endpoints
router.get("/settings", getAllSettings);
router.get("/settings/category/:category", getSettingsByCategory);
router.get("/settings/:key", getSetting);
router.put("/settings", updateSettings);
router.patch("/settings/:key", updateSetting);
router.delete("/settings/:key", deleteSetting);
router.post("/settings/initialize", initializeDefaultSettings);
router.post("/settings/financial-password/verify", verifyFinancialPassword);
router.post("/settings/financial-password/set", setFinancialPassword);
router.post("/settings/financial-password/request-reset", requestFinancialPasswordReset);

export default router;

