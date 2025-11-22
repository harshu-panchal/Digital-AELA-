import { Router } from "express";
import { getPublicSettings } from "../controllers/settingsController.js";

const router = Router();

// Public route - no authentication required
// GET /api/v1/public/settings?category=social
router.get("/settings", getPublicSettings);

export default router;

