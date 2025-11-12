import mongoose from "mongoose";

const salarySchema = new mongoose.Schema(
  {
    currency: String,
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
  },
  {
    timestamps: true,
  }
);

const JobPost = mongoose.model("JobPost", jobPostSchema);

export default JobPost;

