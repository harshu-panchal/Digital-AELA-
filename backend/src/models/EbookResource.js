import mongoose from "mongoose";

const ebookResourceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    pages: Number,
    downloadUrl: {
      type: String,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      default: null,
    },
    categories: [String],
    publishedAt: {
      type: Date,
      default: Date.now,
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "approved",
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    rejectionReason: {
      type: String,
      trim: true,
      default: null,
    },
    downloads: {
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

// Indexes for efficient queries
ebookResourceSchema.index({ isPublic: 1, createdAt: -1 }); // For public listings
ebookResourceSchema.index({ branchId: 1, isPublic: 1, approvalStatus: 1 });
ebookResourceSchema.index({ createdBy: 1, createdAt: -1 });
ebookResourceSchema.index({ "metadata.isFeatured": 1, createdAt: -1 }); // For featured books
ebookResourceSchema.index({ createdAt: -1 }); // For analytics
ebookResourceSchema.index({ categories: 1, isPublic: 1 }); // For category filtering

const EbookResource = mongoose.model("EbookResource", ebookResourceSchema);

export default EbookResource;

