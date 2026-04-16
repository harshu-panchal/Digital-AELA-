import mongoose from "mongoose";
import EbookResource from "../models/EbookResource.js";
import EbookReadingProgress from "../models/EbookReadingProgress.js";
import EbookRating from "../models/EbookRating.js";

const VISIBLE_EBOOK_REVIEW_QUERY = {
  $or: [{ status: "approved" }, { status: { $exists: false } }],
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const serializeEbookRating = (rating) => {
  if (!rating) return null;

  const user = rating.user || {};
  const ebook = rating.ebook || {};
  const repliedBy = rating.adminReply?.repliedBy || {};

  return {
    id: rating._id?.toString?.() || rating.id,
    rating: rating.rating,
    review: rating.review || "",
    status: rating.status || rating.effectiveStatus || "approved",
    helpfulCount: rating.helpfulCount || 0,
    createdAt: rating.createdAt,
    updatedAt: rating.updatedAt,
    user: {
      id: user._id?.toString?.() || user.id,
      name: user.fullName || user.name || "Anonymous",
      email: user.email || "",
      role: user.role || "",
    },
    ebook: {
      id: ebook._id?.toString?.() || ebook.id,
      title: ebook.title || "Unknown book",
      author: ebook.metadata?.author || "Digital AELA",
      coverImage: ebook.metadata?.coverImage || "",
      category: ebook.categories?.[0] || "General",
      isPublic: ebook.isPublic,
    },
    adminReply: rating.adminReply?.message
      ? {
          message: rating.adminReply.message,
          repliedAt: rating.adminReply.repliedAt,
          repliedBy: {
            id: repliedBy._id?.toString?.() || repliedBy.id,
            name: repliedBy.fullName || repliedBy.name || "Admin",
            email: repliedBy.email || "",
          },
        }
      : null,
  };
};

/**
 * Update ebook reading progress
 * POST /api/v1/resources/ebooks/:ebookId/progress
 */
export const updateReadingProgress = async (req, res, next) => {
  try {
    const { userId } = req.auth;
    const { ebookId } = req.params;
    const { currentPage, totalPages, readingTime } = req.body;

    if (!userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    if (!mongoose.isValidObjectId(ebookId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid ebook ID",
        },
      });
    }

    const ebook = await EbookResource.findById(ebookId);
    if (!ebook) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Ebook not found",
        },
      });
    }

    const totalPagesValue = totalPages || ebook.pages || 100;
    const currentPageValue = currentPage || 1;
    const progressPercentage = Math.min(100, Math.round((currentPageValue / totalPagesValue) * 100));
    const isCompleted = progressPercentage >= 100;

    const progress = await EbookReadingProgress.findOneAndUpdate(
      { user: userId, ebook: ebookId },
      {
        user: userId,
        ebook: ebookId,
        currentPage: currentPageValue,
        totalPages: totalPagesValue,
        progressPercentage,
        lastReadAt: new Date(),
        ...(isCompleted && !progress?.isCompleted && { completedAt: new Date(), isCompleted: true }),
        ...(readingTime && { $inc: { readingTime: readingTime } }),
      },
      { upsert: true, new: true }
    )
      .populate("user", "fullName")
      .populate("ebook", "title")
      .lean();

    return res.json({
      progress: {
        id: progress._id.toString(),
        currentPage: progress.currentPage,
        totalPages: progress.totalPages,
        progressPercentage: progress.progressPercentage,
        isCompleted: progress.isCompleted,
        lastReadAt: progress.lastReadAt,
        readingTime: progress.readingTime,
      },
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get ebook reading progress
 * GET /api/v1/resources/ebooks/:ebookId/progress
 */
export const getReadingProgress = async (req, res, next) => {
  try {
    const { userId } = req.auth;
    const { ebookId } = req.params;

    if (!userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    if (!mongoose.isValidObjectId(ebookId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid ebook ID",
        },
      });
    }

    const progress = await EbookReadingProgress.findOne({
      user: userId,
      ebook: ebookId,
    })
      .populate("ebook", "title pages")
      .lean();

    if (!progress) {
      return res.json({
        progress: null,
        message: "No reading progress found",
      });
    }

    return res.json({
      progress: {
        id: progress._id.toString(),
        currentPage: progress.currentPage,
        totalPages: progress.totalPages,
        progressPercentage: progress.progressPercentage,
        isCompleted: progress.isCompleted,
        lastReadAt: progress.lastReadAt,
        completedAt: progress.completedAt,
        readingTime: progress.readingTime,
        bookmarks: progress.bookmarks || [],
      },
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Add bookmark to ebook
 * POST /api/v1/resources/ebooks/:ebookId/bookmarks
 */
export const addBookmark = async (req, res, next) => {
  try {
    const { userId } = req.auth;
    const { ebookId } = req.params;
    const { page, note } = req.body;

    if (!userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    if (!page || page < 1) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Valid page number is required",
        },
      });
    }

    const progress = await EbookReadingProgress.findOneAndUpdate(
      { user: userId, ebook: ebookId },
      {
        $push: {
          bookmarks: {
            page,
            note: note || "",
            createdAt: new Date(),
          },
        },
      },
      { upsert: true, new: true }
    );

    return res.json({
      message: "Bookmark added successfully",
      bookmark: progress.bookmarks[progress.bookmarks.length - 1],
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Rate an ebook
 * POST /api/v1/resources/ebooks/:ebookId/ratings
 */
export const rateEbook = async (req, res, next) => {
  try {
    const { userId } = req.auth;
    const { ebookId } = req.params;
    const { rating, review } = req.body;

    if (!userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Rating must be between 1 and 5",
        },
      });
    }

    if (!mongoose.isValidObjectId(ebookId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid ebook ID",
        },
      });
    }

    const ebook = await EbookResource.findById(ebookId);
    if (!ebook) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Ebook not found",
        },
      });
    }

    const ebookRating = await EbookRating.findOneAndUpdate(
      { user: userId, ebook: ebookId },
      {
        $set: {
          user: userId,
          ebook: ebookId,
          rating,
          review: review || "",
          status: "approved",
        },
        $unset: {
          adminReply: "",
        },
      },
      { upsert: true, new: true, runValidators: true }
    )
      .populate("user", "fullName")
      .lean();

    // Calculate average rating
    const ratings = await EbookRating.find({
      ebook: ebookId,
      ...VISIBLE_EBOOK_REVIEW_QUERY,
    }).lean();
    const avgRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;

    return res.json({
      message: "Rating submitted successfully",
      rating: {
        id: ebookRating._id.toString(),
        rating: ebookRating.rating,
        review: ebookRating.review,
        user: {
          id: ebookRating.user._id.toString(),
          name: ebookRating.user.fullName,
        },
      },
      averageRating: Math.round(avgRating * 10) / 10,
      totalRatings: ratings.length,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get ebook ratings and reviews
 * GET /api/v1/resources/ebooks/:ebookId/ratings
 */
export const getEbookRatings = async (req, res, next) => {
  try {
    const { ebookId } = req.params;
    const { page = 1, pageSize = 20, rating } = req.query;

    if (!mongoose.isValidObjectId(ebookId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid ebook ID",
        },
      });
    }

    const query = { ebook: ebookId, ...VISIBLE_EBOOK_REVIEW_QUERY };
    if (rating) {
      query.rating = Number(rating);
    }

    const skip = (Number(page) - 1) * Number(pageSize);

    const [ratings, total] = await Promise.all([
      EbookRating.find(query)
        .populate("user", "fullName")
        .populate("adminReply.repliedBy", "fullName")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(pageSize))
        .lean(),
      EbookRating.countDocuments(query),
    ]);

    // Calculate statistics
    const allRatings = await EbookRating.find({
      ebook: ebookId,
      ...VISIBLE_EBOOK_REVIEW_QUERY,
    }).lean();
    const avgRating = allRatings.length > 0 ? allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length : 0;
    const ratingDistribution = [1, 2, 3, 4, 5].map((star) => ({
      star,
      count: allRatings.filter((r) => r.rating === star).length,
    }));

    return res.json({
      ratings: ratings.map((r) => ({
        id: r._id.toString(),
        rating: r.rating,
        review: r.review,
        helpfulCount: r.helpfulCount,
        createdAt: r.createdAt,
        adminReply: r.adminReply?.message
          ? {
              message: r.adminReply.message,
              repliedAt: r.adminReply.repliedAt,
              repliedBy: {
                id: r.adminReply.repliedBy?._id?.toString?.(),
                name: r.adminReply.repliedBy?.fullName || "Digital AELA",
              },
            }
          : null,
        user: {
          id: r.user?._id?.toString?.(),
          name: r.user?.fullName || "Anonymous",
        },
      })),
      statistics: {
        averageRating: Math.round(avgRating * 10) / 10,
        totalRatings: allRatings.length,
        ratingDistribution,
      },
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
 * Get all ebook reviews for admin management
 * GET /api/v1/resources/admin/ebook-ratings
 */
export const getAdminEbookRatings = async (req, res, next) => {
  try {
    const {
      page = 1,
      pageSize = 20,
      status = "all",
      rating,
      replyStatus = "all",
      search = "",
      ebookId,
    } = req.query;

    const pageNumber = Math.max(1, Number(page) || 1);
    const limit = Math.min(100, Math.max(1, Number(pageSize) || 20));
    const skip = (pageNumber - 1) * limit;

    const baseMatch = {};
    if (ebookId) {
      if (!mongoose.isValidObjectId(ebookId)) {
        return res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid ebook ID",
          },
        });
      }
      baseMatch.ebook = new mongoose.Types.ObjectId(ebookId);
    }

    const ratingNumber = Number(rating);
    if (rating && Number.isInteger(ratingNumber) && ratingNumber >= 1 && ratingNumber <= 5) {
      baseMatch.rating = ratingNumber;
    }

    const pipeline = [
      { $match: baseMatch },
      {
        $addFields: {
          effectiveStatus: { $ifNull: ["$status", "approved"] },
          replyMessage: { $ifNull: ["$adminReply.message", ""] },
        },
      },
    ];

    if (status !== "all") {
      pipeline.push({
        $match: {
          effectiveStatus: status === "hidden" ? "hidden" : "approved",
        },
      });
    }

    if (replyStatus === "replied") {
      pipeline.push({ $match: { replyMessage: { $ne: "" } } });
    } else if (replyStatus === "unreplied") {
      pipeline.push({ $match: { replyMessage: "" } });
    }

    pipeline.push(
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "ebookresources",
          localField: "ebook",
          foreignField: "_id",
          as: "ebook",
        },
      },
      { $unwind: { path: "$ebook", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "users",
          localField: "adminReply.repliedBy",
          foreignField: "_id",
          as: "adminReplyUser",
        },
      },
      {
        $unwind: {
          path: "$adminReplyUser",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          "adminReply.repliedBy": "$adminReplyUser",
        },
      },
      { $project: { adminReplyUser: 0 } }
    );

    if (search.trim()) {
      const regex = new RegExp(escapeRegex(search.trim()), "i");
      pipeline.push({
        $match: {
          $or: [
            { review: regex },
            { "adminReply.message": regex },
            { "user.fullName": regex },
            { "user.email": regex },
            { "ebook.title": regex },
            { "ebook.metadata.author": regex },
          ],
        },
      });
    }

    const [result] = await EbookRating.aggregate([
      ...pipeline,
      {
        $facet: {
          reviews: [
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit },
          ],
          totalCount: [{ $count: "total" }],
          statusStats: [
            {
              $group: {
                _id: "$effectiveStatus",
                count: { $sum: 1 },
              },
            },
          ],
          replyStats: [
            {
              $group: {
                _id: null,
                replied: {
                  $sum: {
                    $cond: [{ $ne: ["$replyMessage", ""] }, 1, 0],
                  },
                },
                unreplied: {
                  $sum: {
                    $cond: [{ $eq: ["$replyMessage", ""] }, 1, 0],
                  },
                },
              },
            },
          ],
        },
      },
    ]);

    const total = result?.totalCount?.[0]?.total || 0;
    const statusStats = (result?.statusStats || []).reduce(
      (acc, item) => ({ ...acc, [item._id || "approved"]: item.count }),
      { approved: 0, hidden: 0 }
    );
    const replyStats = result?.replyStats?.[0] || { replied: 0, unreplied: 0 };

    return res.json({
      reviews: (result?.reviews || []).map(serializeEbookRating),
      summary: {
        total,
        approved: statusStats.approved || 0,
        hidden: statusStats.hidden || 0,
        replied: replyStats.replied || 0,
        unreplied: replyStats.unreplied || 0,
      },
      pagination: {
        page: pageNumber,
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
 * Reply to an ebook review as an admin
 * PATCH /api/v1/resources/admin/ebook-ratings/:ratingId/reply
 */
export const replyToEbookRating = async (req, res, next) => {
  try {
    const { ratingId } = req.params;
    const { message } = req.body;
    const { userId } = req.auth;

    if (!mongoose.isValidObjectId(ratingId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid review ID",
        },
      });
    }

    const trimmedMessage = typeof message === "string" ? message.trim() : "";
    if (!trimmedMessage || trimmedMessage.length > 2000) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Reply must be between 1 and 2000 characters",
        },
      });
    }

    const rating = await EbookRating.findByIdAndUpdate(
      ratingId,
      {
        $set: {
          "adminReply.message": trimmedMessage,
          "adminReply.repliedBy": userId,
          "adminReply.repliedAt": new Date(),
        },
      },
      { new: true, runValidators: true }
    )
      .populate("user", "fullName email role")
      .populate("ebook", "title categories isPublic metadata")
      .populate("adminReply.repliedBy", "fullName email")
      .lean();

    if (!rating) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Review not found",
        },
      });
    }

    return res.json({
      message: "Reply saved successfully",
      review: serializeEbookRating(rating),
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Clear an admin reply from an ebook review
 * DELETE /api/v1/resources/admin/ebook-ratings/:ratingId/reply
 */
export const clearEbookRatingReply = async (req, res, next) => {
  try {
    const { ratingId } = req.params;

    if (!mongoose.isValidObjectId(ratingId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid review ID",
        },
      });
    }

    const rating = await EbookRating.findByIdAndUpdate(
      ratingId,
      { $unset: { adminReply: "" } },
      { new: true, runValidators: true }
    )
      .populate("user", "fullName email role")
      .populate("ebook", "title categories isPublic metadata")
      .lean();

    if (!rating) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Review not found",
        },
      });
    }

    return res.json({
      message: "Reply removed successfully",
      review: serializeEbookRating(rating),
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Update ebook review visibility
 * PATCH /api/v1/resources/admin/ebook-ratings/:ratingId/status
 */
export const updateEbookRatingStatus = async (req, res, next) => {
  try {
    const { ratingId } = req.params;
    const { status } = req.body;

    if (!mongoose.isValidObjectId(ratingId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid review ID",
        },
      });
    }

    if (!["approved", "hidden"].includes(status)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Status must be approved or hidden",
        },
      });
    }

    const rating = await EbookRating.findByIdAndUpdate(
      ratingId,
      { $set: { status } },
      { new: true, runValidators: true }
    )
      .populate("user", "fullName email role")
      .populate("ebook", "title categories isPublic metadata")
      .populate("adminReply.repliedBy", "fullName email")
      .lean();

    if (!rating) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Review not found",
        },
      });
    }

    return res.json({
      message: `Review ${status === "hidden" ? "hidden" : "published"} successfully`,
      review: serializeEbookRating(rating),
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get ebook analytics (for teachers/admins)
 * GET /api/v1/resources/ebooks/:ebookId/analytics
 */
export const getEbookAnalytics = async (req, res, next) => {
  try {
    const { userId, userRole } = req.auth;
    const { ebookId } = req.params;

    if (!userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    if (!mongoose.isValidObjectId(ebookId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid ebook ID",
        },
      });
    }

    const ebook = await EbookResource.findById(ebookId).lean();

    if (!ebook) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Ebook not found",
        },
      });
    }

    // Check if user is the owner or admin
    const isOwner = ebook.metadata?.uploadedBy === userId || ebook.metadata?.uploadedBy === userId.toString();
    if (!isOwner && userRole !== "admin" && userRole !== "super-admin") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "You don't have permission to view analytics for this ebook",
        },
      });
    }

    // Get reading progress statistics
    const [progressStats, ratings, downloads] = await Promise.all([
      EbookReadingProgress.aggregate([
        { $match: { ebook: new mongoose.Types.ObjectId(ebookId) } },
        {
          $group: {
            _id: null,
            totalReaders: { $sum: 1 },
            completedReaders: { $sum: { $cond: ["$isCompleted", 1, 0] } },
            avgProgress: { $avg: "$progressPercentage" },
            totalReadingTime: { $sum: "$readingTime" },
          },
        },
      ]),
      EbookRating.find({ ebook: ebookId }).lean(),
      EbookResource.findById(ebookId).select("downloads").lean(),
    ]);

    const stats = progressStats[0] || {
      totalReaders: 0,
      completedReaders: 0,
      avgProgress: 0,
      totalReadingTime: 0,
    };

    const avgRating = ratings.length > 0 ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length : 0;

    return res.json({
      ebook: {
        id: ebook._id.toString(),
        title: ebook.title,
      },
      analytics: {
        totalReaders: stats.totalReaders,
        completedReaders: stats.completedReaders,
        completionRate: stats.totalReaders > 0 ? Math.round((stats.completedReaders / stats.totalReaders) * 100 * 100) / 100 : 0,
        averageProgress: Math.round(stats.avgProgress * 100) / 100,
        totalReadingTime: Math.round(stats.totalReadingTime),
        downloads: downloads?.downloads || ebook.metadata?.downloads || 0,
        averageRating: Math.round(avgRating * 10) / 10,
        totalRatings: ratings.length,
      },
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Download ebook (track download)
 * GET /api/v1/resources/ebooks/:ebookId/download
 */
export const downloadEbook = async (req, res, next) => {
  try {
    const { ebookId } = req.params;

    if (!mongoose.isValidObjectId(ebookId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid ebook ID",
        },
      });
    }

    const ebook = await EbookResource.findById(ebookId);

    if (!ebook) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Ebook not found",
        },
      });
    }

    if (!ebook.isPublic) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Ebook not accessible",
        },
      });
    }

    // Increment download count
    ebook.downloads = (ebook.downloads || 0) + 1;
    if (ebook.metadata) {
      ebook.metadata.downloads = (ebook.metadata.downloads || 0) + 1;
    } else {
      ebook.metadata = { downloads: 1 };
    }
    await ebook.save();

    // Return download URL
    return res.json({
      downloadUrl: ebook.downloadUrl,
      message: "Download link generated",
    });
  } catch (error) {
    return next(error);
  }
};

