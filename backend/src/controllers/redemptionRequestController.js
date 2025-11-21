import RedemptionRequest from "../models/RedemptionRequest.js";
import Reward from "../models/Reward.js";
import StudentPoints from "../models/StudentPoints.js";
import User from "../models/User.js";
import StudentProfile from "../models/StudentProfile.js";
import mongoose from "mongoose";

/**
 * Create redemption request
 * POST /api/v1/redemption-requests
 */
export const createRedemptionRequest = async (req, res, next) => {
  try {
    const { userId } = req.auth;
    const { rewardId } = req.body;

    if (!rewardId) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Reward ID is required",
        },
      });
    }

    if (!mongoose.isValidObjectId(rewardId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid reward ID",
        },
      });
    }

    // Get reward
    const reward = await Reward.findById(rewardId);

    if (!reward) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Reward not found",
        },
      });
    }

    if (!reward.isActive) {
      return res.status(400).json({
        error: {
          code: "INVALID_STATE",
          message: "This reward is not available",
        },
      });
    }

    // Check expiration
    if (reward.expirationDate && new Date(reward.expirationDate) < new Date()) {
      return res.status(400).json({
        error: {
          code: "INVALID_STATE",
          message: "This reward has expired",
        },
      });
    }

    // Check global limit
    if (reward.globalLimit && reward.currentRedemptions >= reward.globalLimit) {
      return res.status(400).json({
        error: {
          code: "LIMIT_REACHED",
          message: "This reward has reached its global redemption limit",
        },
      });
    }

    // Check user limit
    const userRedemptions = await RedemptionRequest.countDocuments({
      user: userId,
      reward: rewardId,
      status: "approved",
    });

    if (reward.limitPerUser && userRedemptions >= reward.limitPerUser) {
      return res.status(400).json({
        error: {
          code: "LIMIT_REACHED",
          message: `You have reached the limit of ${reward.limitPerUser} redemption(s) for this reward`,
        },
      });
    }

    // Get user points
    const studentObjectId = new mongoose.Types.ObjectId(userId);
    let studentPoints = await StudentPoints.findOne({ student: studentObjectId });

    if (!studentPoints) {
      studentPoints = await StudentPoints.create({
        student: studentObjectId,
        totalCoins: 0,
        redeemedCoins: 0,
        pendingCoins: 0,
        streak: 0,
        transactions: [],
      });
    }

    const availableCoins = (studentPoints.totalCoins || 0) - (studentPoints.redeemedCoins || 0) - (studentPoints.pendingCoins || 0);

    if (availableCoins < reward.cost) {
      return res.status(400).json({
        error: {
          code: "INSUFFICIENT_POINTS",
          message: `Insufficient coins. You need ${reward.cost} coins but only have ${availableCoins} available.`,
        },
      });
    }

    // Check for pending requests for same reward
    const existingPending = await RedemptionRequest.findOne({
      user: userId,
      reward: rewardId,
      status: "pending",
    });

    if (existingPending) {
      return res.status(400).json({
        error: {
          code: "DUPLICATE_REQUEST",
          message: "You already have a pending request for this reward",
        },
      });
    }

    // Reserve coins
    studentPoints.pendingCoins = (studentPoints.pendingCoins || 0) + reward.cost;
    await studentPoints.save();

    // Create redemption request
    const redemptionRequest = await RedemptionRequest.create({
      user: userId,
      reward: rewardId,
      coinsRequested: reward.cost,
      coinsReserved: reward.cost,
      status: "pending",
    });

    // Populate reward details
    await redemptionRequest.populate("reward", "name description category cost icon");

    return res.status(201).json({
      message: "Redemption request created successfully",
      redemptionRequest,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get user's redemption requests
 * GET /api/v1/redemption-requests/my-requests
 */
export const getMyRedemptionRequests = async (req, res, next) => {
  try {
    const { userId } = req.auth;
    const { status, page = 1, pageSize = 20 } = req.query;

    const query = { user: userId };

    if (status && ["pending", "approved", "rejected"].includes(status)) {
      query.status = status;
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(pageSize, 10);
    const limit = parseInt(pageSize, 10);

    const requests = await RedemptionRequest.find(query)
      .populate("reward", "name description category cost icon imageUrl")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await RedemptionRequest.countDocuments(query);

    return res.status(200).json({
      requests,
      pagination: {
        page: parseInt(page, 10),
        pageSize: limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get all redemption requests (admin only)
 * GET /api/v1/redemption-requests
 */
export const getAllRedemptionRequests = async (req, res, next) => {
  try {
    const { userRole } = req.auth;

    if (userRole !== "super-admin") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only super admins can view all redemption requests",
        },
      });
    }

    const { status, category, startDate, endDate, page = 1, pageSize = 20 } = req.query;

    const query = {};

    if (status && ["pending", "approved", "rejected"].includes(status)) {
      query.status = status;
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

    const skip = (parseInt(page, 10) - 1) * parseInt(pageSize, 10);
    const limit = parseInt(pageSize, 10);

    let requests = await RedemptionRequest.find(query)
      .populate("reward", "name description category cost icon imageUrl")
      .populate("user", "fullName email")
      .populate("approvedBy", "fullName")
      .populate("rejectedBy", "fullName")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Filter by category if provided
    if (category) {
      requests = requests.filter((req) => req.reward?.category === category);
    }

    // Get user profile details
    for (const request of requests) {
      if (request.user) {
        const profile = await StudentProfile.findOne({ user: request.user._id }).lean();
        if (profile) {
          request.userProfile = {
            phone: profile.phone,
            location: profile.location,
          };
        }
      }
    }

    // Re-count total after category filter
    let total = await RedemptionRequest.countDocuments(query);
    if (category) {
      const allRequests = await RedemptionRequest.find(query)
        .populate("reward", "category")
        .lean();
      total = allRequests.filter((req) => req.reward?.category === category).length;
    }

    return res.status(200).json({
      requests,
      pagination: {
        page: parseInt(page, 10),
        pageSize: limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get single redemption request
 * GET /api/v1/redemption-requests/:id
 */
export const getRedemptionRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userId, userRole } = req.auth;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid request ID",
        },
      });
    }

    const request = await RedemptionRequest.findById(id)
      .populate("reward", "name description category cost icon imageUrl")
      .populate("user", "fullName email")
      .populate("approvedBy", "fullName")
      .populate("rejectedBy", "fullName")
      .lean();

    if (!request) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Redemption request not found",
        },
      });
    }

    // Check if user has access
    if (userRole !== "super-admin" && request.user._id.toString() !== userId) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "You don't have access to this request",
        },
      });
    }

    // Get user profile if admin
    if (userRole === "super-admin" && request.user) {
      const profile = await StudentProfile.findOne({ user: request.user._id }).lean();
      if (profile) {
        request.userProfile = {
          phone: profile.phone,
          location: profile.location,
        };
      }
    }

    return res.status(200).json({
      request,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Approve redemption request (admin only)
 * PATCH /api/v1/redemption-requests/:id/approve
 */
export const approveRedemptionRequest = async (req, res, next) => {
  try {
    const { userRole, userId } = req.auth;

    if (userRole !== "super-admin") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only super admins can approve requests",
        },
      });
    }

    const { id } = req.params;
    const { adminNotes } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid request ID",
        },
      });
    }

    const request = await RedemptionRequest.findById(id);

    if (!request) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Redemption request not found",
        },
      });
    }

    if (request.status !== "pending") {
      return res.status(400).json({
        error: {
          code: "INVALID_STATE",
          message: `Request is already ${request.status}`,
        },
      });
    }

    // Get user points
    const studentObjectId = new mongoose.Types.ObjectId(request.user);
    let studentPoints = await StudentPoints.findOne({ student: studentObjectId });

    if (!studentPoints) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Student points record not found",
        },
      });
    }

    // Check if coins are still available
    const availableCoins = (studentPoints.totalCoins || 0) - (studentPoints.redeemedCoins || 0) - (studentPoints.pendingCoins || 0) + request.coinsReserved;

    if (availableCoins < request.coinsRequested) {
      return res.status(400).json({
        error: {
          code: "INSUFFICIENT_POINTS",
          message: "User no longer has sufficient coins",
        },
      });
    }

    // Deduct coins and release reserved coins
    studentPoints.pendingCoins = Math.max(0, (studentPoints.pendingCoins || 0) - request.coinsReserved);
    studentPoints.redeemedCoins = (studentPoints.redeemedCoins || 0) + request.coinsRequested;

    // Add transaction
    const transaction = {
      type: "redeemed",
      amount: request.coinsRequested,
      reason: `Redemption: ${request.reward?.name || "Reward"}`,
      source: "redemption",
      createdAt: new Date(),
    };

    studentPoints.transactions = studentPoints.transactions || [];
    studentPoints.transactions.push(transaction);

    // Keep only last 500 transactions
    if (studentPoints.transactions.length > 500) {
      studentPoints.transactions = studentPoints.transactions.slice(-500);
    }

    await studentPoints.save();

    // Update request
    request.status = "approved";
    request.approvedBy = userId;
    request.approvedAt = new Date();
    if (adminNotes) {
      request.adminNotes = adminNotes;
    }
    await request.save();

    // Update reward redemption count
    const reward = await Reward.findById(request.reward);
    if (reward) {
      reward.currentRedemptions = (reward.currentRedemptions || 0) + 1;
      await reward.save();
    }

    // Populate for response
    await request.populate([
      { path: "reward", select: "name description category cost icon imageUrl" },
      { path: "user", select: "fullName email" },
      { path: "approvedBy", select: "fullName" },
    ]);

    return res.status(200).json({
      message: "Redemption request approved successfully",
      request,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Reject redemption request (admin only)
 * PATCH /api/v1/redemption-requests/:id/reject
 */
export const rejectRedemptionRequest = async (req, res, next) => {
  try {
    const { userRole, userId } = req.auth;

    if (userRole !== "super-admin") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only super admins can reject requests",
        },
      });
    }

    const { id } = req.params;
    const { rejectionReason, adminNotes } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid request ID",
        },
      });
    }

    const request = await RedemptionRequest.findById(id);

    if (!request) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Redemption request not found",
        },
      });
    }

    if (request.status !== "pending") {
      return res.status(400).json({
        error: {
          code: "INVALID_STATE",
          message: `Request is already ${request.status}`,
        },
      });
    }

    // Get user points
    const studentObjectId = new mongoose.Types.ObjectId(request.user);
    let studentPoints = await StudentPoints.findOne({ student: studentObjectId });

    if (!studentPoints) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Student points record not found",
        },
      });
    }

    // Release reserved coins
    studentPoints.pendingCoins = Math.max(0, (studentPoints.pendingCoins || 0) - request.coinsReserved);
    await studentPoints.save();

    // Update request
    request.status = "rejected";
    request.rejectedBy = userId;
    request.rejectedAt = new Date();
    if (rejectionReason) {
      request.rejectionReason = rejectionReason;
    }
    if (adminNotes) {
      request.adminNotes = adminNotes;
    }
    await request.save();

    // Populate for response
    await request.populate([
      { path: "reward", select: "name description category cost icon imageUrl" },
      { path: "user", select: "fullName email" },
      { path: "rejectedBy", select: "fullName" },
    ]);

    return res.status(200).json({
      message: "Redemption request rejected successfully",
      request,
    });
  } catch (error) {
    return next(error);
  }
};

