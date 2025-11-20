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
} from "../controllers/paymentController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

// Create payment
router.post("/", authenticate, createPayment);

// Get payment history
router.get("/history", authenticate, getPaymentHistory);

// Get pending payments
router.get("/pending", authenticate, getPendingPayments);

// Get teacher earnings
router.get("/earnings", authenticate, getTeacherEarnings);

// Get payment details
router.get("/:paymentId", authenticate, getPaymentDetails);

// Update payment
router.put("/:paymentId", authenticate, updatePayment);

// Process refund (admin only)
router.post("/:paymentId/refund", authenticate, processRefund);

// Get invoice
router.get("/:paymentId/invoice", authenticate, getInvoice);

export default router;

