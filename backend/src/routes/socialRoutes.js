import { Router } from "express";
import {
  getSocialStats,
  getFollowers,
  getFollowing,
  followUser,
  unfollowUser,
  shareCoins,
  getSocialFeed,
  getFollowerSuggestions,
  getSocialNotifications,
  markNotificationsRead,
  bulkShareCoins,
  getCoinSharingHistory,
  getCoinSharingLimits,
} from "../controllers/socialController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

// Get social stats (followers, following, rating) for authenticated user or public profile
// Allow optional auth - if not authenticated, return default values
router.get("/stats", getSocialStats); // Uses req.auth?.userId if authenticated
router.get("/:userId/stats", getSocialStats); // Public endpoint for any user

// Get social feed/activity stream (authenticated)
router.get("/feed", requireAuth([]), getSocialFeed);

// Get enhanced follower suggestions (authenticated)
router.get("/suggestions", requireAuth([]), getFollowerSuggestions);

// Get social notifications (authenticated)
router.get("/notifications", requireAuth([]), getSocialNotifications);

// Mark notifications as read (authenticated)
router.patch("/notifications/read", requireAuth([]), markNotificationsRead);

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

// Advanced coin sharing features
router.post("/share-coins/bulk", requireAuth(["student"]), bulkShareCoins);
router.get("/share-coins/history", requireAuth(["student"]), getCoinSharingHistory);
router.get("/share-coins/limits", requireAuth(["student"]), getCoinSharingLimits);

export default router;

