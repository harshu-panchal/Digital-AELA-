import { Router } from "express";
import { getCommunityData } from "../controllers/communityController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

// Get community data (accessible to all authenticated users)
router.get("/", requireAuth([]), getCommunityData);

export default router;

