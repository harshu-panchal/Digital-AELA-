import { Router } from "express";
import {
  getMyProfile,
  upsertMyProfile,
  getRecruiterProfile,
} from "../controllers/recruiterController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

// Public endpoint to get recruiter profile by userId
router.get("/:userId/profile", getRecruiterProfile);

// Authenticated endpoints for own profile
router.get("/profile", requireAuth(["recruiter"]), getMyProfile);
router.patch("/profile", requireAuth(["recruiter"]), upsertMyProfile);

export default router;

