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
    slug: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true, // Allows null/undefined values to exist without uniqueness constraint issues
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
      default: "INR",
    },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "published",
    },
    thumbnailUrl: String,
    brochureUrl: String,
    introVideoUrl: String,
    isPremium: {
      type: Boolean,
      default: false,
    },
    modules: [
      {
        title: {
          type: String,
          required: true,
          trim: true,
        },
        content: {
          type: String,
          trim: true,
        },
      },
    ],
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
courseSchema.index({ createdAt: -1 }); // For sorting
courseSchema.index({ price: 1, status: 1 }); // For price-based filtering and sorting
courseSchema.index({ slug: 1 }, { unique: true, sparse: true }); // For slug-based lookups

const Course = mongoose.model("Course", courseSchema);

export default Course;

