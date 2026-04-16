import mongoose from "mongoose";

const ebookRatingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    ebook: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EbookResource",
      required: true,
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
      enum: ["approved", "hidden"],
      default: "approved",
      index: true,
    },
    adminReply: {
      message: {
        type: String,
        trim: true,
        maxlength: 2000,
      },
      repliedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      repliedAt: Date,
    },
    helpfulCount: {
      type: Number,
      default: 0,
      min: 0,
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

// Prevent duplicate ratings
ebookRatingSchema.index({ user: 1, ebook: 1 }, { unique: true });

// Index for quick lookups
ebookRatingSchema.index({ ebook: 1, rating: -1, createdAt: -1 });
ebookRatingSchema.index({ user: 1, createdAt: -1 });
ebookRatingSchema.index({ status: 1, createdAt: -1 });

const EbookRating = mongoose.model("EbookRating", ebookRatingSchema);

export default EbookRating;

