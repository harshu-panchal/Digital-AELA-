import mongoose from "mongoose";

const studentPointsSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    totalCoins: {
      type: Number,
      default: 0,
      min: 0,
    },
    redeemedCoins: {
      type: Number,
      default: 0,
      min: 0,
    },
    pendingCoins: {
      type: Number,
      default: 0,
      min: 0,
    },
    streak: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastActivityDate: Date,
    lastDailyBonusClaimed: Date,
    leaderboardPosition: {
      type: Number,
      default: 0,
    },
    badges: [String],
    transactions: [
      {
        type: {
          type: String,
          enum: ["earned", "redeemed", "bonus", "penalty", "sent", "received"],
        },
        amount: Number,
        reason: String,
        source: String, // e.g., "quiz", "lesson", "daily_streak"
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes for leaderboard performance
studentPointsSchema.index({ totalCoins: -1 }); // For coins leaderboard sorting
studentPointsSchema.index({ streak: -1 }); // For streak leaderboard sorting
studentPointsSchema.index({ student: 1 }); // For quick user lookup

const StudentPoints = mongoose.model("StudentPoints", studentPointsSchema);

export default StudentPoints;

