import mongoose from "mongoose";

const lessonCompletionSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    lessonId: {
      type: String,
      required: true,
    },
    lessonTitle: String,
    duration: {
      type: Number, // in minutes
      default: 0,
    },
    completedAt: {
      type: Date,
      default: Date.now,
    },
    score: Number,
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate completions
lessonCompletionSchema.index({ student: 1, course: 1, lessonId: 1 }, { unique: true });

// Additional indexes for efficient queries
lessonCompletionSchema.index({ student: 1, completedAt: -1 }); // For student completions
lessonCompletionSchema.index({ course: 1, completedAt: -1 }); // For course completions
lessonCompletionSchema.index({ completedAt: -1 }); // For analytics

const LessonCompletion = mongoose.model("LessonCompletion", lessonCompletionSchema);

export default LessonCompletion;

