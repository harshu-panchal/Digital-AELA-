import mongoose from "mongoose";
import UserRating from "../models/UserRating.js";
import Follow from "../models/Follow.js";
import User from "../models/User.js";
import StudentProfile from "../models/StudentProfile.js";

/**
 * Validate if two users follow each other (mutual follow)
 * @param {string} raterId - ID of the user giving the rating
 * @param {string} ratedUserId - ID of the user being rated
 * @returns {Promise<boolean>} - True if mutual follow exists
 */
const validateMutualFollow = async (raterId, ratedUserId) => {
  if (!mongoose.isValidObjectId(raterId) || !mongoose.isValidObjectId(ratedUserId)) {
    return false;
  }

  const raterObjectId = new mongoose.Types.ObjectId(raterId);
  const ratedUserObjectId = new mongoose.Types.ObjectId(ratedUserId);

  // Check if rater follows rated user
  const raterFollowsRated = await Follow.findOne({
    follower: raterObjectId,
    following: ratedUserObjectId,
  });

  // Check if rated user follows rater
  const ratedFollowsRater = await Follow.findOne({
    follower: ratedUserObjectId,
    following: raterObjectId,
  });

  return !!(raterFollowsRated && ratedFollowsRater);
};

/**
 * Submit a rating for a user
 * POST /api/v1/users/:userId/ratings
 */
export const submitUserRating = async (req, res, next) => {
  try {
    const { userId: ratedUserId } = req.params;
    const { userId: raterId } = req.auth || {};

    if (!raterId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required. Please log in again.",
        },
      });
    }

    if (!ratedUserId) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "User ID is required",
        },
      });
    }

    // Prevent self-rating
    if (raterId === ratedUserId) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "You cannot rate yourself",
        },
      });
    }

    // Validate ObjectIds
    if (!mongoose.isValidObjectId(raterId) || !mongoose.isValidObjectId(ratedUserId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid user ID",
        },
      });
    }

    const raterObjectId = new mongoose.Types.ObjectId(raterId);
    const ratedUserObjectId = new mongoose.Types.ObjectId(ratedUserId);

    // Validate mutual follow
    const hasMutualFollow = await validateMutualFollow(raterId, ratedUserId);
    if (!hasMutualFollow) {
      return res.status(403).json({
        error: {
          code: "MUTUAL_FOLLOW_REQUIRED",
          message: "You must follow each other to rate this user",
        },
      });
    }

    // Validate request body
    const { rating, tags, comment } = req.body;

    if (!rating || typeof rating !== "number" || rating < 1 || rating > 5) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Rating must be a number between 1 and 5",
        },
      });
    }

    // Validate tags (optional array of strings)
    if (tags && (!Array.isArray(tags) || tags.some((tag) => typeof tag !== "string"))) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Tags must be an array of strings",
        },
      });
    }

    // Validate comment length (optional)
    if (comment && typeof comment === "string" && comment.length > 500) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Comment must be 500 characters or less",
        },
      });
    }

    // Check if rating already exists (update if exists, create if new)
    const existingRating = await UserRating.findOne({
      ratedBy: raterObjectId,
      ratedUser: ratedUserObjectId,
    });

    let userRating;
    if (existingRating) {
      // Update existing rating
      existingRating.rating = rating;
      existingRating.tags = tags || [];
      existingRating.comment = comment || "";
      existingRating.context = "general"; // Always general as per plan
      await existingRating.save();
      userRating = existingRating;
    } else {
      // Create new rating
      userRating = await UserRating.create({
        ratedBy: raterObjectId,
        ratedUser: ratedUserObjectId,
        rating,
        tags: tags || [],
        comment: comment || "",
        context: "general",
      });
    }

    // Populate rater info for response
    await userRating.populate("ratedBy", "fullName email metadata");
    await userRating.populate("ratedUser", "fullName email");

    return res.json({
      success: true,
      message: existingRating ? "Rating updated successfully" : "Rating submitted successfully",
      rating: {
        id: userRating._id.toString(),
        ratedBy: {
          id: userRating.ratedBy._id.toString(),
          name: userRating.ratedBy.fullName,
          avatar: userRating.ratedBy.metadata?.avatarUrl || null,
        },
        ratedUser: {
          id: userRating.ratedUser._id.toString(),
          name: userRating.ratedUser.fullName,
        },
        rating: userRating.rating,
        tags: userRating.tags,
        comment: userRating.comment,
        context: userRating.context,
        createdAt: userRating.createdAt,
        updatedAt: userRating.updatedAt,
      },
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get all ratings for a user
 * GET /api/v1/users/:userId/ratings
 */
export const getUserRatings = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "User ID is required",
        },
      });
    }

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid user ID",
        },
      });
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Get all ratings for this user
    const ratings = await UserRating.find({ ratedUser: userObjectId })
      .populate("ratedBy", "fullName email metadata")
      .sort({ createdAt: -1 })
      .lean();

    // Format ratings for response
    const formattedRatings = ratings.map((rating) => ({
      id: rating._id.toString(),
      ratedBy: {
        id: rating.ratedBy._id.toString(),
        name: rating.ratedBy.fullName,
        avatar: rating.ratedBy.metadata?.avatarUrl || null,
      },
      rating: rating.rating,
      tags: rating.tags || [],
      comment: rating.comment || "",
      context: rating.context || "general",
      createdAt: rating.createdAt,
      updatedAt: rating.updatedAt,
    }));

    // Calculate statistics
    const totalRatings = ratings.length;
    const averageRating =
      totalRatings > 0
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings
        : 0;

    // Calculate tag statistics
    const tagCounts = {};
    ratings.forEach((rating) => {
      if (rating.tags && Array.isArray(rating.tags)) {
        rating.tags.forEach((tag) => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });

    const tagStats = Object.entries(tagCounts).map(([label, count]) => ({
      label,
      count,
    }));

    return res.json({
      ratings: formattedRatings,
      statistics: {
        totalRatings,
        averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
        tagStats: tagStats.sort((a, b) => b.count - a.count), // Sort by count descending
      },
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get aggregated rating statistics for a user
 * GET /api/v1/users/:userId/ratings/stats
 */
export const getUserRatingStats = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "User ID is required",
        },
      });
    }

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid user ID",
        },
      });
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Get all ratings for this user
    const ratings = await UserRating.find({ ratedUser: userObjectId }).lean();

    // Calculate statistics
    const totalRatings = ratings.length;
    const averageRating =
      totalRatings > 0
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings
        : 0;

    // Calculate tag statistics
    const tagCounts = {};
    ratings.forEach((rating) => {
      if (rating.tags && Array.isArray(rating.tags)) {
        rating.tags.forEach((tag) => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });

    const tagStats = Object.entries(tagCounts).map(([label, count]) => ({
      label,
      count,
    }));

    // Rating distribution (1-5 stars)
    const ratingDistribution = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };
    ratings.forEach((rating) => {
      const starRating = Math.round(rating.rating);
      if (starRating >= 1 && starRating <= 5) {
        ratingDistribution[starRating]++;
      }
    });

    return res.json({
      totalRatings,
      averageRating: Math.round(averageRating * 10) / 10,
      tagStats: tagStats.sort((a, b) => b.count - a.count),
      ratingDistribution,
    });
  } catch (error) {
    return next(error);
  }
};

