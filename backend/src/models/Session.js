import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    ipAddress: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
    device: {
      type: String,
      enum: ["desktop", "mobile", "tablet", "unknown"],
      default: "unknown",
    },
    browser: {
      type: String,
      default: null,
    },
    os: {
      type: String,
      default: null,
    },
    location: {
      country: String,
      city: String,
      region: String,
    },
    loginAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    lastActivity: {
      type: Date,
      default: Date.now,
      index: true,
    },
    logoutAt: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    duration: {
      type: Number, // in minutes
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

// Indexes for efficient queries
sessionSchema.index({ user: 1, isActive: 1 });
sessionSchema.index({ isActive: 1, lastActivity: -1 });
sessionSchema.index({ loginAt: -1 });
// token index is already created by unique: true in field definition

// Method to update last activity
sessionSchema.methods.updateActivity = function () {
  this.lastActivity = new Date();
  if (this.loginAt) {
    this.duration = Math.floor((this.lastActivity - this.loginAt) / (1000 * 60));
  }
  return this.save();
};

// Method to end session
sessionSchema.methods.endSession = function () {
  this.isActive = false;
  this.logoutAt = new Date();
  if (this.loginAt) {
    this.duration = Math.floor((this.logoutAt - this.loginAt) / (1000 * 60));
  }
  return this.save();
};

const Session = mongoose.model("Session", sessionSchema);

export default Session;

