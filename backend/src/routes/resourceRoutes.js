import { Router } from "express";
import { getEbook, listEbooks, getFeaturedBookCount } from "../controllers/resourceController.js";
import {
  updateReadingProgress,
  getReadingProgress,
  addBookmark,
  rateEbook,
  getEbookRatings,
  getEbookAnalytics,
  downloadEbook,
} from "../controllers/ebookEnhancementController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

// Public routes
router.get("/ebooks", listEbooks);
router.get("/ebooks/featured-count", getFeaturedBookCount); // Get count of featured books
router.get("/ebooks/:ebookId", getEbook);
router.get("/ebooks/:ebookId/download", downloadEbook);
router.get("/ebooks/:ebookId/ratings", getEbookRatings);

// Authenticated routes
router.post("/ebooks/:ebookId/progress", requireAuth(), updateReadingProgress);
router.get("/ebooks/:ebookId/progress", requireAuth(), getReadingProgress);
router.post("/ebooks/:ebookId/bookmarks", requireAuth(), addBookmark);
router.post("/ebooks/:ebookId/ratings", requireAuth(), rateEbook);
router.get("/ebooks/:ebookId/analytics", requireAuth(["teacher", "admin"]), getEbookAnalytics);

export default router;

