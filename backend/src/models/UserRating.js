import mongoose from "mongoose";

const userRatingSchema = new mongoose.Schema(
  {
    ratedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    ratedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    tags: [String], // e.g., ["helpful", "encouraging", "knowledgeable"]
    context: {
      type: String,
      enum: ["mentor", "peer", "debate", "coaching", "general"],
      default: "general",
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

// Index for quick lookups
userRatingSchema.index({ ratedUser: 1, createdAt: -1 });
userRatingSchema.index({ ratedBy: 1, ratedUser: 1 }, { unique: true }); // One rating per user pair

const UserRating = mongoose.model("UserRating", userRatingSchema);

export default UserRating;

