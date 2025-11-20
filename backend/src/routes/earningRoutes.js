import express from "express";
import {
  getEarningsSummary,
  getMonthlyEarnings,
  getCourseEarnings,
  createPayoutRequest,
  getPayoutRequests,
  updatePayoutRequest,
  generatePaymentSlip,
  getPaymentSlips,
  getReferralEarnings,
} from "../controllers/earningController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

// Teacher routes
router.get("/summary", authenticate, getEarningsSummary);
router.get("/monthly", authenticate, getMonthlyEarnings);
router.get("/courses", authenticate, getCourseEarnings);
router.get("/referrals", authenticate, getReferralEarnings);
router.post("/payout-requests", authenticate, createPayoutRequest);
router.get("/payout-requests", authenticate, getPayoutRequests);
router.get("/payment-slips", authenticate, getPaymentSlips);

// Admin routes
router.put("/payout-requests/:requestId", authenticate, updatePayoutRequest);
router.post("/payment-slips", authenticate, generatePaymentSlip);

export default router;

