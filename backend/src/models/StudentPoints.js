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

const StudentPoints = mongoose.model("StudentPoints", studentPointsSchema);

export default StudentPoints;

