import express from "express";
import { getCsrfToken } from "../controllers/csrfController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

// Get CSRF token (requires authentication)
router.get("/csrf-token", authenticate, getCsrfToken);

export default router;

