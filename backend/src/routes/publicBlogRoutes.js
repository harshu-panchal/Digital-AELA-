import { Router } from "express";
import { listPublishedBlogs, toggleLike, addComment } from "../controllers/blogController.js";
import {
  searchBlogs,
  getBlogCategories,
  addBlogReaction,
  removeBlogReaction,
  getBlogAnalytics,
  shareBlog,
} from "../controllers/blogEnhancementController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

// Public routes
router.get("/", listPublishedBlogs);
router.get("/search", searchBlogs);
router.get("/categories", getBlogCategories);
router.post("/:blogId/share", shareBlog);

// Authenticated routes
router.post("/:blogId/like", requireAuth(), toggleLike);
router.post("/:blogId/comments", requireAuth(), addComment);
router.post("/:blogId/reactions", requireAuth(), addBlogReaction);
router.delete("/:blogId/reactions", requireAuth(), removeBlogReaction);
router.get("/:blogId/analytics", requireAuth(["recruiter", "admin"]), getBlogAnalytics);

export default router;

