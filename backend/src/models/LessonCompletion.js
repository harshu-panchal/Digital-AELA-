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

const LessonCompletion = mongoose.model("LessonCompletion", lessonCompletionSchema);

export default LessonCompletion;

