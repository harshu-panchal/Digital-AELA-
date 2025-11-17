import mongoose from "mongoose";

const blogReactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    blog: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RecruiterBlog",
      required: true,
    },
    reactionType: {
      type: String,
      enum: ["like", "love", "insightful", "helpful"],
      default: "like",
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate reactions
blogReactionSchema.index({ user: 1, blog: 1 }, { unique: true });

// Index for quick lookups
blogReactionSchema.index({ blog: 1, reactionType: 1 });
blogReactionSchema.index({ user: 1, createdAt: -1 });

const BlogReaction = mongoose.model("BlogReaction", blogReactionSchema);

export default BlogReaction;

