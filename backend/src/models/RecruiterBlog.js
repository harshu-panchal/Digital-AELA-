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
      enum: ["draft", "pending", "scheduled", "published", "rejected"],
      default: "draft",
    },
    scheduledAt: Date,
    publishedAt: Date,
    rejectedAt: Date,
    rejectionReason: {
      type: String,
      trim: true,
    },
    likes: {
      type: Number,
      default: 0,
      min: 0,
    },
    views: {
      type: Number,
      default: 0,
      min: 0,
    },
    category: {
      type: String,
      trim: true,
    },
    comments: [
      {
        author: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        message: {
          type: String,
          required: true,
          trim: true,
        },
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

// Indexes for efficient queries
recruiterBlogSchema.index({ status: 1, publishedAt: -1 }); // For published blogs
recruiterBlogSchema.index({ author: 1, status: 1 }); // For author's blogs
recruiterBlogSchema.index({ createdAt: -1 }); // For analytics

const RecruiterBlog = mongoose.model("RecruiterBlog", recruiterBlogSchema);

export default RecruiterBlog;
