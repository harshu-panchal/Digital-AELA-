import { Router } from "express";
import {
  createStudentProfile,
  getStudentProfile,
  updateStudentProfile,
} from "../controllers/studentController.js";
import { getStudentDashboard } from "../controllers/studentDashboardController.js";
import { verifySocialLink, getSocialLinks, addSocialLink, deleteSocialLink } from "../controllers/socialVerificationController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

// Get student dashboard (authenticated student only)
router.get("/dashboard", requireAuth(["student"]), getStudentDashboard);

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

export default router;

