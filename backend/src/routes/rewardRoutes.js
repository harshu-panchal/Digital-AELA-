import { Router } from "express";
import {
  getRewards,
  getReward,
  createReward,
  updateReward,
  deleteReward,
  getRewardAnalytics,
} from "../controllers/rewardController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { requireFeature } from "../middleware/featureFlagMiddleware.js";

const router = Router();

// Apply feature flag check for points system
router.use(requireFeature("points"));

// Public routes
router.get("/", getRewards);
router.get("/analytics", requireAuth(["super-admin"]), getRewardAnalytics);
router.get("/:id", getReward);

// Admin-only routes
router.post("/", requireAuth(["super-admin"]), createReward);
router.patch("/:id", requireAuth(["super-admin"]), updateReward);
router.delete("/:id", requireAuth(["super-admin"]), deleteReward);

export default router;

