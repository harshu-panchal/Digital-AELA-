import mongoose from "mongoose";
import Earning from "../models/Earning.js";
import PayoutRequest from "../models/PayoutRequest.js";
import PaymentSlip from "../models/PaymentSlip.js";
import Payment from "../models/Payment.js";
import Course from "../models/Course.js";
import User from "../models/User.js";

/**
 * Get Teacher Earnings Summary
 * GET /api/v1/earnings/summary
 */
export const getEarningsSummary = async (req, res, next) => {
  try {
    const { userId, userRole } = req.auth || {};
    const { month, year, courseId } = req.query;

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

    const query = { teacher: teacherObjectId };
    if (month) query.month = Number(month);
    if (year) query.year = Number(year);
    if (courseId && mongoose.isValidObjectId(courseId)) {
      query.course = new mongoose.Types.ObjectId(courseId);
    }

    const earnings = await Earning.find(query).populate("course", "title").lean();

    const summary = {
      totalEarnings: 0,
      availableEarnings: 0,
      pendingEarnings: 0,
      paidEarnings: 0,
      byType: {
        course_sale: 0,
        referral: 0,
        bonus: 0,
        commission: 0,
        other: 0,
      },
      byMonth: {},
      byCourse: {},
    };

    earnings.forEach((earning) => {
      summary.totalEarnings += earning.amount;
      summary.byType[earning.earningType] =
        (summary.byType[earning.earningType] || 0) + earning.amount;

      if (earning.status === "available") {
        summary.availableEarnings += earning.amount;
      } else if (earning.status === "pending") {
        summary.pendingEarnings += earning.amount;
      } else if (earning.status === "paid") {
        summary.paidEarnings += earning.amount;
      }

      const monthKey = `${earning.year}-${earning.month}`;
      if (!summary.byMonth[monthKey]) {
        summary.byMonth[monthKey] = { earnings: 0, count: 0 };
      }
      summary.byMonth[monthKey].earnings += earning.amount;
      summary.byMonth[monthKey].count += 1;

      if (earning.course) {
        const courseId = earning.course._id.toString();
        if (!summary.byCourse[courseId]) {
          summary.byCourse[courseId] = {
            courseId,
            courseTitle: earning.course.title,
            earnings: 0,
            count: 0,
          };
        }
        summary.byCourse[courseId].earnings += earning.amount;
        summary.byCourse[courseId].count += 1;
      }
    });

    return res.json({
      summary,
      earnings: earnings.slice(0, 50), // Return recent earnings
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get Monthly Earnings
 * GET /api/v1/earnings/monthly
 */
export const getMonthlyEarnings = async (req, res, next) => {
  try {
    const { userId, userRole } = req.auth || {};
    const { year } = req.query;

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

    const query = { teacher: teacherObjectId };
    if (year) query.year = Number(year);

    const earnings = await Earning.find(query)
      .populate("course", "title")
      .sort({ year: -1, month: -1 })
      .lean();

    const monthlyData = {};
    earnings.forEach((earning) => {
      const key = `${earning.year}-${String(earning.month).padStart(2, "0")}`;
      if (!monthlyData[key]) {
        monthlyData[key] = {
          year: earning.year,
          month: earning.month,
          totalEarnings: 0,
          availableEarnings: 0,
          paidEarnings: 0,
          count: 0,
        };
      }
      monthlyData[key].totalEarnings += earning.amount;
      monthlyData[key].count += 1;
      if (earning.status === "available") {
        monthlyData[key].availableEarnings += earning.amount;
      } else if (earning.status === "paid") {
        monthlyData[key].paidEarnings += earning.amount;
      }
    });

    return res.json({
      monthly: Object.values(monthlyData).sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
      }),
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get Course Earnings
 * GET /api/v1/earnings/courses
 */
export const getCourseEarnings = async (req, res, next) => {
  try {
    const { userId, userRole } = req.auth || {};
    const { startDate, endDate } = req.query;

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

    const query = { teacher: teacherObjectId };
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const earnings = await Earning.find(query)
      .populate("course", "title thumbnailUrl")
      .populate("payment", "amount currency")
      .sort({ createdAt: -1 })
      .lean();

    const courseEarnings = {};
    earnings.forEach((earning) => {
      if (earning.course) {
        const courseId = earning.course._id.toString();
        if (!courseEarnings[courseId]) {
          courseEarnings[courseId] = {
            courseId,
            courseTitle: earning.course.title,
            courseThumbnail: earning.course.thumbnailUrl,
            totalEarnings: 0,
            availableEarnings: 0,
            paidEarnings: 0,
            count: 0,
            earnings: [],
          };
        }
        courseEarnings[courseId].totalEarnings += earning.amount;
        courseEarnings[courseId].count += 1;
        if (earning.status === "available") {
          courseEarnings[courseId].availableEarnings += earning.amount;
        } else if (earning.status === "paid") {
          courseEarnings[courseId].paidEarnings += earning.amount;
        }
        courseEarnings[courseId].earnings.push(earning);
      }
    });

    return res.json({
      courses: Object.values(courseEarnings),
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Create Payout Request
 * POST /api/v1/earnings/payout-requests
 */
export const createPayoutRequest = async (req, res, next) => {
  try {
    const { userId, userRole } = req.auth || {};
    const { amount, paymentMethod, paymentDetails, earningsIds, notes } = req.body;

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
          message: "Only teachers can create payout requests",
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

    const teacherObjectId = mongoose.isValidObjectId(userId)
      ? new mongoose.Types.ObjectId(userId)
      : null;

    // Get available earnings
    const availableEarnings = await Earning.find({
      teacher: teacherObjectId,
      status: "available",
    }).lean();

    const totalAvailable = availableEarnings.reduce((sum, e) => sum + e.amount, 0);

    if (amount > totalAvailable) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: `Requested amount exceeds available earnings. Available: ${totalAvailable}`,
        },
      });
    }

    // If specific earnings are requested, validate them
    let earningsToInclude = [];
    if (earningsIds && Array.isArray(earningsIds) && earningsIds.length > 0) {
      const earningsObjectIds = earningsIds
        .filter((id) => mongoose.isValidObjectId(id))
        .map((id) => new mongoose.Types.ObjectId(id));

      earningsToInclude = await Earning.find({
        _id: { $in: earningsObjectIds },
        teacher: teacherObjectId,
        status: "available",
      }).lean();

      const requestedTotal = earningsToInclude.reduce((sum, e) => sum + e.amount, 0);
      if (Math.abs(requestedTotal - amount) > 0.01) {
        return res.status(422).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Requested amount doesn't match selected earnings",
          },
        });
      }
    } else {
      // Auto-select earnings to match amount
      let remaining = amount;
      for (const earning of availableEarnings.sort((a, b) => a.createdAt - b.createdAt)) {
        if (remaining <= 0) break;
        earningsToInclude.push(earning);
        remaining -= earning.amount;
      }
    }

    const payoutRequest = await PayoutRequest.create({
      teacher: teacherObjectId,
      amount: Number(amount),
      paymentMethod: paymentMethod || "bank_transfer",
      paymentDetails: paymentDetails || {},
      earnings: earningsToInclude.map((e) => e._id),
      notes: notes || "",
      status: "pending",
    });

    // Update earnings status to pending
    await Earning.updateMany(
      { _id: { $in: earningsToInclude.map((e) => e._id) } },
      { status: "pending", payoutRequest: payoutRequest._id }
    );

    const populatedRequest = await PayoutRequest.findById(payoutRequest._id)
      .populate("teacher", "fullName email")
      .populate("earnings")
      .lean();

    return res.status(201).json({
      payoutRequest: populatedRequest,
      message: "Payout request created successfully",
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get Payout Requests
 * GET /api/v1/earnings/payout-requests
 */
export const getPayoutRequests = async (req, res, next) => {
  try {
    const { userId, userRole } = req.auth || {};
    const { status, page = 1, pageSize = 20 } = req.query;

    if (!userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    const teacherObjectId = mongoose.isValidObjectId(userId)
      ? new mongoose.Types.ObjectId(userId)
      : null;

    const query = {};
    if (userRole === "teacher") {
      query.teacher = teacherObjectId;
    } else if (userRole !== "super-admin") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Access denied",
        },
      });
    }

    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(pageSize);

    const [payoutRequests, total] = await Promise.all([
      PayoutRequest.find(query)
        .populate("teacher", "fullName email")
        .populate("earnings")
        .populate("approvedBy", "fullName")
        .populate("paymentSlip")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(pageSize))
        .lean(),
      PayoutRequest.countDocuments(query),
    ]);

    return res.json({
      payoutRequests,
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
 * Update Payout Request Status (Admin)
 * PUT /api/v1/earnings/payout-requests/:requestId
 */
export const updatePayoutRequest = async (req, res, next) => {
  try {
    const { userId, userRole } = req.auth || {};
    const { requestId } = req.params;
    const { status, rejectionReason, notes } = req.body;

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
          message: "Only admins can update payout requests",
        },
      });
    }

    if (!mongoose.isValidObjectId(requestId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid request ID",
        },
      });
    }

    const payoutRequest = await PayoutRequest.findById(requestId).lean();
    if (!payoutRequest) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Payout request not found",
        },
      });
    }

    const userObjectId = mongoose.isValidObjectId(userId)
      ? new mongoose.Types.ObjectId(userId)
      : null;

    const updateData = {};
    if (status) {
      updateData.status = status;
      if (status === "approved") {
        updateData.approvedAt = new Date();
        updateData.approvedBy = userObjectId;
      } else if (status === "completed") {
        updateData.completedAt = new Date();
        // Update earnings status to paid
        await Earning.updateMany(
          { payoutRequest: new mongoose.Types.ObjectId(requestId) },
          { status: "paid", paidAt: new Date(), paidVia: "payout_request" }
        );
      } else if (status === "rejected") {
        // Return earnings to available
        await Earning.updateMany(
          { payoutRequest: new mongoose.Types.ObjectId(requestId) },
          { status: "available", payoutRequest: null }
        );
      }
      if (rejectionReason) updateData.rejectionReason = rejectionReason;
    }
    if (notes) updateData.notes = notes;

    const updatedRequest = await PayoutRequest.findByIdAndUpdate(requestId, updateData, {
      new: true,
    })
      .populate("teacher", "fullName email")
      .populate("earnings")
      .populate("approvedBy", "fullName")
      .lean();

    return res.json({
      payoutRequest: updatedRequest,
      message: "Payout request updated successfully",
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Generate Payment Slip
 * POST /api/v1/earnings/payment-slips
 */
export const generatePaymentSlip = async (req, res, next) => {
  try {
    const { userId, userRole } = req.auth || {};
    const { payoutRequestId } = req.body;

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
          message: "Only admins can generate payment slips",
        },
      });
    }

    if (!mongoose.isValidObjectId(payoutRequestId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid payout request ID",
        },
      });
    }

    const payoutRequest = await PayoutRequest.findById(payoutRequestId)
      .populate("teacher", "fullName email")
      .populate("earnings")
      .lean();

    if (!payoutRequest) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Payout request not found",
        },
      });
    }

    if (payoutRequest.status !== "approved" && payoutRequest.status !== "completed") {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Payment slip can only be generated for approved/completed requests",
        },
      });
    }

    // Check if slip already exists
    const existingSlip = await PaymentSlip.findOne({ payoutRequest: payoutRequestId }).lean();
    if (existingSlip) {
      return res.json({
        paymentSlip: existingSlip,
        message: "Payment slip already exists",
      });
    }

    const userObjectId = mongoose.isValidObjectId(userId)
      ? new mongoose.Types.ObjectId(userId)
      : null;

    // Get earnings period
    const earnings = await Earning.find({
      _id: { $in: payoutRequest.earnings.map((e) => e._id || e) },
    })
      .sort({ createdAt: 1 })
      .lean();

    const startDate = earnings.length > 0 ? earnings[0].createdAt : payoutRequest.requestedAt;
    const endDate =
      earnings.length > 0 ? earnings[earnings.length - 1].createdAt : payoutRequest.requestedAt;

    const paymentSlip = await PaymentSlip.create({
      payoutRequest: new mongoose.Types.ObjectId(payoutRequestId),
      teacher: payoutRequest.teacher._id || payoutRequest.teacher,
      amount: payoutRequest.amount,
      currency: payoutRequest.currency,
      period: {
        startDate,
        endDate,
      },
      earnings: earnings.map((earning) => ({
        earning: earning._id,
        amount: earning.amount,
        description: earning.description || earning.earningType,
      })),
      generatedBy: userObjectId,
      pdfUrl: `/api/v1/earnings/payment-slips/${payoutRequestId}/pdf`, // Placeholder
    });

    // Update payout request with payment slip
    await PayoutRequest.findByIdAndUpdate(payoutRequestId, {
      paymentSlip: paymentSlip._id,
    });

    const populatedSlip = await PaymentSlip.findById(paymentSlip._id)
      .populate("teacher", "fullName email")
      .populate("payoutRequest")
      .lean();

    return res.status(201).json({
      paymentSlip: populatedSlip,
      message: "Payment slip generated successfully",
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get Payment Slips
 * GET /api/v1/earnings/payment-slips
 */
export const getPaymentSlips = async (req, res, next) => {
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

    const teacherObjectId = mongoose.isValidObjectId(userId)
      ? new mongoose.Types.ObjectId(userId)
      : null;

    const query = {};
    if (userRole === "teacher") {
      query.teacher = teacherObjectId;
    } else if (userRole !== "super-admin") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Access denied",
        },
      });
    }

    const skip = (Number(page) - 1) * Number(pageSize);

    const [paymentSlips, total] = await Promise.all([
      PaymentSlip.find(query)
        .populate("teacher", "fullName email")
        .populate("payoutRequest")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(pageSize))
        .lean(),
      PaymentSlip.countDocuments(query),
    ]);

    return res.json({
      paymentSlips,
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
 * Get Referral Earnings
 * GET /api/v1/earnings/referrals
 */
export const getReferralEarnings = async (req, res, next) => {
  try {
    const { userId, userRole } = req.auth || {};
    const { startDate, endDate } = req.query;

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
          message: "Only teachers can access referral earnings",
        },
      });
    }

    const teacherObjectId = mongoose.isValidObjectId(userId)
      ? new mongoose.Types.ObjectId(userId)
      : null;

    const query = {
      teacher: teacherObjectId,
      earningType: "referral",
    };

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const earnings = await Earning.find(query)
      .populate("payment", "amount currency user")
      .sort({ createdAt: -1 })
      .lean();

    const totalReferralEarnings = earnings.reduce((sum, e) => sum + e.amount, 0);

    return res.json({
      referralEarnings: earnings,
      summary: {
        totalEarnings: totalReferralEarnings,
        count: earnings.length,
        currency: "AED",
      },
    });
  } catch (error) {
    return next(error);
  }
};

