import express from "express";
import {
  createPayment,
  updatePayment,
  getPaymentHistory,
  getPaymentDetails,
  processRefund,
  getInvoice,
  getPendingPayments,
  getTeacherEarnings,
  createRazorpayOrder,
  createRazorpayPaymentLink,
  verifyRazorpayPayment,
  handleRazorpayCallback,
  verifyPaymentStatus,
} from "../controllers/paymentController.js";
import { verifyRazorpayCallback } from "../controllers/paymentCallbackVerify.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { validateCsrfToken } from "../middleware/csrfMiddleware.js";
import { paymentRateLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

// Create payment (state-changing - requires CSRF and rate limiting)
router.post("/", authenticate, paymentRateLimiter, validateCsrfToken, createPayment);

// Get payment history
router.get("/history", authenticate, getPaymentHistory);

// Get pending payments
router.get("/pending", authenticate, getPendingPayments);

// Get teacher earnings
router.get("/earnings", authenticate, getTeacherEarnings);

// Webhooks removed - using callback-based verification only

// Razorpay payment callback (redirect-based, no authentication)
router.get("/razorpay/callback", handleRazorpayCallback);

// Razorpay payment verification (from frontend callback)
router.post("/razorpay/verify", authenticate, validateCsrfToken, verifyRazorpayPayment);

// IMPORTANT: Specific routes with /:paymentId must come BEFORE the catch-all /:paymentId route
// Process refund (admin only, state-changing - requires CSRF)
router.post("/:paymentId/refund", authenticate, validateCsrfToken, processRefund);

// Get invoice
router.get("/:paymentId/invoice", authenticate, getInvoice);

// Create Razorpay order for payment (modal-based)
router.post("/:paymentId/razorpay/order", authenticate, paymentRateLimiter, validateCsrfToken, createRazorpayOrder);

// Create Razorpay payment link (redirect-based)
router.post("/:paymentId/razorpay/payment-link", authenticate, paymentRateLimiter, validateCsrfToken, createRazorpayPaymentLink);

// Verify payment status manually (from Razorpay)
router.post("/:paymentId/verify-status", authenticate, verifyPaymentStatus);

// Immediate payment verification from callback (NEW - fixes timeout issue)
router.post("/:paymentId/verify-razorpay-callback", authenticate, verifyRazorpayCallback);

// Get payment details (catch-all - must be last)
router.get("/:paymentId", authenticate, getPaymentDetails);

// Update payment (state-changing - requires CSRF)
router.put("/:paymentId", authenticate, validateCsrfToken, updatePayment);

export default router;

