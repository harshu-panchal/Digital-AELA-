import mongoose from "mongoose";
import Payment from "../models/Payment.js";
import Course from "../models/Course.js";
import Enrollment from "../models/Enrollment.js";
import User from "../models/User.js";

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

    // Generate invoice data (in production, you'd generate a PDF here)
    const invoiceData = {
      invoiceNumber: payment.invoiceNumber || `INV-${payment._id.toString().slice(-8)}`,
      date: payment.createdAt,
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

    // In production, generate PDF and return URL
    // For now, return invoice data
    return res.json({
      invoice: invoiceData,
      invoiceUrl: payment.invoiceUrl || null,
      message: "Invoice data retrieved. PDF generation can be implemented separately.",
    });
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

