import { Router } from "express";
import { getDashboardData } from "../controllers/learnEarnController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

// Get Learn & Earn dashboard data (authenticated user)
router.get("/dashboard", requireAuth([]), getDashboardData);

export default router;

