import { Router } from "express";
import {
  createRedemptionRequest,
  getMyRedemptionRequests,
  getAllRedemptionRequests,
  getRedemptionRequest,
  approveRedemptionRequest,
  rejectRedemptionRequest,
} from "../controllers/redemptionRequestController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

// User routes
router.post("/", requireAuth(), createRedemptionRequest);
router.get("/my-requests", requireAuth(), getMyRedemptionRequests);
router.get("/:id", requireAuth(), getRedemptionRequest);

// Admin routes
router.get("/", requireAuth(["super-admin"]), getAllRedemptionRequests);
router.patch("/:id/approve", requireAuth(["super-admin"]), approveRedemptionRequest);
router.patch("/:id/reject", requireAuth(["super-admin"]), rejectRedemptionRequest);

export default router;

