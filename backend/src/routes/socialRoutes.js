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
import { requireFeature } from "../middleware/featureFlagMiddleware.js";

const router = Router();

// Get social stats (followers, following, rating) for authenticated user or public profile
// Allow optional auth - if not authenticated, return default values
router.get("/stats", getSocialStats); // Uses req.auth?.userId if authenticated
router.get("/:userId/stats", getSocialStats); // Public endpoint for any user

// Note: getSocialFeed, getFollowerSuggestions, getSocialNotifications, markNotificationsRead
// are not yet implemented in socialController.js
// These routes can be added when the controller functions are implemented

// Get followers list (public or authenticated)
router.get("/:userId/followers", getFollowers);

// Get following list (public or authenticated)
router.get("/:userId/following", getFollowing);

// Follow a user (authenticated)
router.post("/follow", requireAuth([]), followUser);

// Unfollow a user (authenticated)
router.delete("/follow/:targetUserId", requireAuth([]), unfollowUser);

// Share coins with another user (authenticated) - requires points feature
router.post("/share-coins", requireFeature("points"), requireAuth(["student"]), shareCoins);

// Note: bulkShareCoins, getCoinSharingHistory, getCoinSharingLimits
// are not yet implemented in socialController.js
// These routes can be added when the controller functions are implemented

export default router;

