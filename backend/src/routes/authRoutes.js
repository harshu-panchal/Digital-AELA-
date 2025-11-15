import { Router } from "express";
import {
  loginUser,
  logout,
  refreshToken,
  registerUser,
} from "../controllers/authController.js";
import { uploadSingle, handleUploadError } from "../middleware/uploadMiddleware.js";

const router = Router();

// Generic endpoints that support all roles (student, teacher, recruiter, etc.)
// Role can be passed in the request body, defaults to "student" for register
// Add multer middleware for profile image upload (optional field)
router.post("/register", uploadSingle("profileImage"), handleUploadError, registerUser);
router.post("/login", loginUser);
router.post("/refresh", refreshToken);
router.post("/logout", logout);

export default router;

