import mongoose from "mongoose";
import EbookResource from "../models/EbookResource.js";
import EbookReadingProgress from "../models/EbookReadingProgress.js";
import EbookRating from "../models/EbookRating.js";
import User from "../models/User.js";

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
        user: userId,
        ebook: ebookId,
        rating,
        review: review || "",
      },
      { upsert: true, new: true }
    )
      .populate("user", "fullName")
      .lean();

    // Calculate average rating
    const ratings = await EbookRating.find({ ebook: ebookId }).lean();
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

    const query = { ebook: ebookId };
    if (rating) {
      query.rating = Number(rating);
    }

    const skip = (Number(page) - 1) * Number(pageSize);

    const [ratings, total] = await Promise.all([
      EbookRating.find(query)
        .populate("user", "fullName")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(pageSize))
        .lean(),
      EbookRating.countDocuments(query),
    ]);

    // Calculate statistics
    const allRatings = await EbookRating.find({ ebook: ebookId }).lean();
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
        user: {
          id: r.user._id.toString(),
          name: r.user.fullName,
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

