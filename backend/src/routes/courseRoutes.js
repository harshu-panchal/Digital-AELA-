import express from "express";
import { getPublishedCourses, getCourseById } from "../controllers/courseController.js";

const router = express.Router();

// Public routes - no authentication required
router.get("/", getPublishedCourses);
router.get("/:courseId", getCourseById);

export default router;

