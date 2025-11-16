import { Router } from "express";
import { listPublishedBlogs, toggleLike, addComment } from "../controllers/blogController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", listPublishedBlogs);
router.post("/:blogId/like", requireAuth(), toggleLike);
router.post("/:blogId/comments", requireAuth(), addComment);

export default router;

