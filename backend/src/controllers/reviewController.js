import CourseReview from "../models/CourseReview.js";
import Course from "../models/Course.js";
import Enrollment from "../models/Enrollment.js";
import mongoose from "mongoose";

/**
 * Submit a review for a course
 * POST /api/v1/courses/:courseId/reviews
 */
export const submitReview = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { userId } = req.auth;
    const { rating, review } = req.body;

    if (!mongoose.isValidObjectId(courseId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid course ID",
        },
      });
    }

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Rating must be between 1 and 5",
        },
      });
    }

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Course not found",
        },
      });
    }

    // Check if user has already reviewed this course
    const existingReview = await CourseReview.findOne({
      course: courseId,
      student: userId,
    });

    if (existingReview) {
      return res.status(400).json({
        error: {
          code: "DUPLICATE_REVIEW",
          message: "You have already reviewed this course",
        },
      });
    }

    // Check if user is enrolled (for verified purchase flag)
    const enrollment = await Enrollment.findOne({
      course: courseId,
      student: userId,
      status: { $in: ["active", "completed"] },
    });

    // Create review
    const courseReview = new CourseReview({
      course: courseId,
      student: userId,
      rating,
      review: review || "",
      isVerifiedPurchase: !!enrollment,
      status: "pending", // Reviews need admin approval
    });

    await courseReview.save();

    // Populate student info for response
    await courseReview.populate("student", "fullName email profileImage");

    // Update course rating aggregation
    await updateCourseRating(courseId);

    return res.status(201).json({
      review: courseReview,
      message: "Review submitted successfully. It will be visible after approval.",
    });
  } catch (error) {
    if (error.code === 11000) {
      // Duplicate key error
      return res.status(400).json({
        error: {
          code: "DUPLICATE_REVIEW",
          message: "You have already reviewed this course",
        },
      });
    }
    return next(error);
  }
};

/**
 * Get reviews for a course
 * GET /api/v1/courses/:courseId/reviews
 */
export const getCourseReviews = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { page = 1, pageSize = 10, rating, status = "approved" } = req.query;

    if (!mongoose.isValidObjectId(courseId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid course ID",
        },
      });
    }

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Course not found",
        },
      });
    }

    // Build query
    const query = { course: courseId };
    
    // Only show approved reviews to non-admins
    if (req.auth?.userRole !== "admin" && req.auth?.userRole !== "super-admin") {
      query.status = "approved";
    } else if (status) {
      query.status = status;
    }

    if (rating) {
      query.rating = parseInt(rating);
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    const limit = parseInt(pageSize);

    // Get reviews
    const reviews = await CourseReview.find(query)
      .populate("student", "fullName email profileImage")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count
    const total = await CourseReview.countDocuments(query);

    // Get rating statistics
    const ratingStats = await CourseReview.aggregate([
      { $match: { course: new mongoose.Types.ObjectId(courseId), status: "approved" } },
      {
        $group: {
          _id: "$rating",
          count: { $sum: 1 },
        },
      },
    ]);

    const ratingDistribution = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    };

    ratingStats.forEach((stat) => {
      ratingDistribution[stat._id] = stat.count;
    });

    return res.status(200).json({
      reviews,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total,
        totalPages: Math.ceil(total / parseInt(pageSize)),
      },
      ratingDistribution,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get a single review
 * GET /api/v1/reviews/:reviewId
 */
export const getReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params;

    if (!mongoose.isValidObjectId(reviewId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid review ID",
        },
      });
    }

    const review = await CourseReview.findById(reviewId)
      .populate("course", "title")
      .populate("student", "fullName email profileImage")
      .lean();

    if (!review) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Review not found",
        },
      });
    }

    // Only show approved reviews to non-admins
    if (
      review.status !== "approved" &&
      req.auth?.userRole !== "admin" &&
      req.auth?.userRole !== "super-admin" &&
      review.student._id.toString() !== req.auth?.userId
    ) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Review not available",
        },
      });
    }

    return res.status(200).json({ review });
  } catch (error) {
    return next(error);
  }
};

/**
 * Update own review
 * PATCH /api/v1/reviews/:reviewId
 */
export const updateReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const { userId } = req.auth;
    const { rating, review } = req.body;

    if (!mongoose.isValidObjectId(reviewId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid review ID",
        },
      });
    }

    const courseReview = await CourseReview.findById(reviewId);

    if (!courseReview) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Review not found",
        },
      });
    }

    // Check if user owns this review
    if (courseReview.student.toString() !== userId) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "You can only update your own reviews",
        },
      });
    }

    // Update fields
    if (rating !== undefined) {
      if (rating < 1 || rating > 5) {
        return res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Rating must be between 1 and 5",
          },
        });
      }
      courseReview.rating = rating;
    }

    if (review !== undefined) {
      courseReview.review = review;
    }

    // Reset status to pending if review is updated
    if (courseReview.status === "approved") {
      courseReview.status = "pending";
    }

    await courseReview.save();
    await courseReview.populate("student", "fullName email profileImage");

    // Update course rating aggregation
    await updateCourseRating(courseReview.course);

    return res.status(200).json({
      review: courseReview,
      message: "Review updated successfully",
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Delete own review
 * DELETE /api/v1/reviews/:reviewId
 */
export const deleteReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const { userId, userRole } = req.auth;

    if (!mongoose.isValidObjectId(reviewId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid review ID",
        },
      });
    }

    const courseReview = await CourseReview.findById(reviewId);

    if (!courseReview) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Review not found",
        },
      });
    }

    // Check if user owns this review or is admin
    if (
      courseReview.student.toString() !== userId &&
      userRole !== "admin" &&
      userRole !== "super-admin"
    ) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "You can only delete your own reviews",
        },
      });
    }

    const courseId = courseReview.course;

    await CourseReview.findByIdAndDelete(reviewId);

    // Update course rating aggregation
    await updateCourseRating(courseId);

    return res.status(200).json({
      message: "Review deleted successfully",
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Moderate review (approve/reject) - Admin only
 * PATCH /api/v1/admin/reviews/:reviewId/moderate
 */
export const moderateReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const { action } = req.body; // "approve" or "reject"

    if (!mongoose.isValidObjectId(reviewId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid review ID",
        },
      });
    }

    if (!["approve", "reject"].includes(action)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Action must be 'approve' or 'reject'",
        },
      });
    }

    const courseReview = await CourseReview.findById(reviewId);

    if (!courseReview) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Review not found",
        },
      });
    }

    courseReview.status = action === "approve" ? "approved" : "rejected";
    await courseReview.save();

    // Update course rating aggregation
    await updateCourseRating(courseReview.course);

    return res.status(200).json({
      review: courseReview,
      message: `Review ${action}d successfully`,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get pending reviews for moderation - Admin only
 * GET /api/v1/admin/reviews/pending
 */
export const getPendingReviews = async (req, res, next) => {
  try {
    const { page = 1, pageSize = 20 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    const limit = parseInt(pageSize);

    const reviews = await CourseReview.find({ status: "pending" })
      .populate("course", "title")
      .populate("student", "fullName email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await CourseReview.countDocuments({ status: "pending" });

    return res.status(200).json({
      reviews,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total,
        totalPages: Math.ceil(total / parseInt(pageSize)),
      },
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Mark review as helpful
 * POST /api/v1/reviews/:reviewId/helpful
 */
export const markHelpful = async (req, res, next) => {
  try {
    const { reviewId } = req.params;

    if (!mongoose.isValidObjectId(reviewId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid review ID",
        },
      });
    }

    const courseReview = await CourseReview.findByIdAndUpdate(
      reviewId,
      { $inc: { helpfulCount: 1 } },
      { new: true }
    );

    if (!courseReview) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Review not found",
        },
      });
    }

    return res.status(200).json({
      helpfulCount: courseReview.helpfulCount,
      message: "Review marked as helpful",
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get user's review for a course
 * GET /api/v1/courses/:courseId/reviews/my-review
 */
export const getMyReview = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { userId } = req.auth;

    if (!mongoose.isValidObjectId(courseId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid course ID",
        },
      });
    }

    const review = await CourseReview.findOne({
      course: courseId,
      student: userId,
    })
      .populate("student", "fullName email profileImage")
      .lean();

    return res.status(200).json({ review });
  } catch (error) {
    return next(error);
  }
};

/**
 * Helper function to update course rating aggregation
 */
async function updateCourseRating(courseId) {
  try {
    const stats = await CourseReview.aggregate([
      {
        $match: {
          course: new mongoose.Types.ObjectId(courseId),
          status: "approved",
        },
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
          ratingCounts: {
            $push: "$rating",
          },
        },
      },
    ]);

    if (stats.length > 0) {
      const { averageRating, totalReviews, ratingCounts } = stats[0];

      // Calculate rating distribution
      const distribution = {
        5: ratingCounts.filter((r) => r === 5).length,
        4: ratingCounts.filter((r) => r === 4).length,
        3: ratingCounts.filter((r) => r === 3).length,
        2: ratingCounts.filter((r) => r === 2).length,
        1: ratingCounts.filter((r) => r === 1).length,
      };

      // Update course metadata with rating info
      await Course.findByIdAndUpdate(courseId, {
        $set: {
          "metadata.averageRating": Math.round(averageRating * 10) / 10,
          "metadata.totalReviews": totalReviews,
          "metadata.ratingDistribution": distribution,
        },
      });
    } else {
      // No approved reviews, reset rating
      await Course.findByIdAndUpdate(courseId, {
        $set: {
          "metadata.averageRating": 0,
          "metadata.totalReviews": 0,
          "metadata.ratingDistribution": { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        },
      });
    }
  } catch (error) {
    console.error("Error updating course rating:", error);
    // Don't throw error, just log it
  }
}

