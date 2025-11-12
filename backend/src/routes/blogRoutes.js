import { Router } from "express";
import {
  createBlog,
  listBlogs,
  publishBlog,
  updateBlog,
} from "../controllers/blogController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();
const recruiterOnly = requireAuth(["recruiter"]);

router.get("/", recruiterOnly, listBlogs);
router.post("/", recruiterOnly, createBlog);
router.patch("/:blogId", recruiterOnly, updateBlog);
router.post("/:blogId/publish", recruiterOnly, publishBlog);

export default router;

