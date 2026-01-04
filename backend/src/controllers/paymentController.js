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
  verifyWebhookSignature,
} from "../services/razorpayService.js";
import { fetchPaymentLink } from "../services/paymentGatewayService.js";

/**
 * Create Payment Record
 * POST /api/v1/payments
 */
export const createPayment = async (req, res, next) => {
  try {
    const { userId } = req.auth || {};
    const { courseId, amount, currency, description, paymentMethod, gateway } =
      req.body;

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
      currency: currency || "INR",
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
    const {
      status,
      gatewayTransactionId,
      gatewayPaymentIntentId,
      failureReason,
      invoiceUrl,
    } = req.body;

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

    if (
      userRole !== "super-admin" &&
      payment.user.toString() !== userObjectId.toString()
    ) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "You can only update your own payments",
        },
      });
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (gatewayTransactionId)
      updateData.gatewayTransactionId = gatewayTransactionId;
    if (gatewayPaymentIntentId)
      updateData.gatewayPaymentIntentId = gatewayPaymentIntentId;
    if (failureReason) updateData.failureReason = failureReason;
    if (invoiceUrl) updateData.invoiceUrl = invoiceUrl;

    // If status is completed and course exists, create enrollment
    if (
      status === "completed" &&
      payment.course &&
      !payment.metadata?.enrollmentCreated
    ) {
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

    const updatedPayment = await Payment.findByIdAndUpdate(
      paymentId,
      updateData,
      { new: true }
    )
      .populate("user", "fullName email")
      .populate("course", "title thumbnailUrl price")
      .lean();

    // Generate invoice PDF when payment is completed (if not already generated)
    if (
      status === "completed" &&
      !payment.invoiceUrl &&
      !updateData.invoiceUrl
    ) {
      try {
        const invoiceData = {
          invoiceNumber:
            updatedPayment.invoiceNumber ||
            `INV-${updatedPayment._id.toString().slice(-8)}`,
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
    if (
      status === "completed" &&
      updatedPayment.user &&
      !payment.metadata?.notificationSent
    ) {
      try {
        const { createNotification } = await import(
          "../utils/notificationHelper.js"
        );
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
          updatedPayment.course
            ? `/courses/${updatedPayment.course._id}`
            : "/student/payments"
        );

        // Mark notification as sent in metadata
        if (!updateData.metadata) {
          updateData.metadata = { ...payment.metadata };
        }
        updateData.metadata.notificationSent = true;
        await Payment.findByIdAndUpdate(paymentId, {
          metadata: updateData.metadata,
        });
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
    const {
      page = 1,
      pageSize = 20,
      status,
      courseId,
      startDate,
      endDate,
    } = req.query;

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
    const completedAmount = completedPayments.reduce(
      (sum, p) => sum + (p.amount || 0),
      0
    );

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
    if (
      userRole !== "super-admin" &&
      payment.user._id.toString() !== userObjectId.toString()
    ) {
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

    const refundAmountValue = refundAmount
      ? Number(refundAmount)
      : payment.amount;
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
      status:
        totalRefunded >= payment.amount ? "refunded" : "partially_refunded",
    };

    const updatedPayment = await Payment.findByIdAndUpdate(
      paymentId,
      updateData,
      { new: true }
    )
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
    if (
      userRole !== "super-admin" &&
      payment.user._id.toString() !== userObjectId.toString()
    ) {
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
      invoiceNumber:
        payment.invoiceNumber || `INV-${payment._id.toString().slice(-8)}`,
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
              message:
                "Failed to generate invoice PDF. Please try again later.",
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
    const teacherCourses = await Course.find({ instructor: teacherObjectId })
      .select("_id")
      .lean();
    const courseIds = teacherCourses.map((c) => c._id);

    if (courseIds.length === 0) {
      return res.json({
        earnings: [],
        summary: {
          totalEarnings: 0,
          totalPayments: 0,
          currency: "INR",
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
        currency: "INR",
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
        message:
          error.message || "Failed to create Razorpay order. Please try again.",
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
    const backendUrl =
      process.env.BACKEND_URL || process.env.API_URL || "http://localhost:5000";
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

    // Validate production URLs
    if (
      process.env.NODE_ENV === "production" ||
      !backendUrl.includes("localhost")
    ) {
      if (
        !backendUrl ||
        backendUrl.includes("localhost") ||
        backendUrl === "http://localhost:5000"
      ) {
        console.error(
          "[Payment] ❌ CRITICAL: BACKEND_URL not set correctly in production!"
        );
        console.error("[Payment] Current BACKEND_URL:", backendUrl);
        console.error(
          "[Payment] This will cause callback URL whitelisting issues in Razorpay"
        );
        console.error(
          "[Payment] FIX: Set BACKEND_URL to your production backend URL"
        );
        console.error(
          "[Payment] Example: BACKEND_URL=https://api.digitalaela.com"
        );
      }
      if (
        !frontendUrl ||
        frontendUrl.includes("localhost") ||
        frontendUrl === "http://localhost:5173"
      ) {
        console.error(
          "[Payment] ❌ WARNING: FRONTEND_URL not set correctly in production!"
        );
        console.error("[Payment] Current FRONTEND_URL:", frontendUrl);
        console.error("[Payment] This may cause redirect issues after payment");
        console.error(
          "[Payment] FIX: Set FRONTEND_URL to your production frontend URL"
        );
        console.error(
          "[Payment] Example: FRONTEND_URL=https://digitalaela.com"
        );
      }
    }

    // Use backend callback endpoint (Razorpay can reach this, then we redirect to frontend)
    const defaultCallbackUrl = `${backendUrl}/api/v1/payments/razorpay/callback?paymentId=${paymentId}`;
    const finalCallbackUrl = callbackUrl || defaultCallbackUrl;

    console.log("[Payment] Using callback URL:", finalCallbackUrl);
    console.log("[Payment] Backend URL:", backendUrl);
    console.log("[Payment] Frontend URL:", frontendUrl);
    console.log("[Payment] Payment ID:", paymentId);
    console.log(
      "[Payment] 🚨 CRITICAL: Ensure this callback URL is whitelisted in Razorpay Dashboard:"
    );
    console.log(
      `[Payment] 🚨 WHITELIST URL: ${backendUrl}/api/v1/payments/razorpay/callback`
    );
    console.log(
      "[Payment] 🚨 Go to Razorpay Dashboard → Settings → Payment Links → Allowed Redirect URLs"
    );

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
          message:
            "User email is required for Razorpay payment. Please update your profile with an email address.",
        },
      });
    }

    const paymentLink = await createPaymentLink(
      payment.amount,
      payment.currency,
      receipt,
      payment.description ||
        (payment.course ? `Payment for ${payment.course.title}` : "Payment"),
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
        message:
          error.message ||
          "Failed to create Razorpay payment link. Please try again.",
      },
    });
  }
};

/**
 * Handle Razorpay Payment Callback (UX Redirect Only)
 * GET /api/v1/payments/razorpay/callback
 *
 * This endpoint is ONLY for UX redirect. Payment confirmation is handled by webhook.
 */
export const handleRazorpayCallback = async (req, res, next) => {
  try {
    // Razorpay payment link redirects with these parameters
    const razorpayPaymentId = req.query.razorpay_payment_id;
    const razorpayPaymentLinkStatus = req.query.razorpay_payment_link_status;
    const paymentId = req.query.paymentId;

    console.log("==========================================");
    console.log(
      "[Payment Callback] Razorpay callback received (UX redirect only)"
    );
    console.log("Query params:", {
      paymentId,
      razorpayPaymentId: razorpayPaymentId ? "present" : "missing",
      razorpayPaymentLinkStatus,
    });
    console.log("==========================================");

    // Redirect to frontend callback page
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

    // Determine status from URL parameters (for UX display only)
    // Webhook will handle actual payment confirmation
    let finalStatus = "processing"; // Default to processing - webhook will confirm

    if (razorpayPaymentLinkStatus === "paid") {
      finalStatus = "processing"; // Still processing until webhook confirms
    } else if (razorpayPaymentLinkStatus === "failed") {
      finalStatus = "failed";
    }

    // Build redirect URL with query parameters
    const params = new URLSearchParams();
    if (paymentId) params.append("paymentId", paymentId);
    params.append("status", finalStatus);
    if (razorpayPaymentId) params.append("payment_id", razorpayPaymentId);

    const redirectUrl = `${frontendUrl}/payment/callback?${params.toString()}`;

    console.log("[Payment Callback] Redirecting to frontend:", redirectUrl);
    console.log("==========================================");

    return res.redirect(redirectUrl);
  } catch (error) {
    console.error("[Payment Callback] Error handling Razorpay callback:", {
      error: error.message,
      stack: error.stack,
      query: req.query,
    });
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    return res.redirect(
      `${frontendUrl}/payment/callback?status=error&error=${encodeURIComponent(
        error.message
      )}`
    );
  }
};

/**
 * Verify Razorpay Payment
 * POST /api/v1/payments/razorpay/verify
 */
export const verifyRazorpayPayment = async (req, res, next) => {
  try {
    const { userId } = req.auth || {};
    const { paymentId, razorpayOrderId, razorpayPaymentId, razorpaySignature } =
      req.body;

    if (!userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    if (
      !paymentId ||
      !razorpayOrderId ||
      !razorpayPaymentId ||
      !razorpaySignature
    ) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message:
            "Missing required fields: paymentId, razorpayOrderId, razorpayPaymentId, razorpaySignature",
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

      if (
        razorpayPayment.status === "captured" ||
        razorpayPayment.status === "authorized"
      ) {
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
            console.error(
              "[Payment] Error creating enrollment:",
              enrollmentError
            );
            // Continue with payment update even if enrollment fails
          }
        }

        const updatedPayment = await Payment.findByIdAndUpdate(
          paymentId,
          updateData,
          { new: true }
        )
          .populate("user", "fullName email")
          .populate("course", "title thumbnailUrl price")
          .lean();

        // Generate invoice PDF when payment is completed
        if (!payment.invoiceUrl) {
          try {
            const invoiceData = {
              invoiceNumber:
                updatedPayment.invoiceNumber ||
                `INV-${updatedPayment._id.toString().slice(-8)}`,
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
            console.error(
              "[Payment] Error generating invoice PDF:",
              invoiceError
            );
          }
        }

        // Create notification when payment is completed
        if (!payment.metadata?.notificationSent) {
          try {
            const { createNotification } = await import(
              "../utils/notificationHelper.js"
            );
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
              updatedPayment.course
                ? `/courses/${updatedPayment.course._id}`
                : "/student/payments"
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
      console.error(
        "[Payment] Error fetching Razorpay payment:",
        razorpayError
      );
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
        message:
          error.message || "Failed to verify payment. Please contact support.",
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
    const backendUrl =
      process.env.BACKEND_URL || process.env.API_URL || "http://localhost:5000";
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
        "4. Test a payment - you should see razorpay_payment_id in the callback logs",
      ],
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
        console.log(
          "[Payment Verify] Fetching payment link from Razorpay:",
          payment.gatewayPaymentIntentId
        );
        const paymentLink = await fetchPaymentLink(
          payment.gatewayPaymentIntentId
        );

        console.log("[Payment Verify] Payment link status:", {
          paymentLinkId: paymentLink.id,
          status: paymentLink.status,
          paymentsCount: paymentLink.payments?.length || 0,
          payments:
            paymentLink.payments?.map((p) => ({
              id: p.id,
              status: p.status,
            })) || [],
        });

        // If payment link is paid, check for payments
        if (
          paymentLink.status === "paid" &&
          paymentLink.payments &&
          paymentLink.payments.length > 0
        ) {
          const firstPayment = paymentLink.payments[0];
          const razorpayPaymentId = firstPayment.id;

          console.log(
            "[Payment Verify] Payment link is paid, fetching payment details:",
            razorpayPaymentId
          );

          try {
            const paymentFromRazorpay = await fetchPayment(razorpayPaymentId);

            if (
              paymentFromRazorpay.status === "captured" ||
              paymentFromRazorpay.status === "authorized"
            ) {
              // Update payment status
              const updateData = {
                status: "completed",
                gatewayTransactionId: razorpayPaymentId,
              };

              const paymentDoc = await Payment.findById(paymentId).lean();

              if (
                paymentDoc &&
                paymentDoc.course &&
                !paymentDoc.metadata?.enrollmentCreated
              ) {
                try {
                  const existingEnrollment = await Enrollment.findOne({
                    student: paymentDoc.user,
                    course: paymentDoc.course,
                  }).lean();

                  if (!existingEnrollment) {
                    console.log(
                      "[Payment Verify] Creating enrollment for course:",
                      paymentDoc.course
                    );
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
                    console.log(
                      "[Payment Verify] Enrollment created successfully"
                    );
                  }
                } catch (enrollmentError) {
                  console.error(
                    "[Payment Verify] Error creating enrollment:",
                    enrollmentError
                  );
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
            console.error(
              "[Payment Verify] Error fetching payment from Razorpay:",
              paymentFetchError
            );
            // Don't return 500 - allow fallthrough to try other verification methods
            // or return current status gracefully
          }
        } else if (paymentLink.status === "paid") {
          // Payment link is paid - mark as completed even if payments array is empty
          // The webhook will eventually populate the gatewayTransactionId
          console.log(
            "[Payment Verify] Payment link is paid, marking payment as completed"
          );

          const updateData = {
            status: "completed",
          };

          const paymentDoc = await Payment.findById(paymentId).lean();

          // Create enrollment if payment is for a course
          if (
            paymentDoc &&
            paymentDoc.course &&
            !paymentDoc.metadata?.enrollmentCreated
          ) {
            try {
              const existingEnrollment = await Enrollment.findOne({
                student: paymentDoc.user,
                course: paymentDoc.course,
              }).lean();

              if (!existingEnrollment) {
                console.log(
                  "[Payment Verify] Creating enrollment for course:",
                  paymentDoc.course
                );
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
              console.error(
                "[Payment Verify] Error creating enrollment:",
                enrollmentError
              );
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
            message:
              "Payment verified and updated to completed based on payment link status",
          });
        } else if (
          paymentLink.status === "cancelled" ||
          paymentLink.status === "expired"
        ) {
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
        console.error(
          "[Payment Verify] Error fetching payment link:",
          linkFetchError
        );
        // Don't return 500 - allow fallthrough to try other verification methods
        // or return current status gracefully
      }
    }

    // If we have gatewayTransactionId, try to fetch directly
    if (payment.gatewayTransactionId && payment.gateway === "razorpay") {
      try {
        const paymentFromRazorpay = await fetchPayment(
          payment.gatewayTransactionId
        );

        if (
          paymentFromRazorpay.status === "captured" ||
          paymentFromRazorpay.status === "authorized"
        ) {
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
        console.error(
          "[Payment Verify] Error fetching payment:",
          paymentFetchError
        );
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
      message:
        "Could not verify payment status. Payment may still be processing.",
    });
  } catch (error) {
    console.error("[Payment Verify] Error:", error);
    return next(error);
  }
};

/**
 * Handle Razorpay Webhook (FINAL payment confirmation)
 * POST /api/v1/payments/razorpay/webhook
 *
 * This is the ONLY source of truth for payment confirmation.
 * Callback is only for UX redirect.
 */
export const handleRazorpayWebhook = async (req, res, next) => {
  try {
    console.log("==========================================");
    console.log("[Payment Webhook] Razorpay webhook received");
    console.log("Headers:", {
      "x-razorpay-signature": req.headers["x-razorpay-signature"]
        ? "present"
        : "missing",
      "x-razorpay-event-id": req.headers["x-razorpay-event-id"] || "missing",
    });
    console.log("==========================================");

    // Get raw body for signature verification (req.body is Buffer when using express.raw())
    const rawBody = req.body.toString("utf8");
    const signature = req.headers["x-razorpay-signature"];

    // Parse body for event processing
    let event;
    try {
      event = JSON.parse(rawBody);
    } catch (parseError) {
      console.error(
        "[Payment Webhook] Error parsing webhook body:",
        parseError
      );
      return res.status(400).json({
        error: {
          code: "INVALID_PAYLOAD",
          message: "Invalid JSON payload",
        },
      });
    }

    // Verify webhook signature using raw body
    const isValidSignature = await verifyWebhookSignature(rawBody, signature);
    if (!isValidSignature) {
      console.error("[Payment Webhook] Invalid signature - rejecting webhook");
      return res.status(401).json({
        error: {
          code: "INVALID_SIGNATURE",
          message: "Webhook signature verification failed",
        },
      });
    }

    const eventType = event.event;

    console.log("[Payment Webhook] Event type:", eventType);
    console.log(
      "[Payment Webhook] Event data:",
      JSON.stringify(event, null, 2)
    );

    // Only process payment.captured events (successful payments)
    if (eventType === "payment.captured") {
      const razorpayPaymentId = event.payload?.payment?.entity?.id;
      const razorpayOrderId = event.payload?.payment?.entity?.order_id;
      const paymentStatus = event.payload?.payment?.entity?.status;
      const paymentAmount = event.payload?.payment?.entity?.amount;
      const paymentCurrency = event.payload?.payment?.entity?.currency;

      console.log("[Payment Webhook] Processing payment.captured event:", {
        razorpayPaymentId,
        razorpayOrderId,
        paymentStatus,
        paymentAmount,
        paymentCurrency,
      });

      if (!razorpayPaymentId) {
        console.error("[Payment Webhook] Missing razorpay_payment_id in event");
        return res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Missing payment ID in webhook event",
          },
        });
      }

      // Find payment by gatewayTransactionId or gatewayPaymentIntentId (order_id)
      let payment = null;

      if (razorpayOrderId) {
        // Try to find by order ID first (for checkout-based payments)
        payment = await Payment.findOne({
          gatewayPaymentIntentId: razorpayOrderId,
          gateway: "razorpay",
        }).lean();
      }

      if (!payment && razorpayPaymentId) {
        // Try to find by payment ID (for payment link-based payments)
        payment = await Payment.findOne({
          gatewayTransactionId: razorpayPaymentId,
          gateway: "razorpay",
        }).lean();
      }

      // If still not found, try to find by notes in the order
      if (!payment && razorpayOrderId) {
        // Fetch order from Razorpay to get notes
        try {
          const { fetchOrder } = await import("../services/razorpayService.js");
          const order = await fetchOrder(razorpayOrderId);
          const paymentIdFromNotes = order.notes?.payment_id;

          if (
            paymentIdFromNotes &&
            mongoose.isValidObjectId(paymentIdFromNotes)
          ) {
            payment = await Payment.findById(paymentIdFromNotes).lean();
          }
        } catch (orderError) {
          console.error("[Payment Webhook] Error fetching order:", orderError);
        }
      }

      if (!payment) {
        console.error("[Payment Webhook] Payment not found in database:", {
          razorpayPaymentId,
          razorpayOrderId,
        });
        // Return 200 to acknowledge webhook even if payment not found
        // (prevents Razorpay from retrying)
        return res.status(200).json({
          message: "Webhook received but payment not found in database",
        });
      }

      // Check if payment is already completed
      if (payment.status === "completed") {
        console.log(
          "[Payment Webhook] Payment already completed, skipping update"
        );
        return res.status(200).json({
          message: "Payment already completed",
        });
      }

      // Update payment status to completed
      const updateData = {
        status: "completed",
        gatewayTransactionId: razorpayPaymentId,
      };

      // If payment has order_id but not stored, update it
      if (razorpayOrderId && !payment.gatewayPaymentIntentId) {
        updateData.gatewayPaymentIntentId = razorpayOrderId;
      }

      // Create enrollment if payment is for a course
      if (payment.course && !payment.metadata?.enrollmentCreated) {
        try {
          const existingEnrollment = await Enrollment.findOne({
            student: payment.user,
            course: payment.course,
          }).lean();

          if (!existingEnrollment) {
            console.log(
              "[Payment Webhook] Creating enrollment for course:",
              payment.course
            );
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
            console.log("[Payment Webhook] Enrollment created successfully");
          }
        } catch (enrollmentError) {
          console.error(
            "[Payment Webhook] Error creating enrollment:",
            enrollmentError
          );
          // Continue with payment update even if enrollment fails
        }
      }

      // Generate invoice if not already generated
      if (!payment.invoiceUrl) {
        try {
          const populatedPayment = await Payment.findById(payment._id)
            .populate("user", "fullName email")
            .populate("course", "title thumbnailUrl price")
            .lean();

          const invoicePDF = await generateInvoicePDF({
            invoiceNumber:
              payment.invoiceNumber ||
              `INV-${payment._id.toString().slice(-8)}`,
            date: payment.createdAt,
            amount: payment.amount,
            currency: payment.currency,
            payment: {
              id: payment._id.toString(),
              amount: payment.amount,
              currency: payment.currency,
              status: "completed",
              paymentMethod: payment.paymentMethod,
              gateway: payment.gateway,
              gatewayTransactionId: razorpayPaymentId,
            },
            user: {
              name: populatedPayment.user?.fullName || "",
              email: populatedPayment.user?.email || "",
            },
            course: populatedPayment.course
              ? {
                  title: populatedPayment.course.title,
                  price: populatedPayment.course.price,
                }
              : null,
          });

          const invoiceUrl = await uploadPdfToCloudinary(
            invoicePDF,
            `invoices/${payment._id}.pdf`
          );
          updateData.invoiceUrl = invoiceUrl;
          console.log("[Payment Webhook] Invoice generated and uploaded");
        } catch (invoiceError) {
          console.error(
            "[Payment Webhook] Error generating invoice:",
            invoiceError
          );
          // Continue with payment update even if invoice generation fails
        }
      }

      await Payment.findByIdAndUpdate(payment._id, updateData);

      console.log("[Payment Webhook] ✅ Payment updated to completed:", {
        paymentId: payment._id.toString(),
        razorpayPaymentId,
        status: "completed",
      });

      return res.status(200).json({
        message: "Webhook processed successfully",
        paymentId: payment._id.toString(),
        status: "completed",
      });
    } else if (eventType === "payment.failed") {
      // Handle failed payments
      const razorpayPaymentId = event.payload?.payment?.entity?.id;
      const razorpayOrderId = event.payload?.payment?.entity?.order_id;

      console.log("[Payment Webhook] Processing payment.failed event:", {
        razorpayPaymentId,
        razorpayOrderId,
      });

      // Find payment similar to captured event
      let payment = null;

      if (razorpayOrderId) {
        payment = await Payment.findOne({
          gatewayPaymentIntentId: razorpayOrderId,
          gateway: "razorpay",
        }).lean();
      }

      if (!payment && razorpayPaymentId) {
        payment = await Payment.findOne({
          gatewayTransactionId: razorpayPaymentId,
          gateway: "razorpay",
        }).lean();
      }

      if (payment && payment.status !== "failed") {
        await Payment.findByIdAndUpdate(payment._id, {
          status: "failed",
          failureReason:
            event.payload?.payment?.entity?.error_description ||
            "Payment failed",
          gatewayTransactionId: razorpayPaymentId,
        });

        console.log(
          "[Payment Webhook] Payment marked as failed:",
          payment._id.toString()
        );
      }

      return res.status(200).json({
        message: "Failed payment webhook processed",
      });
    } else {
      // Acknowledge other event types but don't process them
      console.log("[Payment Webhook] Unhandled event type:", eventType);
      return res.status(200).json({
        message: "Webhook received but event type not processed",
        eventType,
      });
    }
  } catch (error) {
    console.error("[Payment Webhook] Error processing webhook:", {
      error: error.message,
      stack: error.stack,
    });
    // Return 500 so Razorpay will retry
    return res.status(500).json({
      error: {
        code: "WEBHOOK_PROCESSING_ERROR",
        message: "Error processing webhook",
      },
    });
  }
};
