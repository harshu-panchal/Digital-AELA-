import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    category: {
      type: String,
      trim: true,
    },
    duration: {
      type: Number, // in hours
      default: 0,
    },
    price: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: "AED",
    },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "published",
    },
    thumbnailUrl: String,
    brochureUrl: String,
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
courseSchema.index({ status: 1, "metadata.isPremium": 1 }); // For home page queries
courseSchema.index({ instructor: 1, status: 1 }); // For teacher course listings
courseSchema.index({ category: 1, status: 1 }); // For category filtering
courseSchema.index({ createdAt: -1 }); // For sorting
courseSchema.index({ price: 1, status: 1 }); // For price-based filtering and sorting

const Course = mongoose.model("Course", courseSchema);

export default Course;

