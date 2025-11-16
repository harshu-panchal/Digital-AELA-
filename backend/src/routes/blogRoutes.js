import { Router } from "express";
import {
  createBlog,
  listBlogs,
  publishBlog,
  updateBlog,
} from "../controllers/blogController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();
// Allow all authenticated users to create and manage blogs
const authenticated = requireAuth();

router.get("/", authenticated, listBlogs);
router.post("/", authenticated, createBlog);
router.patch("/:blogId", authenticated, updateBlog);
router.post("/:blogId/publish", authenticated, publishBlog);

export default router;

