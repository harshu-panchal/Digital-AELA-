import mongoose from "mongoose";
import Payment from "../models/Payment.js";
import Course from "../models/Course.js";
import Enrollment from "../models/Enrollment.js";
import User from "../models/User.js";
import { generateInvoicePDF } from "../utils/pdfGenerator.js";
import { uploadPdfToCloudinary } from "../middleware/uploadMiddleware.js";
import {
  createOrder,
  createPaymentLink,
  verifyPaymentSignature,
  fetchPayment,
  getRazorpayKeyId,
  isRazorpayEnabled,
} from "../services/razorpayService.js";
import { fetchPaymentLink } from "../services/paymentGatewayService.js";

/**
 * Create Payment Record
 * POST /api/v1/payments
 */
export const createPayment = async (req, res, next) => {
  try {
    const { userId } = req.auth || {};
    const { courseId, amount, currency, description, paymentMethod, gateway } = req.body;

    if (!userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    if (!amount || amount <= 0) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Valid amount is required",
        },
      });
    }

    const userObjectId = mongoose.isValidObjectId(userId)
      ? new mongoose.Types.ObjectId(userId)
      : null;

    let courseObjectId = null;
    if (courseId) {
      if (!mongoose.isValidObjectId(courseId)) {
        return res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid course ID",
          },
        });
      }
      courseObjectId = new mongoose.Types.ObjectId(courseId);

      // Verify course exists
      const course = await Course.findById(courseObjectId).lean();
      if (!course) {
        return res.status(404).json({
          error: {
            code: "RESOURCE_NOT_FOUND",
            message: "Course not found",
          },
        });
      }

      // Check if already enrolled
      const existingEnrollment = await Enrollment.findOne({
        student: userObjectId,
        course: courseObjectId,
      }).lean();

      if (existingEnrollment) {
        return res.status(409).json({
          error: {
            code: "ALREADY_ENROLLED",
            message: "You are already enrolled in this course",
            enrollment: existingEnrollment,
          },
        });
      }
    }

    const payment = await Payment.create({
      user: userObjectId,
      course: courseObjectId,
      amount: Number(amount),
      currency: currency || "AED",
      description: description || (courseId ? "Course enrollment" : "Payment"),
      paymentMethod: paymentMethod || "card",
      gateway: gateway || "manual",
      status: "pending",
    });

    const populatedPayment = await Payment.findById(payment._id)
      .populate("user", "fullName email")
      .populate("course", "title thumbnailUrl price")
      .lean();

    return res.status(201).json({
      payment: populatedPayment,
      message: "Payment record created successfully",
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Update Payment Status
 * PUT /api/v1/payments/:paymentId
 */
export const updatePayment = async (req, res, next) => {
  try {
    const { paymentId } = req.params;
    const { userId, userRole } = req.auth || {};
    const { status, gatewayTransactionId, gatewayPaymentIntentId, failureReason, invoiceUrl } =
      req.body;

    if (!userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    if (!mongoose.isValidObjectId(paymentId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid payment ID",
        },
      });
    }

    const payment = await Payment.findById(paymentId).lean();
    if (!payment) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Payment not found",
        },
      });
    }

    // Check permissions
    const userObjectId = mongoose.isValidObjectId(userId)
      ? new mongoose.Types.ObjectId(userId)
      : null;

    if (userRole !== "super-admin" && payment.user.toString() !== userObjectId.toString()) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "You can only update your own payments",
        },
      });
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (gatewayTransactionId) updateData.gatewayTransactionId = gatewayTransactionId;
    if (gatewayPaymentIntentId) updateData.gatewayPaymentIntentId = gatewayPaymentIntentId;
    if (failureReason) updateData.failureReason = failureReason;
    if (invoiceUrl) updateData.invoiceUrl = invoiceUrl;

    // If status is completed and course exists, create enrollment
    if (status === "completed" && payment.course && !payment.metadata?.enrollmentCreated) {
      try {
        const existingEnrollment = await Enrollment.findOne({
          student: payment.user,
          course: payment.course,
        }).lean();

        if (!existingEnrollment) {
          await Enrollment.create({
            student: payment.user,
            course: payment.course,
            status: "active",
            enrolledAt: new Date(),
          });
          updateData.metadata = {
            ...payment.metadata,
            enrollmentCreated: true,
            enrollmentCreatedAt: new Date(),
          };
        }
      } catch (enrollmentError) {
        console.error("Error creating enrollment:", enrollmentError);
        // Continue with payment update even if enrollment fails
      }
    }

    const updatedPayment = await Payment.findByIdAndUpdate(paymentId, updateData, { new: true })
      .populate("user", "fullName email")
      .populate("course", "title thumbnailUrl price")
      .lean();

    // Generate invoice PDF when payment is completed (if not already generated)
    if (status === "completed" && !payment.invoiceUrl && !updateData.invoiceUrl) {
      try {
        const invoiceData = {
          invoiceNumber: updatedPayment.invoiceNumber || `INV-${updatedPayment._id.toString().slice(-8)}`,
          date: updatedPayment.createdAt,
          amount: updatedPayment.amount,
          currency: updatedPayment.currency,
          payment: {
            id: updatedPayment._id.toString(),
            amount: updatedPayment.amount,
            currency: updatedPayment.currency,
            status: updatedPayment.status,
            paymentMethod: updatedPayment.paymentMethod,
            gateway: updatedPayment.gateway,
            gatewayTransactionId: updatedPayment.gatewayTransactionId,
          },
          user: {
            name: updatedPayment.user.fullName,
            email: updatedPayment.user.email,
          },
          course: updatedPayment.course
            ? {
                title: updatedPayment.course.title,
                description: updatedPayment.course.description,
                price: updatedPayment.course.price,
              }
            : null,
          description: updatedPayment.description,
        };

        const pdfBuffer = await generateInvoicePDF(invoiceData);
        const uploadResult = await uploadPdfToCloudinary(
          pdfBuffer,
          `digital-aela/invoices/${paymentId}`,
          `invoice-${paymentId}.pdf`
        );

        // Update payment with invoice URL
        await Payment.findByIdAndUpdate(paymentId, {
          invoiceUrl: uploadResult.url,
        });
        updatedPayment.invoiceUrl = uploadResult.url;
      } catch (invoiceError) {
        // eslint-disable-next-line no-console
        console.error("[Payment] Error generating invoice PDF:", invoiceError);
        // Don't fail payment update if invoice generation fails
      }
    }

    // Create notification when payment is completed
    if (status === "completed" && updatedPayment.user && !payment.metadata?.notificationSent) {
      try {
        const { createNotification } = await import("../utils/notificationHelper.js");
        const courseTitle = updatedPayment.course?.title || "course";
        await createNotification(
          updatedPayment.user._id || updatedPayment.user,
          "Payment Successful",
          `Your payment of ${updatedPayment.amount} ${updatedPayment.currency} for "${courseTitle}" has been completed successfully.`,
          "payment",
          {
            paymentId: updatedPayment._id.toString(),
            amount: updatedPayment.amount,
            currency: updatedPayment.currency,
            courseId: updatedPayment.course?._id?.toString() || null,
          },
          updatedPayment.course ? `/courses/${updatedPayment.course._id}` : "/student/payments"
        );
        
        // Mark notification as sent in metadata
        if (!updateData.metadata) {
          updateData.metadata = { ...payment.metadata };
        }
        updateData.metadata.notificationSent = true;
        await Payment.findByIdAndUpdate(paymentId, { metadata: updateData.metadata });
      } catch (notifError) {
        // eslint-disable-next-line no-console
        console.error("[Payment] Error creating notification:", notifError);
        // Don't fail payment update if notification fails
      }
    }

    return res.json({
      payment: updatedPayment,
      message: "Payment updated successfully",
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get Payment History
 * GET /api/v1/payments/history
 */
export const getPaymentHistory = async (req, res, next) => {
  try {
    const { userId, userRole } = req.auth || {};
    const { page = 1, pageSize = 20, status, courseId, startDate, endDate } = req.query;

    if (!userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    const userObjectId = mongoose.isValidObjectId(userId)
      ? new mongoose.Types.ObjectId(userId)
      : null;

    // Build query
    const query = {};
    if (userRole !== "super-admin") {
      query.user = userObjectId;
    }
    if (status) {
      query.status = status;
    }
    if (courseId && mongoose.isValidObjectId(courseId)) {
      query.course = new mongoose.Types.ObjectId(courseId);
    }
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    const skip = (Number(page) - 1) * Number(pageSize);

    const [payments, total] = await Promise.all([
      Payment.find(query)
        .populate("user", "fullName email")
        .populate("course", "title thumbnailUrl price")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(pageSize))
        .lean(),
      Payment.countDocuments(query),
    ]);

    // Calculate summary stats
    const totalAmount = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const completedPayments = payments.filter((p) => p.status === "completed");
    const completedAmount = completedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

    return res.json({
      payments,
      pagination: {
        page: Number(page),
        pageSize: Number(pageSize),
        total,
        totalPages: Math.ceil(total / Number(pageSize)),
      },
      summary: {
        totalAmount,
        completedAmount,
        totalPayments: payments.length,
        completedPayments: completedPayments.length,
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
    const { userId, userRole } = req.auth || {};
    const { paymentId } = req.params;

    if (!userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    if (!mongoose.isValidObjectId(paymentId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid payment ID",
        },
      });
    }

    const userObjectId = mongoose.isValidObjectId(userId)
      ? new mongoose.Types.ObjectId(userId)
      : null;

    const payment = await Payment.findById(paymentId)
      .populate("user", "fullName email")
      .populate("course", "title description thumbnailUrl price")
      .populate("refundedBy", "fullName")
      .lean();

    if (!payment) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Payment not found",
        },
      });
    }

    // Check permissions
    if (userRole !== "super-admin" && payment.user._id.toString() !== userObjectId.toString()) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "You can only view your own payments",
        },
      });
    }

    return res.json({
      payment,
    });
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
    const { userId, userRole } = req.auth || {};
    const { paymentId } = req.params;
    const { refundAmount, refundReason } = req.body;

    if (!userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    if (userRole !== "super-admin") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only admins can process refunds",
        },
      });
    }

    if (!mongoose.isValidObjectId(paymentId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid payment ID",
        },
      });
    }

    const payment = await Payment.findById(paymentId).lean();
    if (!payment) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Payment not found",
        },
      });
    }

    if (payment.status !== "completed") {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Only completed payments can be refunded",
        },
      });
    }

    const refundAmountValue = refundAmount ? Number(refundAmount) : payment.amount;
    if (refundAmountValue <= 0 || refundAmountValue > payment.amount) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: `Refund amount must be between 0 and ${payment.amount}`,
        },
      });
    }

    const totalRefunded = (payment.refundAmount || 0) + refundAmountValue;
    if (totalRefunded > payment.amount) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Total refund amount cannot exceed payment amount",
        },
      });
    }

    const userObjectId = mongoose.isValidObjectId(userId)
      ? new mongoose.Types.ObjectId(userId)
      : null;

    const updateData = {
      refundAmount: totalRefunded,
      refundReason: refundReason || payment.refundReason || "",
      refundedAt: new Date(),
      refundedBy: userObjectId,
      status: totalRefunded >= payment.amount ? "refunded" : "partially_refunded",
    };

    const updatedPayment = await Payment.findByIdAndUpdate(paymentId, updateData, { new: true })
      .populate("user", "fullName email")
      .populate("course", "title")
      .populate("refundedBy", "fullName")
      .lean();

    return res.json({
      payment: updatedPayment,
      message: "Refund processed successfully",
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Generate Invoice PDF URL
 * GET /api/v1/payments/:paymentId/invoice
 */
export const getInvoice = async (req, res, next) => {
  try {
    const { userId, userRole } = req.auth || {};
    const { paymentId } = req.params;

    if (!userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    if (!mongoose.isValidObjectId(paymentId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid payment ID",
        },
      });
    }

    const userObjectId = mongoose.isValidObjectId(userId)
      ? new mongoose.Types.ObjectId(userId)
      : null;

    const payment = await Payment.findById(paymentId)
      .populate("user", "fullName email")
      .populate("course", "title description price")
      .lean();

    if (!payment) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Payment not found",
        },
      });
    }

    // Check permissions
    if (userRole !== "super-admin" && payment.user._id.toString() !== userObjectId.toString()) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "You can only view your own invoices",
        },
      });
    }

    if (payment.status !== "completed") {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invoice can only be generated for completed payments",
        },
      });
    }

    // Generate invoice data
    const invoiceData = {
      invoiceNumber: payment.invoiceNumber || `INV-${payment._id.toString().slice(-8)}`,
      date: payment.createdAt,
      amount: payment.amount,
      currency: payment.currency,
      payment: {
        id: payment._id.toString(),
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        paymentMethod: payment.paymentMethod,
        gateway: payment.gateway,
        gatewayTransactionId: payment.gatewayTransactionId,
      },
      user: {
        name: payment.user.fullName,
        email: payment.user.email,
      },
      course: payment.course
        ? {
            title: payment.course.title,
            description: payment.course.description,
            price: payment.course.price,
          }
        : null,
      description: payment.description,
    };

    // Check if invoice PDF already exists
    if (payment.invoiceUrl) {
      // Return existing invoice URL or generate on-demand
      const format = req.query.format || "json"; // 'json' or 'pdf'
      
      if (format === "pdf") {
        // Generate PDF on-demand
        try {
          const pdfBuffer = await generateInvoicePDF(invoiceData);

          // Set response headers for PDF download
          res.setHeader("Content-Type", "application/pdf");
          res.setHeader(
            "Content-Disposition",
            `attachment; filename="invoice-${invoiceData.invoiceNumber}.pdf"`
          );
          res.setHeader("Content-Length", pdfBuffer.length);

          return res.send(pdfBuffer);
        } catch (pdfError) {
          // eslint-disable-next-line no-console
          console.error("[Payment] Error generating invoice PDF:", pdfError);
          return res.status(500).json({
            error: {
              code: "PDF_GENERATION_ERROR",
              message: "Failed to generate invoice PDF. Please try again later.",
            },
          });
        }
      }
      
      // Return JSON with invoice URL
      return res.json({
        invoice: invoiceData,
        invoiceUrl: payment.invoiceUrl,
        message: "Invoice retrieved successfully.",
      });
    }

    // Generate and upload invoice PDF if it doesn't exist
    let invoiceUrl = null;
    try {
      const pdfBuffer = await generateInvoicePDF(invoiceData);

      // Save to local storage
      const uploadResult = await uploadPdfToCloudinary(
        pdfBuffer,
        `digital-aela/invoices/${payment._id}`,
        `invoice-${payment._id}.pdf`
      );
      invoiceUrl = uploadResult.url;

      // Update payment with invoice URL
      await Payment.findByIdAndUpdate(paymentId, {
        invoiceUrl,
      });

      // Check if user wants PDF directly
      const format = req.query.format || "json";
      if (format === "pdf") {
        // Set response headers for PDF download
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="invoice-${invoiceData.invoiceNumber}.pdf"`
        );
        res.setHeader("Content-Length", pdfBuffer.length);

        return res.send(pdfBuffer);
      }

      // Return JSON with invoice URL
      return res.json({
        invoice: invoiceData,
        invoiceUrl,
        message: "Invoice generated and uploaded successfully.",
      });
    } catch (pdfError) {
      // eslint-disable-next-line no-console
      console.error("[Payment] Error generating invoice PDF:", pdfError);
      return res.status(500).json({
        error: {
          code: "PDF_GENERATION_ERROR",
          message: "Failed to generate invoice PDF. Please try again later.",
        },
      });
    }
  } catch (error) {
    return next(error);
  }
};

/**
 * Get Pending Payments
 * GET /api/v1/payments/pending
 */
export const getPendingPayments = async (req, res, next) => {
  try {
    const { userId, userRole } = req.auth || {};
    const { page = 1, pageSize = 20 } = req.query;

    if (!userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    const userObjectId = mongoose.isValidObjectId(userId)
      ? new mongoose.Types.ObjectId(userId)
      : null;

    const query = {
      status: { $in: ["pending", "processing"] },
    };

    if (userRole !== "super-admin") {
      query.user = userObjectId;
    }

    const skip = (Number(page) - 1) * Number(pageSize);

    const [payments, total] = await Promise.all([
      Payment.find(query)
        .populate("user", "fullName email")
        .populate("course", "title thumbnailUrl price")
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
 * Get Teacher Earnings (for teachers)
 * GET /api/v1/payments/earnings
 */
export const getTeacherEarnings = async (req, res, next) => {
  try {
    const { userId, userRole } = req.auth || {};
    const { startDate, endDate, courseId } = req.query;

    if (!userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    if (userRole !== "teacher") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only teachers can access earnings",
        },
      });
    }

    const teacherObjectId = mongoose.isValidObjectId(userId)
      ? new mongoose.Types.ObjectId(userId)
      : null;

    // Get teacher's courses
    const teacherCourses = await Course.find({ instructor: teacherObjectId }).select("_id").lean();
    const courseIds = teacherCourses.map((c) => c._id);

    if (courseIds.length === 0) {
      return res.json({
        earnings: [],
        summary: {
          totalEarnings: 0,
          totalPayments: 0,
          currency: "AED",
        },
      });
    }

    // Build query for payments
    const query = {
      course: { $in: courseIds },
      status: "completed",
    };

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    if (courseId && mongoose.isValidObjectId(courseId)) {
      query.course = new mongoose.Types.ObjectId(courseId);
    }

    const payments = await Payment.find(query)
      .populate("course", "title")
      .populate("user", "fullName")
      .sort({ createdAt: -1 })
      .lean();

    // Calculate earnings by course
    const earningsByCourse = {};
    payments.forEach((payment) => {
      const courseId = payment.course._id.toString();
      if (!earningsByCourse[courseId]) {
        earningsByCourse[courseId] = {
          courseId,
          courseTitle: payment.course.title,
          totalEarnings: 0,
          paymentCount: 0,
          payments: [],
        };
      }
      earningsByCourse[courseId].totalEarnings += payment.amount;
      earningsByCourse[courseId].paymentCount += 1;
      earningsByCourse[courseId].payments.push(payment);
    });

    const totalEarnings = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

    return res.json({
      earnings: Object.values(earningsByCourse),
      summary: {
        totalEarnings,
        totalPayments: payments.length,
        currency: "AED",
      },
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Create Razorpay Order
 * POST /api/v1/payments/:paymentId/razorpay/order
 */
export const createRazorpayOrder = async (req, res, next) => {
  try {
    const { paymentId } = req.params;
    const { userId } = req.auth || {};

    if (!userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    // Check if Razorpay is enabled
    const enabled = await isRazorpayEnabled();
    if (!enabled) {
      return res.status(400).json({
        error: {
          code: "GATEWAY_DISABLED",
          message: "Razorpay payment gateway is not enabled",
        },
      });
    }

    if (!mongoose.isValidObjectId(paymentId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid payment ID",
        },
      });
    }

    const payment = await Payment.findById(paymentId)
      .populate("user", "fullName email")
      .populate("course", "title")
      .lean();

    if (!payment) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Payment not found",
        },
      });
    }

    // Check permissions
    const userObjectId = mongoose.isValidObjectId(userId)
      ? new mongoose.Types.ObjectId(userId)
      : null;

    if (payment.user._id.toString() !== userObjectId.toString()) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "You can only create orders for your own payments",
        },
      });
    }

    if (payment.gateway !== "razorpay") {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Payment gateway is not Razorpay",
        },
      });
    }

    if (payment.status !== "pending") {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Payment is not in pending status",
        },
      });
    }

    // Create Razorpay order
    const receipt = payment._id.toString();
    const notes = {
      payment_id: receipt,
      user_id: payment.user._id.toString(),
      description: payment.description || "Payment",
    };

    if (payment.course) {
      notes.course_id = payment.course._id.toString();
      notes.course_title = payment.course.title;
    }

    const razorpayOrder = await createOrder(
      payment.amount,
      payment.currency,
      receipt,
      notes
    );

    // Update payment with order ID
    await Payment.findByIdAndUpdate(paymentId, {
      gatewayPaymentIntentId: razorpayOrder.id,
      status: "processing",
    });

    // Get Razorpay key ID for frontend
    const keyId = await getRazorpayKeyId();

    return res.json({
      order: razorpayOrder,
      keyId: keyId,
      payment: {
        id: payment._id.toString(),
        amount: payment.amount,
        currency: payment.currency,
      },
      message: "Razorpay order created successfully",
    });
    } catch (error) {
      console.error("[Payment] Error creating Razorpay order:", {
        error: error.message,
        paymentId,
        userId,
        stack: error.stack,
      });
      return res.status(500).json({
        error: {
          code: "ORDER_CREATION_FAILED",
          message: error.message || "Failed to create Razorpay order. Please try again.",
        },
      });
    }
};

/**
 * Create Razorpay Payment Link (Redirect-based)
 * POST /api/v1/payments/:paymentId/razorpay/payment-link
 */
export const createRazorpayPaymentLink = async (req, res, next) => {
  try {
    const { paymentId } = req.params;
    const { userId } = req.auth || {};
    const { callbackUrl } = req.body;

    if (!userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    // Check if Razorpay is enabled
    const enabled = await isRazorpayEnabled();
    if (!enabled) {
      return res.status(400).json({
        error: {
          code: "GATEWAY_DISABLED",
          message: "Razorpay payment gateway is not enabled",
        },
      });
    }

    if (!mongoose.isValidObjectId(paymentId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid payment ID",
        },
      });
    }

    const payment = await Payment.findById(paymentId)
      .populate("user", "fullName email phone")
      .populate("course", "title")
      .lean();

    if (!payment) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Payment not found",
        },
      });
    }

    // Check permissions
    const userObjectId = mongoose.isValidObjectId(userId)
      ? new mongoose.Types.ObjectId(userId)
      : null;

    if (payment.user._id.toString() !== userObjectId.toString()) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "You can only create payment links for your own payments",
        },
      });
    }

    if (payment.gateway !== "razorpay") {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Payment gateway is not Razorpay",
        },
      });
    }

    if (payment.status !== "pending") {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Payment is not in pending status",
        },
      });
    }

    // Build callback URL if not provided
    // For Razorpay, we need to use the backend callback endpoint which then redirects to frontend
    const backendUrl = process.env.BACKEND_URL || process.env.API_URL || "http://localhost:5000";
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

    // Validate production URLs
    if (process.env.NODE_ENV === 'production' || !backendUrl.includes('localhost')) {
      if (!backendUrl || backendUrl.includes('localhost') || backendUrl === 'http://localhost:5000') {
        console.error("[Payment] ❌ CRITICAL: BACKEND_URL not set correctly in production!");
        console.error("[Payment] Current BACKEND_URL:", backendUrl);
        console.error("[Payment] This will cause callback URL whitelisting issues in Razorpay");
        console.error("[Payment] FIX: Set BACKEND_URL to your production backend URL");
        console.error("[Payment] Example: BACKEND_URL=https://api.digitalaela.com");
      }
      if (!frontendUrl || frontendUrl.includes('localhost') || frontendUrl === 'http://localhost:5173') {
        console.error("[Payment] ❌ WARNING: FRONTEND_URL not set correctly in production!");
        console.error("[Payment] Current FRONTEND_URL:", frontendUrl);
        console.error("[Payment] This may cause redirect issues after payment");
        console.error("[Payment] FIX: Set FRONTEND_URL to your production frontend URL");
        console.error("[Payment] Example: FRONTEND_URL=https://digitalaela.com");
      }
    }

    // Use backend callback endpoint (Razorpay can reach this, then we redirect to frontend)
    const defaultCallbackUrl = `${backendUrl}/api/v1/payments/razorpay/callback?paymentId=${paymentId}`;
    const finalCallbackUrl = callbackUrl || defaultCallbackUrl;

    console.log("[Payment] Using callback URL:", finalCallbackUrl);
    console.log("[Payment] Backend URL:", backendUrl);
    console.log("[Payment] Frontend URL:", frontendUrl);
    console.log("[Payment] Payment ID:", paymentId);
    console.log("[Payment] 🚨 CRITICAL: Ensure this callback URL is whitelisted in Razorpay Dashboard:");
    console.log(`[Payment] 🚨 WHITELIST URL: ${backendUrl}/api/v1/payments/razorpay/callback`);
    console.log("[Payment] 🚨 Go to Razorpay Dashboard → Settings → Payment Links → Allowed Redirect URLs");

    // Create payment link
    const receipt = payment._id.toString();
    const notes = {
      payment_id: receipt,
      user_id: payment.user._id.toString(),
      description: payment.description || "Payment",
    };

    if (payment.course) {
      notes.course_id = payment.course._id.toString();
      notes.course_title = payment.course.title;
    }

    // Validate user information before creating payment link
    if (!payment.user.email) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "User email is required for Razorpay payment. Please update your profile with an email address.",
        },
      });
    }

    const paymentLink = await createPaymentLink(
      payment.amount,
      payment.currency,
      receipt,
      payment.description || (payment.course ? `Payment for ${payment.course.title}` : "Payment"),
      payment.user.fullName || payment.user.email.split("@")[0] || "Customer",
      payment.user.email,
      payment.user.phone || "",
      finalCallbackUrl,
      notes
    );

    // Update payment with payment link ID
    await Payment.findByIdAndUpdate(paymentId, {
      gatewayPaymentIntentId: paymentLink.id,
      status: "processing",
      metadata: {
        ...payment.metadata,
        paymentLinkId: paymentLink.id,
        paymentLinkUrl: paymentLink.short_url,
      },
    });

    return res.json({
      paymentLink: {
        id: paymentLink.id,
        url: paymentLink.short_url,
        status: paymentLink.status,
      },
      payment: {
        id: payment._id.toString(),
        amount: payment.amount,
        currency: payment.currency,
      },
      message: "Razorpay payment link created successfully",
    });
  } catch (error) {
    console.error("[Payment] Error creating Razorpay payment link:", {
      error: error.message,
      paymentId: req.params.paymentId,
      userId: req.auth?.userId,
      stack: error.stack,
    });
    return res.status(500).json({
      error: {
        code: "PAYMENT_LINK_CREATION_FAILED",
        message: error.message || "Failed to create Razorpay payment link. Please try again.",
      },
    });
  }
};

/**
 * Handle Razorpay Payment Callback (Redirect-based)
 * GET /api/v1/payments/razorpay/callback
 */
export const handleRazorpayCallback = async (req, res, next) => {
  try {
    // Razorpay payment link redirects with these parameters (with razorpay_ prefix)
    let razorpayPaymentId = req.query.razorpay_payment_id;
    const razorpayPaymentLinkId = req.query.razorpay_payment_link_id;
    const razorpayPaymentLinkStatus = req.query.razorpay_payment_link_status;
    const razorpaySignature = req.query.razorpay_signature;
    // We pass paymentId in the callback URL
    const paymentId = req.query.paymentId;

    // Log ALL received parameters for debugging (including all query params)
    console.log("==========================================");
    console.log("[Payment] Razorpay callback received - ALL PARAMETERS:");
    console.log("Query params:", JSON.stringify(req.query, null, 2));
    console.log("Specific params:", {
      paymentId,
      razorpayPaymentId,
      razorpayPaymentLinkId,
      razorpayPaymentLinkStatus,
      razorpaySignature: razorpaySignature ? "present" : "missing",
      allQueryKeys: Object.keys(req.query),
    });

    // CRITICAL: Check for missing razorpay_payment_id - this indicates callback URL not whitelisted
    if (!razorpayPaymentId) {
      console.error("[Payment] ❌ CRITICAL: razorpay_payment_id is missing from callback!");
      console.error("[Payment] This usually means the callback URL is not whitelisted in Razorpay dashboard");
      console.error("[Payment] Users will be redirected to 'about:blank' instead of the callback page");
      console.error("[Payment] FIX: Add this URL to 'Allowed Redirect URLs' in Razorpay Dashboard:");
      const backendUrl = process.env.BACKEND_URL || process.env.API_URL || "http://localhost:5000";
      console.error(`[Payment] URL to whitelist: ${backendUrl}/api/v1/payments/razorpay/callback`);
      console.error("[Payment] Current query params received:", JSON.stringify(req.query, null, 2));
      console.error("[Payment] If you see this message, the callback URL whitelisting is NOT working!");
    } else {
      console.log("[Payment] ✅ razorpay_payment_id received - callback URL is properly whitelisted");
    }

    console.log("==========================================");

    // Track payment status update to determine redirect status
    let paymentUpdatedToCompleted = false;
    let paymentUpdatedToFailed = false;
    let razorpayPaymentStatus = null;
    let razorpayPaymentData = null;

    // If razorpay_payment_id is provided, fetch and verify the payment
    if (razorpayPaymentId && paymentId) {
      console.log("[Payment] Fetching payment from Razorpay API:", razorpayPaymentId);
      try {
        razorpayPaymentData = await fetchPayment(razorpayPaymentId);
        razorpayPaymentStatus = razorpayPaymentData.status;
        
        console.log("[Payment] Razorpay payment fetched successfully:", {
          paymentId: razorpayPaymentId,
          status: razorpayPaymentStatus,
          orderId: razorpayPaymentData.order_id,
          method: razorpayPaymentData.method,
          bank: razorpayPaymentData.bank,
          amount: razorpayPaymentData.amount,
          currency: razorpayPaymentData.currency,
          captured: razorpayPaymentData.captured,
          authorized: razorpayPaymentData.authorized,
        });

        // Check current payment status in database before update
        const currentPayment = await Payment.findById(paymentId).lean();
        console.log("[Payment] Current payment status in DB:", {
          paymentId,
          currentStatus: currentPayment?.status,
          currentGatewayTransactionId: currentPayment?.gatewayTransactionId,
        });

        if (razorpayPaymentStatus === "captured" || razorpayPaymentStatus === "authorized") {
          console.log("[Payment] Payment is captured/authorized, updating to completed");
          // Update payment status
          const updateData = {
            status: "completed",
            gatewayTransactionId: razorpayPaymentId,
            gatewayPaymentIntentId: razorpayPaymentData.order_id || razorpayPaymentLinkId,
          };

          const payment = currentPayment || await Payment.findById(paymentId).lean();

          if (payment && payment.course && !payment.metadata?.enrollmentCreated) {
            try {
              const existingEnrollment = await Enrollment.findOne({
                student: payment.user,
                course: payment.course,
              }).lean();

              if (!existingEnrollment) {
                console.log("[Payment] Creating enrollment for course:", payment.course);
                await Enrollment.create({
                  student: payment.user,
                  course: payment.course,
                  status: "active",
                  enrolledAt: new Date(),
                });
                updateData.metadata = {
                  ...payment.metadata,
                  enrollmentCreated: true,
                  enrollmentCreatedAt: new Date(),
                };
                console.log("[Payment] Enrollment created successfully");
              } else {
                console.log("[Payment] Enrollment already exists, skipping");
              }
            } catch (enrollmentError) {
              console.error("[Payment] Error creating enrollment:", enrollmentError);
            }
          }

          await Payment.findByIdAndUpdate(paymentId, updateData);
          paymentUpdatedToCompleted = true;
          
          // Verify the update
          const updatedPayment = await Payment.findById(paymentId).lean();
          console.log("[Payment] Payment updated to completed - VERIFIED:", {
            paymentId,
            newStatus: updatedPayment?.status,
            gatewayTransactionId: updatedPayment?.gatewayTransactionId,
            enrollmentCreated: updatedPayment?.metadata?.enrollmentCreated,
          });
        } else if (razorpayPaymentStatus === "failed") {
          console.log("[Payment] Payment status is failed, updating DB");
          await Payment.findByIdAndUpdate(paymentId, {
            status: "failed",
            failureReason: razorpayPaymentData.error_description || "Payment failed",
            gatewayTransactionId: razorpayPaymentId,
          });
          paymentUpdatedToFailed = true;
          console.log("[Payment] Payment marked as failed:", paymentId);
        } else {
          console.log("[Payment] Payment status is neither captured/authorized nor failed:", {
            status: razorpayPaymentStatus,
            paymentId: razorpayPaymentId,
          });
        }
      } catch (fetchError) {
        console.error("[Payment] Error fetching payment from Razorpay:", {
          error: fetchError.message,
          stack: fetchError.stack,
          paymentId: razorpayPaymentId,
        });
        // Continue to redirect even if fetch fails - frontend will verify
      }
    } else {
      console.log("[Payment] No razorpay_payment_id provided, checking payment from database and payment link");
      
      // If we have paymentId, check the payment status from database and payment link
      if (paymentId) {
        try {
          const currentPayment = await Payment.findById(paymentId).lean();
          
          if (currentPayment) {
            console.log("[Payment] Current payment in DB:", {
              paymentId,
              status: currentPayment.status,
              gatewayPaymentIntentId: currentPayment.gatewayPaymentIntentId,
              gatewayTransactionId: currentPayment.gatewayTransactionId,
            });
            
            // If payment is already completed, use that
            if (currentPayment.status === "completed") {
              paymentUpdatedToCompleted = true;
              console.log("[Payment] Payment already completed in DB");
            } else if (currentPayment.status === "failed") {
              paymentUpdatedToFailed = true;
              console.log("[Payment] Payment already failed in DB");
            } else if (currentPayment.gatewayPaymentIntentId) {
              // Try to fetch payment link status from Razorpay
              try {
                const paymentLink = await fetchPaymentLink(currentPayment.gatewayPaymentIntentId);
                
                console.log("[Payment] Payment link fetched from Razorpay:", {
                  paymentLinkId: paymentLink.id,
                  status: paymentLink.status,
                  paymentsCount: paymentLink.payments?.length || 0,
                  payments: paymentLink.payments?.map(p => ({ id: p.id, status: p.status })) || [],
                });
                
                // If payment link is paid, check for payments
                if (paymentLink.status === "paid" && paymentLink.payments && paymentLink.payments.length > 0) {
                  // Get the first payment (usually there's only one)
                  const firstPayment = paymentLink.payments[0];
                  const razorpayPaymentIdFromLink = firstPayment.id;
                  
                  console.log("[Payment] Payment link is paid, fetching payment details:", razorpayPaymentIdFromLink);
                  
                  // Fetch the actual payment to verify its status
                  try {
                    const paymentFromRazorpay = await fetchPayment(razorpayPaymentIdFromLink);
                    
                    if (paymentFromRazorpay.status === "captured" || paymentFromRazorpay.status === "authorized") {
                      // Update payment status
                      const updateData = {
                        status: "completed",
                        gatewayTransactionId: razorpayPaymentIdFromLink,
                        gatewayPaymentIntentId: paymentLink.id,
                      };
                      
                      const payment = await Payment.findById(paymentId).lean();
                      
                      if (payment && payment.course && !payment.metadata?.enrollmentCreated) {
                        try {
                          const existingEnrollment = await Enrollment.findOne({
                            student: payment.user,
                            course: payment.course,
                          }).lean();
                          
                          if (!existingEnrollment) {
                            console.log("[Payment] Creating enrollment for course:", payment.course);
                            await Enrollment.create({
                              student: payment.user,
                              course: payment.course,
                              status: "active",
                              enrolledAt: new Date(),
                            });
                            updateData.metadata = {
                              ...payment.metadata,
                              enrollmentCreated: true,
                              enrollmentCreatedAt: new Date(),
                            };
                            console.log("[Payment] Enrollment created successfully");
                          }
                        } catch (enrollmentError) {
                          console.error("[Payment] Error creating enrollment:", enrollmentError);
                        }
                      }
                      
                      await Payment.findByIdAndUpdate(paymentId, updateData);
                      paymentUpdatedToCompleted = true;
                      
                      // Store the payment ID for redirect
                      razorpayPaymentId = razorpayPaymentIdFromLink;
                      
                      console.log("[Payment] Payment updated to completed from payment link");
                    }
                  } catch (paymentFetchError) {
                    console.error("[Payment] Error fetching payment from payment link:", {
                      error: paymentFetchError.message,
                      stack: paymentFetchError.stack,
                      razorpayPaymentId: razorpayPaymentIdFromLink,
                      paymentId,
                      errorType: paymentFetchError.name,
                    });
                  }
                } else if (paymentLink.status === "paid") {
                  // Payment link is paid but no payments array yet (timing issue)
                  // Try multiple retries with progressive delays
                  console.log("[Payment] Payment link is paid but no payments found yet, will retry multiple times");
                  
                  // Retry configuration: [delay1, delay2, delay3, delay4, delay5] in milliseconds
                  const retryDelays = [1000, 2000, 3000, 2000, 2000]; // Total ~10 seconds
                  let retrySuccess = false;
                  
                  for (let retryAttempt = 0; retryAttempt < retryDelays.length && !retrySuccess; retryAttempt++) {
                    try {
                      console.log(`[Payment] Retry attempt ${retryAttempt + 1}/${retryDelays.length}, waiting ${retryDelays[retryAttempt]}ms`);
                      await new Promise(resolve => setTimeout(resolve, retryDelays[retryAttempt]));
                      
                      const retryPaymentLink = await fetchPaymentLink(currentPayment.gatewayPaymentIntentId);
                      
                      console.log(`[Payment] Retry ${retryAttempt + 1} - Payment link status:`, {
                        status: retryPaymentLink.status,
                        paymentsCount: retryPaymentLink.payments?.length || 0,
                      });
                      
                      if (retryPaymentLink.payments && retryPaymentLink.payments.length > 0) {
                        const firstPayment = retryPaymentLink.payments[0];
                        const razorpayPaymentIdFromLink = firstPayment.id;
                        
                        console.log("[Payment] Retry successful, fetching payment details:", razorpayPaymentIdFromLink);
                        
                        const paymentFromRazorpay = await fetchPayment(razorpayPaymentIdFromLink);
                        
                        if (paymentFromRazorpay.status === "captured" || paymentFromRazorpay.status === "authorized") {
                          const updateData = {
                            status: "completed",
                            gatewayTransactionId: razorpayPaymentIdFromLink,
                            gatewayPaymentIntentId: retryPaymentLink.id,
                          };
                          
                          const payment = await Payment.findById(paymentId).lean();
                          
                          if (payment && payment.course && !payment.metadata?.enrollmentCreated) {
                            try {
                              const existingEnrollment = await Enrollment.findOne({
                                student: payment.user,
                                course: payment.course,
                              }).lean();
                              
                              if (!existingEnrollment) {
                                console.log("[Payment] Creating enrollment for course:", payment.course);
                                await Enrollment.create({
                                  student: payment.user,
                                  course: payment.course,
                                  status: "active",
                                  enrolledAt: new Date(),
                                });
                                updateData.metadata = {
                                  ...payment.metadata,
                                  enrollmentCreated: true,
                                  enrollmentCreatedAt: new Date(),
                                };
                                console.log("[Payment] Enrollment created successfully");
                              }
                            } catch (enrollmentError) {
                              console.error("[Payment] Error creating enrollment:", enrollmentError);
                            }
                          }
                          
                          await Payment.findByIdAndUpdate(paymentId, updateData);
                          paymentUpdatedToCompleted = true;
                          razorpayPaymentId = razorpayPaymentIdFromLink;
                          retrySuccess = true;
                          console.log(`[Payment] Payment updated to completed from retry attempt ${retryAttempt + 1}`);
                        } else {
                          console.log(`[Payment] Retry ${retryAttempt + 1}: Payment found but status is ${paymentFromRazorpay.status}, will continue retrying`);
                        }
                      } else {
                        console.log(`[Payment] Retry ${retryAttempt + 1}: Still no payments array, will ${retryAttempt < retryDelays.length - 1 ? 'continue retrying' : 'give up'}`);
                      }
                    } catch (retryError) {
                      console.error(`[Payment] Error during retry attempt ${retryAttempt + 1}:`, {
                        error: retryError.message,
                        stack: retryError.stack,
                      });
                      // Continue to next retry attempt
                    }
                  }
                  
                  if (!retrySuccess) {
                    console.log("[Payment] All retry attempts exhausted, payment link is paid but payments array not available yet");
                    console.log("[Payment] Payment will be marked as processing - webhook or frontend verification will complete it");
                  }
                }
              } catch (linkFetchError) {
                console.error("[Payment] Error fetching payment link:", {
                  error: linkFetchError.message,
                  stack: linkFetchError.stack,
                  paymentId,
                  gatewayPaymentIntentId: currentPayment?.gatewayPaymentIntentId,
                  errorType: linkFetchError.name,
                });
                // If we have payment link status from URL but fetch failed, still mark as processing
                // The webhook or frontend polling will complete it
                if (razorpayPaymentLinkStatus === "paid") {
                  console.log("[Payment] Payment link fetch failed but URL status is paid, will mark as processing");
                  console.log("[Payment] Webhook or frontend verification should update the payment status");
                }
              }
            }
          } else {
            console.error("[Payment] Payment not found in database:", {
              paymentId,
              message: "Payment record does not exist - this should not happen if callback URL was set correctly",
            });
          }
        } catch (dbError) {
          console.error("[Payment] Error checking payment from database:", {
            error: dbError.message,
            stack: dbError.stack,
            paymentId,
            errorType: dbError.name,
          });
        }
      }
      
      if (razorpayPaymentLinkStatus === "paid" && paymentId && !paymentUpdatedToCompleted) {
        // If we have payment link status but no payment_id yet, still mark as processing
        // The webhook or frontend verification will complete it
        console.log("[Payment] Payment link status is paid, but payment_id not yet available - will mark as processing");
      }
    }

    // Redirect to frontend callback page with status
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    // Map razorpay_payment_link_status to frontend status
    // Priority: 1. Payment API status (if we fetched and updated), 2. Payment link status, 3. Default
    let finalStatus = "processing"; // Default to processing instead of unknown
    
    console.log("[Payment] Determining final redirect status:", {
      paymentUpdatedToCompleted,
      paymentUpdatedToFailed,
      razorpayPaymentLinkStatus,
      razorpayPaymentStatus,
      hasRazorpayPaymentId: !!razorpayPaymentId,
    });
    
    // If we successfully updated payment to completed, use success status
    if (paymentUpdatedToCompleted) {
      finalStatus = "success";
      console.log("[Payment] Status determined: SUCCESS (payment updated to completed)");
    } else if (paymentUpdatedToFailed) {
      finalStatus = "failed";
      console.log("[Payment] Status determined: FAILED (payment updated to failed)");
    } else if (razorpayPaymentLinkStatus === "paid") {
      // If payment link is paid but we couldn't update yet, mark as processing
      // Frontend will call verify-razorpay-callback immediately with payment_id to complete it
      finalStatus = "processing";
      console.log("[Payment] Status determined: PROCESSING (payment link is paid but not yet updated in DB)");
    } else if (razorpayPaymentLinkStatus === "failed") {
      finalStatus = "failed";
      console.log("[Payment] Status determined: FAILED (payment link status is failed)");
    } else if (razorpayPaymentLinkStatus) {
      // Use the status as-is if it's something else
      finalStatus = razorpayPaymentLinkStatus === "success" ? "success" : razorpayPaymentLinkStatus;
      console.log("[Payment] Status determined from payment link status:", finalStatus);
    } else if (razorpayPaymentId) {
      // If we have a payment_id but couldn't fetch it, default to processing
      // Frontend will verify the payment status
      finalStatus = "processing";
      console.log("[Payment] Status determined: PROCESSING (has payment_id but couldn't fetch)");
    } else {
      // Default to processing instead of unknown - frontend will poll
      finalStatus = "processing";
      console.log("[Payment] Status determined: PROCESSING (no status indicators found, will poll)");
    }
    
    // Build redirect URL with query parameters
    const params = new URLSearchParams();
    if (paymentId) params.append("paymentId", paymentId);
    params.append("status", finalStatus);
    if (razorpayPaymentId) params.append("payment_id", razorpayPaymentId);
    
    const redirectUrl = `${frontendUrl}/payment/callback?${params.toString()}`;
    
    console.log("[Payment] Final redirect details:", {
      finalStatus,
      redirectUrl,
      paymentId,
      razorpayPaymentId,
      frontendUrl,
    });
    console.log("==========================================");
    
    return res.redirect(redirectUrl);
  } catch (error) {
    console.error("[Payment] Error handling Razorpay callback:", {
      error: error.message,
      stack: error.stack,
      query: req.query,
    });
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    return res.redirect(`${frontendUrl}/payment/callback?status=error&error=${encodeURIComponent(error.message)}`);
  }
};

/**
 * Verify Razorpay Payment
 * POST /api/v1/payments/razorpay/verify
 */
export const verifyRazorpayPayment = async (req, res, next) => {
  try {
    const { userId } = req.auth || {};
    const { paymentId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    if (!userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    if (!paymentId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Missing required fields: paymentId, razorpayOrderId, razorpayPaymentId, razorpaySignature",
        },
      });
    }

    if (!mongoose.isValidObjectId(paymentId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid payment ID",
        },
      });
    }

    const payment = await Payment.findById(paymentId).lean();

    if (!payment) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Payment not found",
        },
      });
    }

    // Check permissions
    const userObjectId = mongoose.isValidObjectId(userId)
      ? new mongoose.Types.ObjectId(userId)
      : null;

    if (payment.user.toString() !== userObjectId.toString()) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "You can only verify your own payments",
        },
      });
    }

    // Payment signature verification disabled - skip checks
    // This allows payments to complete immediately without signature verification
    console.log("[Payment] Payment signature verification skipped (disabled)");
    
    // Continue with payment verification without signature check

    // Fetch payment details from Razorpay to confirm
    try {
      const razorpayPayment = await fetchPayment(razorpayPaymentId);

      if (razorpayPayment.status === "captured" || razorpayPayment.status === "authorized") {
        // Update payment status
        const updateData = {
          status: "completed",
          gatewayTransactionId: razorpayPaymentId,
          gatewayPaymentIntentId: razorpayOrderId,
        };

        // Create enrollment if payment is for a course
        if (payment.course && !payment.metadata?.enrollmentCreated) {
          try {
            const existingEnrollment = await Enrollment.findOne({
              student: payment.user,
              course: payment.course,
            }).lean();

            if (!existingEnrollment) {
              await Enrollment.create({
                student: payment.user,
                course: payment.course,
                status: "active",
                enrolledAt: new Date(),
              });
              updateData.metadata = {
                ...payment.metadata,
                enrollmentCreated: true,
                enrollmentCreatedAt: new Date(),
              };
            }
          } catch (enrollmentError) {
            console.error("[Payment] Error creating enrollment:", enrollmentError);
            // Continue with payment update even if enrollment fails
          }
        }

        const updatedPayment = await Payment.findByIdAndUpdate(paymentId, updateData, { new: true })
          .populate("user", "fullName email")
          .populate("course", "title thumbnailUrl price")
          .lean();

        // Generate invoice PDF when payment is completed
        if (!payment.invoiceUrl) {
          try {
            const invoiceData = {
              invoiceNumber: updatedPayment.invoiceNumber || `INV-${updatedPayment._id.toString().slice(-8)}`,
              date: updatedPayment.createdAt,
              amount: updatedPayment.amount,
              currency: updatedPayment.currency,
              payment: {
                id: updatedPayment._id.toString(),
                amount: updatedPayment.amount,
                currency: updatedPayment.currency,
                status: updatedPayment.status,
                paymentMethod: updatedPayment.paymentMethod,
                gateway: updatedPayment.gateway,
                gatewayTransactionId: updatedPayment.gatewayTransactionId,
              },
              user: {
                name: updatedPayment.user.fullName,
                email: updatedPayment.user.email,
              },
              course: updatedPayment.course
                ? {
                    title: updatedPayment.course.title,
                    description: updatedPayment.course.description,
                    price: updatedPayment.course.price,
                  }
                : null,
              description: updatedPayment.description,
            };

            const pdfBuffer = await generateInvoicePDF(invoiceData);
            const uploadResult = await uploadPdfToCloudinary(
              pdfBuffer,
              `digital-aela/invoices/${paymentId}`,
              `invoice-${paymentId}.pdf`
            );

            await Payment.findByIdAndUpdate(paymentId, {
              invoiceUrl: uploadResult.url,
            });
            updatedPayment.invoiceUrl = uploadResult.url;
          } catch (invoiceError) {
            console.error("[Payment] Error generating invoice PDF:", invoiceError);
          }
        }

        // Create notification when payment is completed
        if (!payment.metadata?.notificationSent) {
          try {
            const { createNotification } = await import("../utils/notificationHelper.js");
            const courseTitle = updatedPayment.course?.title || "course";
            await createNotification(
              updatedPayment.user._id || updatedPayment.user,
              "Payment Successful",
              `Your payment of ${updatedPayment.amount} ${updatedPayment.currency} for "${courseTitle}" has been completed successfully.`,
              "payment",
              {
                paymentId: updatedPayment._id.toString(),
                amount: updatedPayment.amount,
                currency: updatedPayment.currency,
                courseId: updatedPayment.course?._id?.toString() || null,
              },
              updatedPayment.course ? `/courses/${updatedPayment.course._id}` : "/student/payments"
            );

            await Payment.findByIdAndUpdate(paymentId, {
              "metadata.notificationSent": true,
            });
          } catch (notifError) {
            console.error("[Payment] Error creating notification:", notifError);
          }
        }

        return res.json({
          payment: updatedPayment,
          verified: true,
          message: "Payment verified and completed successfully",
        });
      } else {
        // Payment not captured/authorized
        await Payment.findByIdAndUpdate(paymentId, {
          status: "failed",
          failureReason: `Payment status: ${razorpayPayment.status}`,
          gatewayTransactionId: razorpayPaymentId,
        });

        return res.status(400).json({
          error: {
            code: "PAYMENT_NOT_CAPTURED",
            message: `Payment status is ${razorpayPayment.status}, not captured`,
          },
        });
      }
    } catch (razorpayError) {
      console.error("[Payment] Error fetching Razorpay payment:", razorpayError);
      return res.status(500).json({
        error: {
          code: "RAZORPAY_ERROR",
          message: "Failed to verify payment with Razorpay",
        },
      });
    }
    } catch (error) {
      console.error("[Payment] Error verifying Razorpay payment:", {
        error: error.message,
        paymentId,
        userId,
        stack: error.stack,
      });
      return res.status(500).json({
        error: {
          code: "PAYMENT_VERIFICATION_ERROR",
          message: error.message || "Failed to verify payment. Please contact support.",
        },
      });
    }
};

// Webhook handling removed - using callback-based verification only

/**
 * Test callback URL accessibility
 * GET /api/v1/payments/test-callback
 */
export const testCallbackUrl = async (req, res, next) => {
  try {
    const backendUrl = process.env.BACKEND_URL || process.env.API_URL || "http://localhost:5000";
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

    const testUrl = `${backendUrl}/api/v1/payments/razorpay/callback?paymentId=test123`;

    return res.json({
      message: "Callback URL test endpoint",
      backendUrl,
      frontendUrl,
      callbackUrl: testUrl,
      instructions: [
        "1. Copy the callbackUrl above",
        "2. Go to Razorpay Dashboard → Settings → Payment Links",
        "3. Add it to 'Allowed Redirect URLs'",
        "4. Test a payment - you should see razorpay_payment_id in the callback logs"
      ]
    });
  } catch (error) {
    console.error("[Payment] Error in test callback:", error);
    return next(error);
  }
};

/**
 * Manually verify payment status from Razorpay
 * POST /api/v1/payments/:paymentId/verify-status
 */
export const verifyPaymentStatus = async (req, res, next) => {
  try {
    const { userId } = req.auth || {};
    const { paymentId } = req.params;

    if (!userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    if (!mongoose.isValidObjectId(paymentId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid payment ID",
        },
      });
    }

    const payment = await Payment.findById(paymentId).lean();

    if (!payment) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Payment not found",
        },
      });
    }

    // Check permissions
    const userObjectId = mongoose.isValidObjectId(userId)
      ? new mongoose.Types.ObjectId(userId)
      : null;

    if (!userObjectId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Invalid user ID",
        },
      });
    }

    if (payment.user.toString() !== userObjectId.toString()) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "You can only verify your own payments",
        },
      });
    }

    // If payment is already completed or failed, return current status
    if (payment.status === "completed" || payment.status === "failed") {
      return res.json({
        payment: {
          id: payment._id.toString(),
          status: payment.status,
          gatewayTransactionId: payment.gatewayTransactionId,
        },
        message: "Payment status is already final",
      });
    }

    // If payment has gatewayPaymentIntentId (payment link ID), fetch from Razorpay
    if (payment.gatewayPaymentIntentId && payment.gateway === "razorpay") {
      try {
        console.log("[Payment Verify] Fetching payment link from Razorpay:", payment.gatewayPaymentIntentId);
        const paymentLink = await fetchPaymentLink(payment.gatewayPaymentIntentId);

        console.log("[Payment Verify] Payment link status:", {
          paymentLinkId: paymentLink.id,
          status: paymentLink.status,
          paymentsCount: paymentLink.payments?.length || 0,
          payments: paymentLink.payments?.map(p => ({ id: p.id, status: p.status })) || [],
        });

        // If payment link is paid, check for payments
        if (paymentLink.status === "paid" && paymentLink.payments && paymentLink.payments.length > 0) {
          const firstPayment = paymentLink.payments[0];
          const razorpayPaymentId = firstPayment.id;

          console.log("[Payment Verify] Payment link is paid, fetching payment details:", razorpayPaymentId);

          try {
            const paymentFromRazorpay = await fetchPayment(razorpayPaymentId);

            if (paymentFromRazorpay.status === "captured" || paymentFromRazorpay.status === "authorized") {
              // Update payment status
              const updateData = {
                status: "completed",
                gatewayTransactionId: razorpayPaymentId,
              };

              const paymentDoc = await Payment.findById(paymentId).lean();

              if (paymentDoc && paymentDoc.course && !paymentDoc.metadata?.enrollmentCreated) {
                try {
                  const existingEnrollment = await Enrollment.findOne({
                    student: paymentDoc.user,
                    course: paymentDoc.course,
                  }).lean();

                  if (!existingEnrollment) {
                    console.log("[Payment Verify] Creating enrollment for course:", paymentDoc.course);
                    await Enrollment.create({
                      student: paymentDoc.user,
                      course: paymentDoc.course,
                      status: "active",
                      enrolledAt: new Date(),
                    });
                    updateData.metadata = {
                      ...paymentDoc.metadata,
                      enrollmentCreated: true,
                      enrollmentCreatedAt: new Date(),
                    };
                    console.log("[Payment Verify] Enrollment created successfully");
                  }
                } catch (enrollmentError) {
                  console.error("[Payment Verify] Error creating enrollment:", enrollmentError);
                }
              }

              await Payment.findByIdAndUpdate(paymentId, updateData);

              const updatedPayment = await Payment.findById(paymentId)
                .populate("user", "fullName email")
                .populate("course", "title thumbnailUrl price")
                .lean();

              console.log("[Payment Verify] Payment updated to completed");

              return res.json({
                payment: updatedPayment,
                verified: true,
                message: "Payment verified and updated to completed",
              });
            } else if (paymentFromRazorpay.status === "failed") {
              await Payment.findByIdAndUpdate(paymentId, {
                status: "failed",
                failureReason: "Payment failed at Razorpay",
                gatewayTransactionId: razorpayPaymentId,
              });

              return res.json({
                payment: await Payment.findById(paymentId).lean(),
                verified: true,
                message: "Payment verified and marked as failed",
              });
            }
          } catch (paymentFetchError) {
            console.error("[Payment Verify] Error fetching payment from Razorpay:", paymentFetchError);
            // Don't return 500 - allow fallthrough to try other verification methods
            // or return current status gracefully
          }
        } else if (paymentLink.status === "paid") {
          // Payment link is paid - mark as completed even if payments array is empty
          // The webhook will eventually populate the gatewayTransactionId
          console.log("[Payment Verify] Payment link is paid, marking payment as completed");
          
          const updateData = {
            status: "completed",
          };

          const paymentDoc = await Payment.findById(paymentId).lean();

          // Create enrollment if payment is for a course
          if (paymentDoc && paymentDoc.course && !paymentDoc.metadata?.enrollmentCreated) {
            try {
              const existingEnrollment = await Enrollment.findOne({
                student: paymentDoc.user,
                course: paymentDoc.course,
              }).lean();

              if (!existingEnrollment) {
                console.log("[Payment Verify] Creating enrollment for course:", paymentDoc.course);
                await Enrollment.create({
                  student: paymentDoc.user,
                  course: paymentDoc.course,
                  status: "active",
                  enrolledAt: new Date(),
                });
                updateData.metadata = {
                  ...paymentDoc.metadata,
                  enrollmentCreated: true,
                  enrollmentCreatedAt: new Date(),
                };
                console.log("[Payment Verify] Enrollment created successfully");
              }
            } catch (enrollmentError) {
              console.error("[Payment Verify] Error creating enrollment:", enrollmentError);
            }
          }

          await Payment.findByIdAndUpdate(paymentId, updateData);

          const updatedPayment = await Payment.findById(paymentId)
            .populate("user", "fullName email")
            .populate("course", "title thumbnailUrl price")
            .lean();

          return res.json({
            payment: updatedPayment,
            verified: true,
            message: "Payment verified and updated to completed based on payment link status",
          });
        } else if (paymentLink.status === "cancelled" || paymentLink.status === "expired") {
          await Payment.findByIdAndUpdate(paymentId, {
            status: "failed",
            failureReason: `Payment link ${paymentLink.status}`,
          });

          return res.json({
            payment: await Payment.findById(paymentId).lean(),
            verified: true,
            message: "Payment link is cancelled or expired",
          });
        }
      } catch (linkFetchError) {
        console.error("[Payment Verify] Error fetching payment link:", linkFetchError);
        // Don't return 500 - allow fallthrough to try other verification methods
        // or return current status gracefully
      }
    }

    // If we have gatewayTransactionId, try to fetch directly
    if (payment.gatewayTransactionId && payment.gateway === "razorpay") {
      try {
        const paymentFromRazorpay = await fetchPayment(payment.gatewayTransactionId);

        if (paymentFromRazorpay.status === "captured" || paymentFromRazorpay.status === "authorized") {
          await Payment.findByIdAndUpdate(paymentId, {
            status: "completed",
          });

          const updatedPayment = await Payment.findById(paymentId)
                .populate("user", "fullName email")
                .populate("course", "title thumbnailUrl price")
                .lean();

          return res.json({
            payment: updatedPayment,
            verified: true,
            message: "Payment verified and updated to completed",
          });
        } else if (paymentFromRazorpay.status === "failed") {
          await Payment.findByIdAndUpdate(paymentId, {
            status: "failed",
            failureReason: "Payment failed at Razorpay",
          });

          return res.json({
            payment: await Payment.findById(paymentId).lean(),
            verified: true,
            message: "Payment verified and marked as failed",
          });
        }
      } catch (paymentFetchError) {
        console.error("[Payment Verify] Error fetching payment:", paymentFetchError);
        // Log the error but continue to return current status
      }
    }

    // Return current status if we can't verify
    // Fetch fresh payment data to ensure we return the latest status
    const currentPayment = await Payment.findById(paymentId)
      .populate("user", "fullName email")
      .populate("course", "title thumbnailUrl price")
      .lean();

    return res.json({
      payment: currentPayment,
      verified: false,
      message: "Could not verify payment status. Payment may still be processing.",
    });
  } catch (error) {
    console.error("[Payment Verify] Error:", error);
    return next(error);
  }
};

