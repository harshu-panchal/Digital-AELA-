import { Router } from "express";
import {
  loginUser,
  logout,
  refreshToken,
  registerUser,
  forgotPassword,
  resetPassword,
  changePassword,
  updateUserProfile,
} from "../controllers/authController.js";
import { uploadSingle, handleUploadError } from "../middleware/uploadMiddleware.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { validateCsrfToken } from "../middleware/csrfMiddleware.js";
import {
  loginRateLimiter,
  registrationRateLimiter,
  passwordResetRateLimiter,
  strictRateLimiter,
} from "../middleware/rateLimiter.js";

const router = Router();

// Generic endpoints that support all roles (student, teacher, recruiter, etc.)
// Role can be passed in the request body, defaults to "student" for register
// Add multer middleware for profile image upload (optional field)
router.post("/register", registrationRateLimiter, uploadSingle("profileImage"), handleUploadError, registerUser);
router.post("/login", loginRateLimiter, loginUser);
router.post("/refresh", refreshToken);
router.post("/logout", logout);

// Password reset endpoints (no authentication required)
router.post("/forgot-password", passwordResetRateLimiter, forgotPassword);
router.post("/reset-password", strictRateLimiter, resetPassword);

// Change password endpoint (authentication required, state-changing - requires CSRF)
router.post("/change-password", requireAuth([]), validateCsrfToken, changePassword);

// Update user profile/metadata endpoint (authentication required, state-changing - requires CSRF)
router.patch("/profile", requireAuth([]), validateCsrfToken, updateUserProfile);

export default router;

