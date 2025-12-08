import mongoose from "mongoose";

const videoProgressSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    video: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CourseVideo",
      required: true,
      index: true,
    },
    watchedDuration: {
      type: Number, // in seconds
      default: 0,
    },
    totalDuration: {
      type: Number, // in seconds (from video)
      default: 0,
    },
    progressPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    completedAt: Date,
    lastWatchedAt: {
      type: Date,
      default: Date.now,
    },
    watchCount: {
      type: Number,
      default: 0,
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

// Prevent duplicate progress records
videoProgressSchema.index(
  { student: 1, course: 1, video: 1 },
  { unique: true }
);

// Indexes for efficient queries
videoProgressSchema.index({ student: 1, course: 1 });
videoProgressSchema.index({ student: 1, lastWatchedAt: -1 });
videoProgressSchema.index({ createdAt: -1 }); // For analytics
videoProgressSchema.index({ completedAt: -1 }); // For completed videos analytics

const VideoProgress = mongoose.model("VideoProgress", videoProgressSchema);

export default VideoProgress;

