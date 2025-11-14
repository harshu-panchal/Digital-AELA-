import { Router } from "express";
import {
  loginUser,
  logout,
  refreshToken,
  registerUser,
} from "../controllers/authController.js";

const router = Router();

// Generic endpoints that support all roles (student, teacher, recruiter, etc.)
// Role can be passed in the request body, defaults to "student" for register
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/refresh", refreshToken);
router.post("/logout", logout);

export default router;

