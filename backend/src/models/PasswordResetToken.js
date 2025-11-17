import mongoose from "mongoose";
import crypto from "crypto";

const passwordResetTokenSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 }, // Auto-delete expired tokens
    },
    used: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Generate a secure random token
passwordResetTokenSchema.statics.generateToken = function () {
  return crypto.randomBytes(32).toString("hex");
};

// Find valid token (not used and not expired)
passwordResetTokenSchema.statics.findValidToken = async function (token) {
  const resetToken = await this.findOne({
    token,
    used: false,
    expiresAt: { $gt: new Date() },
  }).populate("user");

  return resetToken;
};

// Mark token as used
passwordResetTokenSchema.methods.markAsUsed = async function () {
  this.used = true;
  await this.save();
};

const PasswordResetToken = mongoose.model("PasswordResetToken", passwordResetTokenSchema);

export default PasswordResetToken;

