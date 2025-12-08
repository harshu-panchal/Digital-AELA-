import { Router } from "express";
import {
  createStudentProfile,
  getStudentProfile,
  updateStudentProfile,
} from "../controllers/studentController.js";
import { getStudentDashboard, getPublicUserStats, getDashboardWidgets, getEnhancedProfile } from "../controllers/studentDashboardController.js";
import { verifySocialLink, getSocialLinks, addSocialLink, deleteSocialLink } from "../controllers/socialVerificationController.js";
import {
  getStudentPoints,
  updateStudentPoints,
  getPointsHistory,
  getPointsStats,
  claimDailyBonus,
} from "../controllers/pointsController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { cacheMiddleware } from "../middleware/cacheMiddleware.js";

const router = Router();

// Get student dashboard (authenticated student only)
router.get("/dashboard", requireAuth(["student"]), cacheMiddleware, getStudentDashboard);

// Get enhanced dashboard widgets (authenticated student only)
router.get("/dashboard/widgets", requireAuth(["student"]), getDashboardWidgets);

// Get enhanced profile data (public endpoint, but returns more data if own profile)
router.get("/:userId/profile/enhanced", getEnhancedProfile);

// Get public user stats/earnings (public endpoint)
router.get("/:userId/stats", getPublicUserStats);

// Get student profile (public or authenticated)
router.get("/:userId/profile", getStudentProfile);

// Create/update student profile (authenticated)
router.post("/profile", requireAuth(["student"]), createStudentProfile);
router.patch("/profile", requireAuth(["student"]), updateStudentProfile);
router.patch("/:userId/profile", requireAuth([]), updateStudentProfile);

// Social verification endpoints
router.post("/social/links", requireAuth(["student"]), addSocialLink); // Add or update social link
router.delete("/social/links/:platform", requireAuth(["student"]), deleteSocialLink); // Delete social link
router.post("/social/verify", requireAuth(["student"]), verifySocialLink); // Verify a social link
router.get("/social/links", requireAuth(["student"]), getSocialLinks); // Get user's social links
router.get("/:userId/social/links", getSocialLinks); // Public endpoint

// Points management endpoints
router.get("/points", requireAuth(["student"]), getStudentPoints); // Get student points
router.patch("/points", requireAuth(["student"]), updateStudentPoints); // Update student points
router.get("/points/history", requireAuth(["student"]), getPointsHistory); // Get points transaction history
router.get("/points/stats", requireAuth(["student"]), getPointsStats); // Get points statistics
router.post("/points/daily-bonus", requireAuth(["student"]), claimDailyBonus); // Claim daily bonus

export default router;

