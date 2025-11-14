import { Router } from "express";
import {
  createStudentProfile,
  getStudentProfile,
  updateStudentProfile,
} from "../controllers/studentController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

// Get student profile (public or authenticated)
router.get("/:userId/profile", getStudentProfile);

// Create/update student profile (authenticated)
router.post("/profile", requireAuth(["student"]), createStudentProfile);
router.patch("/profile", requireAuth(["student"]), updateStudentProfile);
router.patch("/:userId/profile", requireAuth([]), updateStudentProfile);

export default router;

