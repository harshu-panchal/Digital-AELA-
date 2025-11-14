import mongoose from "mongoose";

const followSchema = new mongoose.Schema(
  {
    follower: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    following: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate follows
followSchema.index({ follower: 1, following: 1 }, { unique: true });

// Prevent self-follow
followSchema.pre("save", function (next) {
  if (this.follower.toString() === this.following.toString()) {
    const error = new Error("Cannot follow yourself");
    error.status = 400;
    return next(error);
  }
  next();
});

const Follow = mongoose.model("Follow", followSchema);

export default Follow;

