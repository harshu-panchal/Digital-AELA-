import mongoose from "mongoose";

const rewardSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: ["Cash", "Discounts", "Services", "Certificates", "Gifts", "Other"],
      default: "Other",
    },
    cost: {
      type: Number,
      required: true,
      min: 1,
    },
    imageUrl: {
      type: String,
      default: null,
    },
    icon: {
      type: String,
      default: null, // Emoji or icon identifier
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    limitPerUser: {
      type: Number,
      default: null, // null means unlimited
      min: 1,
    },
    globalLimit: {
      type: Number,
      default: null, // null means unlimited
      min: 1,
    },
    currentRedemptions: {
      type: Number,
      default: 0,
      min: 0,
    },
    expirationDate: {
      type: Date,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
rewardSchema.index({ category: 1, isActive: 1 });
rewardSchema.index({ isActive: 1, createdAt: -1 });

const Reward = mongoose.model("Reward", rewardSchema);

export default Reward;

