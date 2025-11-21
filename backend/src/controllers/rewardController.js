import Reward from "../models/Reward.js";
import RedemptionRequest from "../models/RedemptionRequest.js";
import mongoose from "mongoose";

/**
 * Get all rewards (public - for users)
 * GET /api/v1/rewards
 */
export const getRewards = async (req, res, next) => {
  try {
    const { category, activeOnly = "true" } = req.query;

    const query = {};
    
    if (activeOnly === "true") {
      query.isActive = true;
    }

    if (category) {
      query.category = category;
    }

    // Check if rewards have expired
    const now = new Date();
    query.$or = [
      { expirationDate: null },
      { expirationDate: { $gte: now } },
    ];

    const rewards = await Reward.find(query)
      .sort({ category: 1, cost: 1 })
      .lean();

    return res.status(200).json({
      rewards,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get single reward
 * GET /api/v1/rewards/:id
 */
export const getReward = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid reward ID",
        },
      });
    }

    const reward = await Reward.findById(id).lean();

    if (!reward) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Reward not found",
        },
      });
    }

    return res.status(200).json({
      reward,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Create reward (admin only)
 * POST /api/v1/rewards
 */
export const createReward = async (req, res, next) => {
  try {
    const { userRole, userId } = req.auth;

    if (userRole !== "super-admin") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only super admins can create rewards",
        },
      });
    }

    const {
      name,
      description,
      category,
      cost,
      imageUrl,
      icon,
      limitPerUser,
      globalLimit,
      expirationDate,
    } = req.body;

    if (!name || !category || !cost) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Name, category, and cost are required",
        },
      });
    }

    const validCategories = ["Cash", "Discounts", "Services", "Certificates", "Gifts", "Other"];
    if (!validCategories.includes(category)) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: `Invalid category. Must be one of: ${validCategories.join(", ")}`,
        },
      });
    }

    const reward = await Reward.create({
      name,
      description,
      category,
      cost: parseInt(cost, 10),
      imageUrl: imageUrl || null,
      icon: icon || null,
      limitPerUser: limitPerUser ? parseInt(limitPerUser, 10) : null,
      globalLimit: globalLimit ? parseInt(globalLimit, 10) : null,
      expirationDate: expirationDate ? new Date(expirationDate) : null,
      createdBy: userId,
      isActive: true,
    });

    return res.status(201).json({
      message: "Reward created successfully",
      reward,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Update reward (admin only)
 * PATCH /api/v1/rewards/:id
 */
export const updateReward = async (req, res, next) => {
  try {
    const { userRole } = req.auth;

    if (userRole !== "super-admin") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only super admins can update rewards",
        },
      });
    }

    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid reward ID",
        },
      });
    }

    const reward = await Reward.findById(id);

    if (!reward) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Reward not found",
        },
      });
    }

    const {
      name,
      description,
      category,
      cost,
      imageUrl,
      icon,
      limitPerUser,
      globalLimit,
      expirationDate,
      isActive,
    } = req.body;

    if (category) {
      const validCategories = ["Cash", "Discounts", "Services", "Certificates", "Gifts", "Other"];
      if (!validCategories.includes(category)) {
        return res.status(422).json({
          error: {
            code: "VALIDATION_ERROR",
            message: `Invalid category. Must be one of: ${validCategories.join(", ")}`,
          },
        });
      }
      reward.category = category;
    }

    if (name !== undefined) reward.name = name;
    if (description !== undefined) reward.description = description;
    if (cost !== undefined) reward.cost = parseInt(cost, 10);
    if (imageUrl !== undefined) reward.imageUrl = imageUrl;
    if (icon !== undefined) reward.icon = icon;
    if (limitPerUser !== undefined) reward.limitPerUser = limitPerUser ? parseInt(limitPerUser, 10) : null;
    if (globalLimit !== undefined) reward.globalLimit = globalLimit ? parseInt(globalLimit, 10) : null;
    if (expirationDate !== undefined) reward.expirationDate = expirationDate ? new Date(expirationDate) : null;
    if (isActive !== undefined) reward.isActive = isActive;

    await reward.save();

    return res.status(200).json({
      message: "Reward updated successfully",
      reward,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Delete reward (admin only)
 * DELETE /api/v1/rewards/:id
 */
export const deleteReward = async (req, res, next) => {
  try {
    const { userRole } = req.auth;

    if (userRole !== "super-admin") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only super admins can delete rewards",
        },
      });
    }

    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid reward ID",
        },
      });
    }

    // Check if there are any pending redemption requests for this reward
    const pendingRequests = await RedemptionRequest.countDocuments({
      reward: id,
      status: "pending",
    });

    if (pendingRequests > 0) {
      return res.status(400).json({
        error: {
          code: "CONFLICT",
          message: `Cannot delete reward. There are ${pendingRequests} pending redemption requests.`,
        },
      });
    }

    const reward = await Reward.findByIdAndDelete(id);

    if (!reward) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Reward not found",
        },
      });
    }

    return res.status(200).json({
      message: "Reward deleted successfully",
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get reward analytics (admin only)
 * GET /api/v1/rewards/analytics
 */
export const getRewardAnalytics = async (req, res, next) => {
  try {
    const { userRole } = req.auth;

    if (userRole !== "super-admin") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only super admins can view analytics",
        },
      });
    }

    const totalRewards = await Reward.countDocuments();
    const activeRewards = await Reward.countDocuments({ isActive: true });

    // Get redemption stats
    const totalRequests = await RedemptionRequest.countDocuments();
    const pendingRequests = await RedemptionRequest.countDocuments({ status: "pending" });
    const approvedRequests = await RedemptionRequest.countDocuments({ status: "approved" });
    const rejectedRequests = await RedemptionRequest.countDocuments({ status: "rejected" });

    // Get popular rewards
    const popularRewards = await RedemptionRequest.aggregate([
      {
        $match: { status: "approved" },
      },
      {
        $group: {
          _id: "$reward",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $limit: 10,
      },
      {
        $lookup: {
          from: "rewards",
          localField: "_id",
          foreignField: "_id",
          as: "reward",
        },
      },
      {
        $unwind: "$reward",
      },
      {
        $project: {
          rewardId: "$_id",
          rewardName: "$reward.name",
          category: "$reward.category",
          count: 1,
        },
      },
    ]);

    // Get requests by category
    const requestsByCategory = await RedemptionRequest.aggregate([
      {
        $lookup: {
          from: "rewards",
          localField: "reward",
          foreignField: "_id",
          as: "reward",
        },
      },
      {
        $unwind: "$reward",
      },
      {
        $group: {
          _id: "$reward.category",
          total: { $sum: 1 },
          approved: {
            $sum: { $cond: [{ $eq: ["$status", "approved"] }, 1, 0] },
          },
          rejected: {
            $sum: { $cond: [{ $eq: ["$status", "rejected"] }, 1, 0] },
          },
          pending: {
            $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
          },
        },
      },
    ]);

    return res.status(200).json({
      analytics: {
        rewards: {
          total: totalRewards,
          active: activeRewards,
        },
        redemptions: {
          total: totalRequests,
          pending: pendingRequests,
          approved: approvedRequests,
          rejected: rejectedRequests,
          approvalRate: totalRequests > 0 ? ((approvedRequests / totalRequests) * 100).toFixed(2) : 0,
        },
        popularRewards,
        requestsByCategory,
      },
    });
  } catch (error) {
    return next(error);
  }
};

