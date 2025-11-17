import mongoose from "mongoose";

const courseReviewSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    review: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    isVerifiedPurchase: {
      type: Boolean,
      default: false, // Set to true if student enrolled in course
    },
    helpfulCount: {
      type: Number,
      default: 0,
    },
    reportedCount: {
      type: Number,
      default: 0,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate reviews from same student for same course
courseReviewSchema.index({ course: 1, student: 1 }, { unique: true });

// Index for efficient queries
courseReviewSchema.index({ course: 1, status: 1, createdAt: -1 });
courseReviewSchema.index({ student: 1, createdAt: -1 });
courseReviewSchema.index({ rating: 1 });

// Virtual for review summary (first 100 chars)
courseReviewSchema.virtual("summary").get(function () {
  if (!this.review) return "";
  return this.review.length > 100
    ? this.review.substring(0, 100) + "..."
    : this.review;
});

const CourseReview = mongoose.model("CourseReview", courseReviewSchema);

export default CourseReview;

