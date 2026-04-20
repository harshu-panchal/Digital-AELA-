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
    passwordHistory: {
      type: [String],
      default: [],
      select: false,
    },
    lastPasswordChange: {
      type: Date,
      default: null,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: [
        "admin",
        "branch_owner",
        "student",
        "teacher",
        "recruiter",
        "influencer",
        "freelancer",
        "super-admin",
      ],
      default: "student",
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      default: null,
    },
    branchJoinType: {
      type: String,
      enum: ["independent", "branch"],
      default: "independent",
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
userSchema.index({ role: 1, branchId: 1, approvalStatus: 1 });
userSchema.index({ branchId: 1, role: 1, isActive: 1 });
userSchema.index({ branchJoinType: 1, approvalStatus: 1 });
userSchema.index({ createdAt: -1 }); // For sorting by date
userSchema.index({ role: 1, createdAt: -1 }); // Compound for analytics

const User = mongoose.model("User", userSchema);

export default User;
