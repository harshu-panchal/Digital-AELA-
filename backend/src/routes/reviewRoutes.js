import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import {
  submitReview,
  getCourseReviews,
  getReview,
  updateReview,
  deleteReview,
  getMyReview,
  markHelpful,
  moderateReview,
  getPendingReviews,
} from "../controllers/reviewController.js";

const router = express.Router();

// Public routes
router.get("/courses/:courseId/reviews", getCourseReviews);
router.get("/reviews/:reviewId", getReview);

// Authenticated routes
router.post("/courses/:courseId/reviews", requireAuth(), submitReview);
router.get("/courses/:courseId/reviews/my-review", requireAuth(), getMyReview);
router.patch("/reviews/:reviewId", requireAuth(), updateReview);
router.delete("/reviews/:reviewId", requireAuth(), deleteReview);
router.post("/reviews/:reviewId/helpful", requireAuth(), markHelpful);

// Admin routes
router.get("/admin/reviews/pending", requireAuth(["admin", "super-admin"]), getPendingReviews);
router.patch("/admin/reviews/:reviewId/moderate", requireAuth(["admin", "super-admin"]), moderateReview);

export default router;

