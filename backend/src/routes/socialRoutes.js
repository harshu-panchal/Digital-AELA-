import { Router } from "express";
import {
  getSocialStats,
  getFollowers,
  getFollowing,
  followUser,
  unfollowUser,
  shareCoins,
} from "../controllers/socialController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

// Get social stats (followers, following, rating) for authenticated user or public profile
// Allow optional auth - if not authenticated, return default values
router.get("/stats", getSocialStats); // Uses req.auth?.userId if authenticated
router.get("/:userId/stats", getSocialStats); // Public endpoint for any user

// Get followers list (public or authenticated)
router.get("/:userId/followers", getFollowers);

// Get following list (public or authenticated)
router.get("/:userId/following", getFollowing);

// Follow a user (authenticated)
router.post("/follow", requireAuth([]), followUser);

// Unfollow a user (authenticated)
router.delete("/follow/:targetUserId", requireAuth([]), unfollowUser);

// Share coins with another user (authenticated)
router.post("/share-coins", requireAuth(["student"]), shareCoins);

export default router;

