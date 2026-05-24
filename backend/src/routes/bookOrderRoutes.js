import express from "express";
import {
  createGuestBookOrder,
  createRegisteredBookOrder,
  verifyBookOrderPayment,
  getBookOrders,
  getBookOrderStats,
  getBookOrderById,
  updateBookOrderStatus,
  getUserBookOrders,
  getUserBookOrderById,
} from "../controllers/bookOrderController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { validateCsrfToken } from "../middleware/csrfMiddleware.js";
import { paymentRateLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

// ─── Public / Guest ────────────────────────────────────────────────────────
// Create a guest book order (no auth required)
router.post("/", paymentRateLimiter, createGuestBookOrder);

// Verify payment after Razorpay callback (no auth — callback from Razorpay)
router.post("/verify-payment", verifyBookOrderPayment);

// ─── Authenticated Users ───────────────────────────────────────────────────
// Create a registered user book order
router.post(
  "/registered",
  authenticate,
  paymentRateLimiter,
  validateCsrfToken,
  createRegisteredBookOrder
);

// Get user's own orders
router.get("/my-orders", authenticate, getUserBookOrders);
router.get("/my-orders/:orderId", authenticate, getUserBookOrderById);

// ─── Admin ─────────────────────────────────────────────────────────────────
// IMPORTANT: specific routes before /:orderId catch-all
router.get("/admin/stats", authenticate, getBookOrderStats);
router.get("/admin", authenticate, getBookOrders);
router.get("/admin/:orderId", authenticate, getBookOrderById);
router.put("/admin/:orderId/status", authenticate, validateCsrfToken, updateBookOrderStatus);

export default router;
