import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: [
        "student",
        "teacher",
        "recruiter",
        "influencer",
        "freelancer",
        "super-admin",
      ],
      default: "student",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerifiedAt: {
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

// Indexes for efficient queries
// Note: email index is automatically created by unique: true, so we don't need to add it again
userSchema.index({ role: 1, isActive: 1 }); // For role-based queries
userSchema.index({ createdAt: -1 }); // For sorting by date
userSchema.index({ role: 1, createdAt: -1 }); // Compound for analytics

const User = mongoose.model("User", userSchema);

export default User;

