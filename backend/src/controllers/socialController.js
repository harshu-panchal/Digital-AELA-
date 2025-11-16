import mongoose from "mongoose";
import Follow from "../models/Follow.js";
import UserRating from "../models/UserRating.js";
import User from "../models/User.js";
import StudentProfile from "../models/StudentProfile.js";
import StudentPoints from "../models/StudentPoints.js";

export const getSocialStats = async (req, res, next) => {
  try {
    // Allow userId from params (for public profiles) or from auth (for own profile)
    const userId = req.params.userId || req.auth?.userId;
    
    // If no userId provided and no auth, return default values (0, 0, 0)
    if (!userId) {
      return res.json({
        followers: 0,
        following: 0,
        rating: 0,
        totalRatings: 0,
      });
    }

    // If invalid ObjectId, return default values instead of error
    if (!mongoose.isValidObjectId(userId)) {
      return res.json({
        followers: 0,
        following: 0,
        rating: 0,
        totalRatings: 0,
      });
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Get followers count (users who follow this user)
    const followersCount = await Follow.countDocuments({ following: userObjectId });

    // Get following count (users this user follows)
    const followingCount = await Follow.countDocuments({ follower: userObjectId });

    // Get average rating
    const ratings = await UserRating.find({ ratedUser: userObjectId });
    const averageRating =
      ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
        : 0;

    return res.json({
      followers: followersCount,
      following: followingCount,
      rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
      totalRatings: ratings.length,
    });
  } catch (error) {
    return next(error);
  }
};

export const getFollowers = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { page = 1, pageSize = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid user ID",
        },
      });
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    const [follows, total] = await Promise.all([
      Follow.find({ following: userObjectId })
        .populate("follower", "fullName email metadata")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(pageSize)),
      Follow.countDocuments({ following: userObjectId }),
    ]);

    // Get additional profile data for each follower
    const followersWithProfiles = await Promise.all(
      follows.map(async (follow) => {
        const follower = follow.follower;
        if (!follower) return null;

        // Get student profile if available
        const profile = await StudentProfile.findOne({ user: follower._id });

        // Get mutual follows count (if authenticated user is viewing)
        const currentUserId = req.auth?.userId || req.auth?.user?.id;
        let mutuals = 0;
        if (currentUserId && mongoose.isValidObjectId(currentUserId)) {
          const currentUserObjectId = new mongoose.Types.ObjectId(currentUserId);
          // Count how many users both the current user and this follower follow
          const currentUserFollowing = await Follow.find({ follower: currentUserObjectId }).select("following");
          const followerFollowing = await Follow.find({ follower: follower._id }).select("following");
          const currentUserFollowingIds = new Set(currentUserFollowing.map((f) => f.following.toString()));
          const followerFollowingIds = new Set(followerFollowing.map((f) => f.following.toString()));
          mutuals = [...currentUserFollowingIds].filter((id) => followerFollowingIds.has(id)).length;
        }

        // Get coins shared - calculate from StudentPoints transactions
        // Look for transactions where coins were shared with this follower
        let coinsShared = 0;
        if (currentUserId && mongoose.isValidObjectId(currentUserId)) {
          try {
            const currentUserPoints = await StudentPoints.findOne({ student: currentUserObjectId });
            if (currentUserPoints && currentUserPoints.transactions) {
              // Sum transactions that mention this follower or have "gift" in reason
              const followerName = follower.fullName || "";
              const sharedTransactions = currentUserPoints.transactions.filter(
                (txn) =>
                  (txn.reason && 
                    (txn.reason.toLowerCase().includes("gift") || 
                     txn.reason.toLowerCase().includes("shared") ||
                     txn.reason.toLowerCase().includes(followerName.toLowerCase()))) ||
                  (txn.source && txn.source.toLowerCase().includes("share"))
              );
              coinsShared = sharedTransactions.reduce((sum, txn) => sum + (txn.amount || 0), 0);
            }
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error("Error calculating coins shared:", error);
            coinsShared = 0;
          }
        }

        // Get total coins earned for this follower
        let totalEarned = 0;
        try {
          const followerPoints = await StudentPoints.findOne({ student: follower._id });
          if (followerPoints && followerPoints.transactions && Array.isArray(followerPoints.transactions)) {
            // Calculate totalEarned from transactions (sum of all earned and bonus transactions)
            totalEarned = followerPoints.transactions
              .filter((txn) => txn.type === "earned" || txn.type === "bonus")
              .reduce((sum, txn) => sum + (txn.amount || 0), 0);
          }
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error("Error calculating total earned for follower:", error);
          totalEarned = 0;
        }

        // Get rating
        const ratings = await UserRating.find({ ratedUser: follower._id });
        const rating =
          ratings.length > 0
            ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
            : 0;

        // Format AELA ID - use user ID as is, or format it if there's a pattern
        const aelaId = follower._id.toString();

        return {
          id: aelaId,
          userId: aelaId,
          name: follower.fullName || "User",
          avatar: profile?.avatarUrl || follower.metadata?.avatarUrl || `https://i.pravatar.cc/150?img=${aelaId.slice(-2)}`,
          tagline: profile?.headline || profile?.bio || profile?.tagline || "Learner",
          rating: Math.round(rating * 10) / 10,
          mutuals,
          coinsShared: Math.round(coinsShared),
          totalEarned: Math.round(totalEarned),
        };
      })
    );

    return res.json({
      data: followersWithProfiles.filter(Boolean),
      meta: {
        page: Number(page),
        pageSize: Number(pageSize),
        total,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const getFollowing = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { page = 1, pageSize = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid user ID",
        },
      });
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    const [follows, total] = await Promise.all([
      Follow.find({ follower: userObjectId })
        .populate("following", "fullName email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(pageSize)),
      Follow.countDocuments({ follower: userObjectId }),
    ]);

    // Get additional profile data for each followed user
    const followingWithProfiles = await Promise.all(
      follows.map(async (follow) => {
        const following = follow.following;
        if (!following) return null;

        const profile = await StudentProfile.findOne({ user: following._id });

        // Get total coins earned for this followed user
        let totalEarned = 0;
        try {
          const followingPoints = await StudentPoints.findOne({ student: following._id });
          if (followingPoints && followingPoints.transactions && Array.isArray(followingPoints.transactions)) {
            // Calculate totalEarned from transactions (sum of all earned and bonus transactions)
            totalEarned = followingPoints.transactions
              .filter((txn) => txn.type === "earned" || txn.type === "bonus")
              .reduce((sum, txn) => sum + (txn.amount || 0), 0);
          }
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error("Error calculating total earned for following:", error);
          totalEarned = 0;
        }

        const ratings = await UserRating.find({ ratedUser: following._id });
        const rating =
          ratings.length > 0
            ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
            : 0;

        return {
          id: following._id.toString(),
          userId: following._id.toString(),
          name: following.fullName || "User",
          avatar: profile?.avatarUrl || `https://i.pravatar.cc/150?img=${following._id.toString().slice(-2)}`,
          tagline: profile?.headline || profile?.bio || "Learner",
          rating: Math.round(rating * 10) / 10,
          totalEarned: Math.round(totalEarned),
        };
      })
    );

    return res.json({
      data: followingWithProfiles.filter(Boolean),
      meta: {
        page: Number(page),
        pageSize: Number(pageSize),
        total,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const followUser = async (req, res, next) => {
  try {
    const { userId } = req.auth;
    const { targetUserId } = req.body;

    if (!userId || !targetUserId) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "User ID and target user ID are required",
        },
      });
    }

    if (!mongoose.isValidObjectId(userId) || !mongoose.isValidObjectId(targetUserId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid user ID",
        },
      });
    }

    const followerObjectId = new mongoose.Types.ObjectId(userId);
    const followingObjectId = new mongoose.Types.ObjectId(targetUserId);

    if (!followerObjectId || !followingObjectId) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid user ID",
        },
      });
    }

    // Check if already following
    const existing = await Follow.findOne({
      follower: followerObjectId,
      following: followingObjectId,
    });

    if (existing) {
      return res.status(409).json({
        error: {
          code: "DUPLICATE_FOLLOW",
          message: "Already following this user",
        },
      });
    }

    const follow = await Follow.create({
      follower: followerObjectId,
      following: followingObjectId,
    });

    return res.status(201).json({
      id: follow._id.toString(),
      follower: userId,
      following: targetUserId,
      createdAt: follow.createdAt,
    });
  } catch (error) {
    if (error.status === 400) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: error.message,
        },
      });
    }
    return next(error);
  }
};

export const unfollowUser = async (req, res, next) => {
  try {
    const { userId } = req.auth;
    const { targetUserId } = req.params;

    if (!userId || !targetUserId) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "User ID and target user ID are required",
        },
      });
    }

    if (!mongoose.isValidObjectId(userId) || !mongoose.isValidObjectId(targetUserId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid user ID",
        },
      });
    }

    const followerObjectId = new mongoose.Types.ObjectId(userId);
    const followingObjectId = new mongoose.Types.ObjectId(targetUserId);

    if (!followerObjectId || !followingObjectId) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid user ID",
        },
      });
    }

    const follow = await Follow.findOneAndDelete({
      follower: followerObjectId,
      following: followingObjectId,
    });

    if (!follow) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Follow relationship not found",
        },
      });
    }

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
};

