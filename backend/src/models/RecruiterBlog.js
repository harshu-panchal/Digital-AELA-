import mongoose from "mongoose";

const recruiterBlogSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    excerpt: {
      type: String,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    coverImage: String,
    tags: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ["draft", "scheduled", "published"],
      default: "draft",
    },
    scheduledAt: Date,
    publishedAt: Date,
  },
  {
    timestamps: true,
  }
);

const RecruiterBlog = mongoose.model("RecruiterBlog", recruiterBlogSchema);

export default RecruiterBlog;

