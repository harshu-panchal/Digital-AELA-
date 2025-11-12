import { Router } from "express";
import {
  getMyProfile,
  upsertMyProfile,
} from "../controllers/recruiterController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/profile", requireAuth(["recruiter"]), getMyProfile);
router.patch("/profile", requireAuth(["recruiter"]), upsertMyProfile);

export default router;

