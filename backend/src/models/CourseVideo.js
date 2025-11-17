import mongoose from "mongoose";

const courseVideoSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    videoUrl: {
      type: String,
      required: true,
    },
    thumbnailUrl: {
      type: String,
    },
    duration: {
      type: Number, // in seconds
      default: 0,
    },
    order: {
      type: Number,
      default: 0, // For ordering videos within a course
    },
    isPreview: {
      type: Boolean,
      default: false, // If true, can be viewed without enrollment
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

// Index for efficient queries
courseVideoSchema.index({ course: 1, order: 1 });

const CourseVideo = mongoose.model("CourseVideo", courseVideoSchema);

export default CourseVideo;

