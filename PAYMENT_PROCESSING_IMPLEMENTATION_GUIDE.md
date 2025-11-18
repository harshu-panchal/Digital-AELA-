# Payment Processing Implementation Guide

## Digital AELA Platform - Complete Payment Integration

**Last Updated:** January 2025  
**Status:** Implementation Guide

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Payment Gateway Selection](#payment-gateway-selection)
3. [Backend Implementation](#backend-implementation)
4. [Frontend Implementation](#frontend-implementation)
5. [Security Considerations](#security-considerations)
6. [Testing Strategy](#testing-strategy)
7. [Deployment Checklist](#deployment-checklist)

---

## 🎯 Overview

### Current State
- ✅ Course model has `price` and `currency` fields
- ✅ Enrollment controller checks for free courses (price === 0)
- ✅ Settings model has "payment" category
- ❌ No payment processing implementation
- ❌ No payment history tracking
- ❌ No invoice generation

### Implementation Goals
1. Integrate payment gateway (Stripe recommended)
2. Create payment processing flow for paid courses
3. Track payment history
4. Generate invoices
5. Handle refunds (admin only)
6. Webhook integration for payment confirmation

---

## 💳 Payment Gateway Selection

### Recommended: Stripe

**Why Stripe?**
- ✅ Developer-friendly API
- ✅ Excellent documentation
- ✅ Global support (including UAE/AED)
- ✅ Strong security (PCI compliant)
- ✅ Supports subscriptions (future feature)
- ✅ Webhook support
- ✅ Test mode for development

### Alternative: Razorpay (India-focused)

**When to use:**
- Primary market is India
- Need local payment methods (UPI, NetBanking)
- Lower transaction fees in India

### Alternative: PayPal

**When to use:**
- Need PayPal account support
- International audience preference
- Simpler integration for basic needs

---

## 🔧 Backend Implementation

### Step 1: Install Dependencies

```bash
cd backend
npm install stripe
# or for Razorpay
npm install razorpay
```

### Step 2: Create Payment Model

**File:** `backend/src/models/Payment.js`

```javascript
import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "AED",
      uppercase: true,
    },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed", "refunded", "cancelled"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["card", "bank_transfer", "wallet", "other"],
      default: "card",
    },
    gateway: {
      type: String,
      enum: ["stripe", "razorpay", "paypal"],
      required: true,
    },
    gatewayTransactionId: {
      type: String,
      required: true,
    },
    gatewayPaymentIntentId: {
      type: String, // Stripe PaymentIntent ID
    },
    receiptUrl: {
      type: String, // Gateway receipt URL
    },
    invoiceNumber: {
      type: String,
      unique: true,
      sparse: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    refundedAt: {
      type: Date,
    },
    refundAmount: {
      type: Number,
      default: 0,
    },
    refundReason: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
paymentSchema.index({ user: 1, createdAt: -1 });
paymentSchema.index({ course: 1 });
paymentSchema.index({ gatewayTransactionId: 1 });
paymentSchema.index({ status: 1 });

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;
```

### Step 3: Create Payment Controller

**File:** `backend/src/controllers/paymentController.js`

```javascript
import Payment from "../models/Payment.js";
import Course from "../models/Course.js";
import Enrollment from "../models/Enrollment.js";
import User from "../models/User.js";
import mongoose from "mongoose";
import Stripe from "stripe";

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

/**
 * Create Payment Intent
 * POST /api/v1/payments/create-intent
 */
export const createPaymentIntent = async (req, res, next) => {
  try {
    const { courseId } = req.body;
    const { userId } = req.auth;

    if (!mongoose.isValidObjectId(courseId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid course ID",
        },
      });
    }

    // Get course details
    const course = await Course.findOne({ _id: courseId, status: "published" });
    if (!course) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Course not found",
        },
      });
    }

    // Check if course is free
    if (course.price === 0) {
      return res.status(400).json({
        error: {
          code: "INVALID_REQUEST",
          message: "This course is free. Use enrollment endpoint instead.",
        },
      });
    }

    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({
      student: userId,
      course: courseId,
    });

    if (existingEnrollment) {
      return res.status(409).json({
        error: {
          code: "ALREADY_ENROLLED",
          message: "You are already enrolled in this course",
        },
      });
    }

    // Check for existing pending payment
    const existingPayment = await Payment.findOne({
      user: userId,
      course: courseId,
      status: { $in: ["pending", "processing"] },
    });

    if (existingPayment) {
      return res.status(409).json({
        error: {
          code: "PAYMENT_PENDING",
          message: "A payment is already in progress for this course",
          paymentId: existingPayment._id,
        },
      });
    }

    // Get user details
    const user = await User.findById(userId).select("email fullName").lean();

    // Create Stripe Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(course.price * 100), // Convert to cents
      currency: course.currency.toLowerCase(),
      metadata: {
        userId: userId.toString(),
        courseId: courseId.toString(),
        courseTitle: course.title,
      },
      description: `Payment for course: ${course.title}`,
      receipt_email: user.email,
    });

    // Create payment record
    const payment = await Payment.create({
      user: userId,
      course: courseId,
      amount: course.price,
      currency: course.currency,
      status: "pending",
      gateway: "stripe",
      gatewayTransactionId: paymentIntent.id,
      gatewayPaymentIntentId: paymentIntent.id,
      metadata: {
        courseTitle: course.title,
        userName: user.fullName,
      },
    });

    return res.status(201).json({
      paymentId: payment._id,
      clientSecret: paymentIntent.client_secret,
      amount: course.price,
      currency: course.currency,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Confirm Payment (Webhook handler)
 * POST /api/v1/payments/webhook
 */
export const handlePaymentWebhook = async (req, res, next) => {
  try {
    const sig = req.headers["stripe-signature"];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentSuccess(event.data.object);
        break;
      case "payment_intent.payment_failed":
        await handlePaymentFailure(event.data.object);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    return next(error);
  }
};

/**
 * Handle successful payment
 */
const handlePaymentSuccess = async (paymentIntent) => {
  try {
    const { userId, courseId } = paymentIntent.metadata;

    // Update payment status
    const payment = await Payment.findOneAndUpdate(
      { gatewayPaymentIntentId: paymentIntent.id },
      {
        status: "completed",
        receiptUrl: paymentIntent.charges?.data[0]?.receipt_url,
        invoiceNumber: generateInvoiceNumber(),
      },
      { new: true }
    );

    if (!payment) {
      console.error("Payment not found for PaymentIntent:", paymentIntent.id);
      return;
    }

    // Create enrollment
    const enrollment = await Enrollment.create({
      student: userId,
      course: courseId,
      status: "active",
      enrolledAt: new Date(),
      lastAccessedAt: new Date(),
      payment: payment._id, // Link enrollment to payment
    });

    // Send confirmation email (implement email service)
    // await sendPaymentConfirmationEmail(userId, payment, enrollment);

    console.log("Payment successful and enrollment created:", enrollment._id);
  } catch (error) {
    console.error("Error handling payment success:", error);
  }
};

/**
 * Handle failed payment
 */
const handlePaymentFailure = async (paymentIntent) => {
  try {
    await Payment.findOneAndUpdate(
      { gatewayPaymentIntentId: paymentIntent.id },
      {
        status: "failed",
        metadata: {
          failureReason: paymentIntent.last_payment_error?.message || "Payment failed",
        },
      }
    );

    console.log("Payment failed for PaymentIntent:", paymentIntent.id);
  } catch (error) {
    console.error("Error handling payment failure:", error);
  }
};

/**
 * Get Payment History
 * GET /api/v1/payments/history
 */
export const getPaymentHistory = async (req, res, next) => {
  try {
    const { userId } = req.auth;
    const { page = 1, pageSize = 10, status } = req.query;

    const query = { user: userId };
    if (status) {
      query.status = status;
    }

    const skip = (Number(page) - 1) * Number(pageSize);

    const [payments, total] = await Promise.all([
      Payment.find(query)
        .populate("course", "title thumbnailUrl")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(pageSize))
        .lean(),
      Payment.countDocuments(query),
    ]);

    return res.json({
      payments,
      pagination: {
        page: Number(page),
        pageSize: Number(pageSize),
        total,
        totalPages: Math.ceil(total / Number(pageSize)),
      },
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get Payment Details
 * GET /api/v1/payments/:paymentId
 */
export const getPaymentDetails = async (req, res, next) => {
  try {
    const { paymentId } = req.params;
    const { userId, userRole } = req.auth;

    const payment = await Payment.findById(paymentId)
      .populate("course", "title description thumbnailUrl")
      .populate("user", "fullName email")
      .lean();

    if (!payment) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Payment not found",
        },
      });
    }

    // Check authorization (user can only see their own payments, admin can see all)
    if (payment.user._id.toString() !== userId && userRole !== "admin" && userRole !== "super-admin") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "You don't have permission to view this payment",
        },
      });
    }

    return res.json({ payment });
  } catch (error) {
    return next(error);
  }
};

/**
 * Process Refund (Admin Only)
 * POST /api/v1/payments/:paymentId/refund
 */
export const processRefund = async (req, res, next) => {
  try {
    const { paymentId } = req.params;
    const { userRole } = req.auth;
    const { amount, reason } = req.body;

    // Check admin authorization
    if (userRole !== "admin" && userRole !== "super-admin") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only admins can process refunds",
        },
      });
    }

    const payment = await Payment.findById(paymentId);

    if (!payment) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Payment not found",
        },
      });
    }

    if (payment.status !== "completed") {
      return res.status(400).json({
        error: {
          code: "INVALID_REQUEST",
          message: "Only completed payments can be refunded",
        },
      });
    }

    if (payment.status === "refunded") {
      return res.status(400).json({
        error: {
          code: "ALREADY_REFUNDED",
          message: "This payment has already been refunded",
        },
      });
    }

    // Calculate refund amount (full or partial)
    const refundAmount = amount ? Number(amount) : payment.amount;

    if (refundAmount > payment.amount) {
      return res.status(400).json({
        error: {
          code: "INVALID_AMOUNT",
          message: "Refund amount cannot exceed payment amount",
        },
      });
    }

    // Process refund via Stripe
    const refund = await stripe.refunds.create({
      payment_intent: payment.gatewayPaymentIntentId,
      amount: Math.round(refundAmount * 100), // Convert to cents
      reason: reason || "requested_by_customer",
    });

    // Update payment record
    payment.status = "refunded";
    payment.refundedAt = new Date();
    payment.refundAmount = refundAmount;
    payment.refundReason = reason || "Admin refund";
    await payment.save();

    // Optionally unenroll student
    if (refundAmount === payment.amount) {
      await Enrollment.findOneAndUpdate(
        { student: payment.user, course: payment.course },
        { status: "cancelled" }
      );
    }

    return res.json({
      message: "Refund processed successfully",
      refund: {
        id: refund.id,
        amount: refundAmount,
        status: refund.status,
      },
      payment,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Generate Invoice Number
 */
const generateInvoiceNumber = () => {
  const prefix = "INV";
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
  return `${prefix}-${timestamp}-${random}`;
};
```

### Step 4: Create Payment Routes

**File:** `backend/src/routes/paymentRoutes.js`

```javascript
import { Router } from "express";
import {
  createPaymentIntent,
  getPaymentHistory,
  getPaymentDetails,
  processRefund,
  handlePaymentWebhook,
} from "../controllers/paymentController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import express from "express";

const router = Router();

// Webhook endpoint (no auth, uses Stripe signature verification)
router.post(
  "/webhook",
  express.raw({ type: "application/json" }), // Raw body for webhook verification
  handlePaymentWebhook
);

// Authenticated routes
router.post("/create-intent", requireAuth(["student"]), createPaymentIntent);
router.get("/history", requireAuth(["student"]), getPaymentHistory);
router.get("/:paymentId", requireAuth([]), getPaymentDetails);
router.post("/:paymentId/refund", requireAuth(["admin", "super-admin"]), processRefund);

export default router;
```

### Step 5: Update Enrollment Model

**File:** `backend/src/models/Enrollment.js` (add payment reference)

```javascript
// Add to enrollment schema:
payment: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Payment",
},
```

### Step 6: Update Enrollment Controller

**File:** `backend/src/controllers/enrollmentController.js`

```javascript
// Modify enrollInCourse function to check for payment for paid courses:

export const enrollInCourse = async (req, res, next) => {
  try {
    // ... existing code ...

    const isFreeCourse = course.price === 0 || (course.metadata && course.metadata.price === 0);

    // For paid courses, check if payment exists
    if (!isFreeCourse) {
      const payment = await Payment.findOne({
        user: userId,
        course: courseId,
        status: "completed",
      });

      if (!payment) {
        return res.status(402).json({
          error: {
            code: "PAYMENT_REQUIRED",
            message: "Payment required to enroll in this course",
            coursePrice: course.price,
            currency: course.currency,
          },
        });
      }
    }

    // ... rest of enrollment logic ...
  } catch (error) {
    return next(error);
  }
};
```

### Step 7: Add Environment Variables

**File:** `.env`

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Payment Settings
PAYMENT_GATEWAY=stripe
DEFAULT_CURRENCY=AED
```

### Step 8: Register Routes

**File:** `backend/src/app.js`

```javascript
import paymentRoutes from "./routes/paymentRoutes.js";

// Add after other routes:
app.use("/api/v1/payments", paymentRoutes);
```

---

## 🎨 Frontend Implementation

### Step 1: Install Stripe.js

```bash
cd frontend
npm install @stripe/stripe-js @stripe/react-stripe-js
```

### Step 2: Create Payment Service

**File:** `frontend/src/services/api/payments.js`

```javascript
import { apiRequest } from "./baseClient";

/**
 * Create payment intent
 * POST /api/v1/payments/create-intent
 */
export const createPaymentIntent = async (courseId) => {
  return apiRequest("/payments/create-intent", {
    method: "POST",
    body: { courseId },
  });
};

/**
 * Get payment history
 * GET /api/v1/payments/history
 */
export const getPaymentHistory = async (params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", params.page);
  if (params.pageSize) searchParams.set("pageSize", params.pageSize);
  if (params.status) searchParams.set("status", params.status);

  const query = searchParams.toString();
  return apiRequest(`/payments/history${query ? `?${query}` : ""}`);
};

/**
 * Get payment details
 * GET /api/v1/payments/:paymentId
 */
export const getPaymentDetails = async (paymentId) => {
  return apiRequest(`/payments/${paymentId}`);
};
```

### Step 3: Create Payment Component

**File:** `frontend/src/components/PaymentForm.jsx`

```javascript
import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { createPaymentIntent } from "@/services/api/payments";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const PaymentForm = ({ courseId, amount, currency, onSuccess, onError }) => {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm
        courseId={courseId}
        amount={amount}
        currency={currency}
        onSuccess={onSuccess}
        onError={onError}
      />
    </Elements>
  );
};

const CheckoutForm = ({ courseId, amount, currency, onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create payment intent
      const { clientSecret, paymentId } = await createPaymentIntent(courseId);

      // Confirm payment
      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardElement),
          },
        }
      );

      if (confirmError) {
        setError(confirmError.message);
        onError?.(confirmError);
      } else if (paymentIntent.status === "succeeded") {
        onSuccess?.(paymentIntent);
      }
    } catch (err) {
      setError(err.message || "Payment failed");
      onError?.(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 border rounded-lg">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: "16px",
                color: "#424770",
                "::placeholder": {
                  color: "#aab7c4",
                },
              },
            },
          }}
        />
      </div>

      {error && (
        <div className="text-red-600 text-sm">{error}</div>
      )}

      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg disabled:opacity-50"
      >
        {loading ? "Processing..." : `Pay ${currency} ${amount}`}
      </button>
    </form>
  );
};

export default PaymentForm;
```

### Step 4: Update Course Detail Page

**File:** `frontend/modules/business-management/business-pages/CourseDetail.jsx`

```javascript
// Add payment flow for paid courses:

import PaymentForm from "@/components/PaymentForm";
import { getEnrollmentStatus, enrollInCourse } from "@/services/api/courses";

const CourseDetail = () => {
  const [showPayment, setShowPayment] = useState(false);
  const [enrollmentStatus, setEnrollmentStatus] = useState(null);

  useEffect(() => {
    checkEnrollmentStatus();
  }, [courseId]);

  const checkEnrollmentStatus = async () => {
    try {
      const { enrolled } = await getEnrollmentStatus(courseId);
      setEnrollmentStatus(enrolled);
    } catch (error) {
      // Not enrolled
    }
  };

  const handlePaymentSuccess = async () => {
    // Payment successful, enrollment will be created via webhook
    // Redirect or show success message
    setTimeout(() => {
      checkEnrollmentStatus();
      setShowPayment(false);
    }, 2000);
  };

  return (
    <div>
      {/* Course details */}
      
      {course.price > 0 && !enrollmentStatus && (
        <div>
          {!showPayment ? (
            <button
              onClick={() => setShowPayment(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg"
            >
              Enroll Now - {course.currency} {course.price}
            </button>
          ) : (
            <PaymentForm
              courseId={courseId}
              amount={course.price}
              currency={course.currency}
              onSuccess={handlePaymentSuccess}
              onError={(error) => console.error(error)}
            />
          )}
        </div>
      )}

      {course.price === 0 && !enrollmentStatus && (
        <button
          onClick={handleFreeEnrollment}
          className="bg-green-600 text-white px-6 py-3 rounded-lg"
        >
          Enroll for Free
        </button>
      )}
    </div>
  );
};
```

### Step 5: Create Payment History Page

**File:** `frontend/modules/student/pages/PaymentHistory.jsx`

```javascript
import { useState, useEffect } from "react";
import { getPaymentHistory } from "@/services/api/payments";

const PaymentHistory = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async (page = 1) => {
    setLoading(true);
    try {
      const { payments: data, pagination: pag } = await getPaymentHistory({ page });
      setPayments(data);
      setPagination(pag);
    } catch (error) {
      console.error("Error fetching payments:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Payment History</h1>
      
      {loading ? (
        <div>Loading...</div>
      ) : payments.length === 0 ? (
        <div>No payments found</div>
      ) : (
        <div className="space-y-4">
          {payments.map((payment) => (
            <div key={payment._id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{payment.course?.title}</h3>
                  <p className="text-sm text-gray-600">
                    {new Date(payment.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold">
                    {payment.currency} {payment.amount}
                  </p>
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      payment.status === "completed"
                        ? "bg-green-100 text-green-800"
                        : payment.status === "failed"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {payment.status}
                  </span>
                </div>
              </div>
              {payment.invoiceNumber && (
                <p className="text-sm text-gray-500 mt-2">
                  Invoice: {payment.invoiceNumber}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PaymentHistory;
```

---

## 🔒 Security Considerations

### 1. Webhook Security
- Always verify webhook signatures
- Use HTTPS for webhook endpoints
- Store webhook secret securely

### 2. Payment Data
- Never store credit card details
- Use Stripe's secure payment methods
- Encrypt sensitive payment metadata

### 3. Authorization
- Verify user owns payment before showing details
- Admin-only refund endpoints
- Validate course ownership before payment

### 4. Rate Limiting
- Limit payment intent creation
- Prevent duplicate payments
- Monitor for suspicious activity

---

## 🧪 Testing Strategy

### 1. Test Cards (Stripe Test Mode)

```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
3D Secure: 4000 0025 0000 3155
```

### 2. Test Scenarios

- ✅ Free course enrollment (no payment)
- ✅ Paid course payment flow
- ✅ Payment success
- ✅ Payment failure
- ✅ Duplicate payment prevention
- ✅ Webhook handling
- ✅ Refund processing
- ✅ Payment history

### 3. Integration Tests

```javascript
// Example test
describe("Payment Flow", () => {
  it("should create payment intent for paid course", async () => {
    const response = await request(app)
      .post("/api/v1/payments/create-intent")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ courseId: paidCourseId });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("clientSecret");
  });
});
```

---

## 📋 Deployment Checklist

### Backend
- [ ] Install Stripe package
- [ ] Create Payment model
- [ ] Create payment controller
- [ ] Create payment routes
- [ ] Update enrollment controller
- [ ] Add environment variables
- [ ] Register routes in app.js
- [ ] Set up webhook endpoint
- [ ] Test webhook locally (use Stripe CLI)

### Frontend
- [ ] Install Stripe.js
- [ ] Create payment service
- [ ] Create PaymentForm component
- [ ] Update CourseDetail page
- [ ] Create PaymentHistory page
- [ ] Add payment route
- [ ] Add Stripe publishable key to env

### Environment Setup
- [ ] Get Stripe API keys (test & production)
- [ ] Set up webhook in Stripe dashboard
- [ ] Configure webhook secret
- [ ] Test payment flow end-to-end

### Production
- [ ] Switch to production Stripe keys
- [ ] Update webhook URL
- [ ] Enable webhook signature verification
- [ ] Set up payment monitoring
- [ ] Configure refund policies
- [ ] Set up invoice templates

---

## 🚀 Quick Start

1. **Get Stripe Account**
   - Sign up at https://stripe.com
   - Get API keys from dashboard

2. **Backend Setup**
   ```bash
   npm install stripe
   # Add environment variables
   # Create Payment model
   # Create payment controller
   # Register routes
   ```

3. **Frontend Setup**
   ```bash
   npm install @stripe/stripe-js @stripe/react-stripe-js
   # Create PaymentForm component
   # Integrate into CourseDetail
   ```

4. **Test**
   - Use Stripe test cards
   - Test webhook with Stripe CLI
   - Verify enrollment creation

---

## 📚 Additional Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe React Components](https://stripe.com/docs/stripe-js/react)
- [Webhook Best Practices](https://stripe.com/docs/webhooks/best-practices)
- [Payment Security Guide](https://stripe.com/docs/security)

---

**Estimated Implementation Time:** 2-3 weeks

**Priority:** High (Critical for monetization)

---

**Last Updated:** January 2025

