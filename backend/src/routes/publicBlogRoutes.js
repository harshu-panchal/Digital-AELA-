import { Router } from "express";
import { listPublishedBlogs } from "../controllers/blogController.js";

const router = Router();

router.get("/", listPublishedBlogs);

export default router;

