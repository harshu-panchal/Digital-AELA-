import mongoose from "mongoose";
import Payment from "../models/Payment.js";
import Course from "../models/Course.js";
import Enrollment from "../models/Enrollment.js";
import User from "../models/User.js";
import { generateInvoicePDF } from "../utils/pdfGenerator.js";
import { uploadPdfToCloudinary } from "../middleware/uploadMiddleware.js";

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
          `digital-aela/invoices/${paymentId}`
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

      // Upload to Cloudinary
      const uploadResult = await uploadPdfToCloudinary(
        pdfBuffer,
        `digital-aela/invoices/${payment._id}`
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

