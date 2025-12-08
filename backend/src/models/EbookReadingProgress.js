import mongoose from "mongoose";

const ebookReadingProgressSchema = new mongoose.Schema(
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
    currentPage: {
      type: Number,
      default: 1,
      min: 1,
    },
    totalPages: {
      type: Number,
      required: true,
    },
    progressPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    lastReadAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: Date,
    isCompleted: {
      type: Boolean,
      default: false,
    },
    readingTime: {
      type: Number, // in minutes
      default: 0,
    },
    bookmarks: [
      {
        page: Number,
        note: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate progress records
ebookReadingProgressSchema.index({ user: 1, ebook: 1 }, { unique: true });

// Indexes for quick lookups
ebookReadingProgressSchema.index({ user: 1, lastReadAt: -1 });
ebookReadingProgressSchema.index({ ebook: 1, isCompleted: 1 });
ebookReadingProgressSchema.index({ createdAt: -1 }); // For analytics
ebookReadingProgressSchema.index({ completedAt: -1 }); // For completed ebooks analytics

const EbookReadingProgress = mongoose.model("EbookReadingProgress", ebookReadingProgressSchema);

export default EbookReadingProgress;

