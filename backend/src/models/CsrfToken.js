import mongoose from "mongoose";
import crypto from "crypto";

const csrfTokenSchema = new mongoose.Schema(
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
    accessToken: {
      type: String,
      required: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 86400, // Auto-delete after 24 hours (TTL index)
    },
  },
  {
    timestamps: true,
  }
);

// Generate a secure random token
csrfTokenSchema.statics.generateToken = function () {
  return crypto.randomBytes(32).toString("hex");
};

// Find token by access token
csrfTokenSchema.statics.findByAccessToken = function (accessToken) {
  return this.findOne({ accessToken, expiresAt: { $gt: new Date() } });
};

// Clean up expired tokens (called periodically)
csrfTokenSchema.statics.cleanupExpired = async function () {
  return this.deleteMany({ expiresAt: { $lt: new Date() } });
};

// Index for efficient queries
csrfTokenSchema.index({ accessToken: 1, expiresAt: 1 });
csrfTokenSchema.index({ user: 1, expiresAt: 1 });

const CsrfToken = mongoose.model("CsrfToken", csrfTokenSchema);

export default CsrfToken;

