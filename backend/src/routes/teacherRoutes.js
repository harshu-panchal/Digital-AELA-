import { Router } from "express";
import { 
  getTeacherProfile, 
  getMyTeacherProfile, 
  updateTeacherProfile 
} from "../controllers/teacherController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { uploadSingle, handleUploadError } from "../middleware/uploadMiddleware.js";

const router = Router();

// Authenticated endpoints for own profile (must come before :userId routes)
router.get("/profile", requireAuth(["teacher"]), getMyTeacherProfile);
router.patch("/profile", requireAuth(["teacher"]), uploadSingle("profileImage"), handleUploadError, updateTeacherProfile);

// Public endpoint to get teacher profile by userId (must come last to avoid conflicts)
router.get("/:userId/profile", getTeacherProfile);

export default router;

