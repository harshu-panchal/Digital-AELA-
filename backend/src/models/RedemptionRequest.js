import mongoose from "mongoose";

const redemptionRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    reward: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Reward",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    coinsRequested: {
      type: Number,
      required: true,
      min: 1,
    },
    coinsReserved: {
      type: Number,
      default: 0,
      min: 0,
    },
    adminNotes: {
      type: String,
      trim: true,
      default: "",
    },
    rejectionReason: {
      type: String,
      trim: true,
      default: "",
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
    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    rejectedAt: {
      type: Date,
      default: null,
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

// Index for efficient queries
redemptionRequestSchema.index({ status: 1, createdAt: -1 });
redemptionRequestSchema.index({ user: 1, status: 1 });
redemptionRequestSchema.index({ reward: 1, status: 1 });

const RedemptionRequest = mongoose.model("RedemptionRequest", redemptionRequestSchema);

export default RedemptionRequest;

