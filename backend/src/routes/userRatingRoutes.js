import { Router } from "express";
import {
  submitUserRating,
  getUserRatings,
  getUserRatingStats,
} from "../controllers/userRatingController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

// Submit a rating for a user (authenticated)
router.post("/:userId/ratings", requireAuth([]), submitUserRating);

// Get all ratings for a user (public)
router.get("/:userId/ratings", getUserRatings);

// Get rating statistics for a user (public)
router.get("/:userId/ratings/stats", getUserRatingStats);

export default router;

