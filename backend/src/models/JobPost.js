import mongoose from "mongoose";

const salarySchema = new mongoose.Schema(
  {
    currency: {
      type: String,
      default: "INR",
    },
    range: String,
  },
  { _id: false }
);

const jobPostSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    company: {
      type: String,
      required: true,
      trim: true,
    },
    employmentType: {
      type: String,
      enum: ["full-time", "part-time", "contract", "internship"],
      default: "full-time",
    },
    location: {
      type: String,
      trim: true,
    },
    isRemote: {
      type: Boolean,
      default: false,
    },
    salary: salarySchema,
    experience: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    cultureHighlights: [String],
    tags: [String],
    applyCTA: {
      type: String,
    },
    stats: {
      views: {
        type: Number,
        default: 0,
      },
      saves: {
        type: Number,
        default: 0,
      },
      applications: {
        type: Number,
        default: 0,
      },
    },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "published",
    },
    publishedAt: {
      type: Date,
    },
    expirationDate: {
      type: Date,
    },
    expiresInDays: {
      type: Number,
      default: 30, // Default expiration period in days
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
jobPostSchema.index({ status: 1, expirationDate: 1, publishedAt: -1 });
jobPostSchema.index({ status: 1, createdAt: -1 }); // For job listings
jobPostSchema.index({ owner: 1, status: 1 }); // For recruiter listings (owner is recruiter)
jobPostSchema.index({ expirationDate: 1 }); // For expiration queries
// Note: Text index for full-text search must be created via script
// Run: npm run create-job-index
// This creates: { title: "text", description: "text", company: "text", location: "text" }

const JobPost = mongoose.model("JobPost", jobPostSchema);

export default JobPost;

