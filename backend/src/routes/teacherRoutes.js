import { Router } from "express";
import { getTeacherProfile } from "../controllers/teacherController.js";

const router = Router();

// Public endpoint to get teacher profile by userId
router.get("/:userId/profile", getTeacherProfile);

export default router;

