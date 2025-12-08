import mongoose from "mongoose";

const quizAttemptSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    quiz: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: false, // Optional - quizzes may not exist in DB yet (legacy quizzes)
    },
    quizId: {
      type: String, // For quizzes that don't exist in DB yet (legacy)
    },
    quizName: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ["quiz", "vocabulary", "speaking"],
    },
    score: {
      type: Number,
      min: 0,
      max: 100,
    },
    totalQuestions: {
      type: Number,
      default: 0,
    },
    correctAnswers: {
      type: Number,
      default: 0,
    },
    timeSpent: {
      type: Number, // in seconds
      default: 0,
    },
    coinsEarned: {
      type: Number,
      default: 0,
      min: 0,
    },
    completedAt: {
      type: Date,
      default: Date.now,
    },
    answers: [
      {
        questionIndex: Number,
        selectedAnswer: Number,
        isCorrect: Boolean,
        timeSpent: Number,
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

// Indexes for quick lookups
quizAttemptSchema.index({ student: 1, completedAt: -1 });
quizAttemptSchema.index({ student: 1, quiz: 1 });
quizAttemptSchema.index({ createdAt: -1 }); // For analytics
quizAttemptSchema.index({ quiz: 1, completedAt: -1 }); // For quiz analytics

const QuizAttempt = mongoose.model("QuizAttempt", quizAttemptSchema);

export default QuizAttempt;

