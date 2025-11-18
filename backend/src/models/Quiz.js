import mongoose from "mongoose";

const quizSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: String,
    category: {
      type: String,
      enum: ["quiz", "vocabulary", "speaking"],
      required: true,
    },
    difficulty: {
      type: String,
      enum: ["beginner", "intermediate", "advanced", "all-levels"],
      default: "intermediate",
    },
    rewardCoins: {
      type: Number,
      default: 0,
      min: 0,
    },
    duration: {
      type: Number, // in minutes
      default: 0,
    },
    questions: [
      {
        question: String,
        options: [String],
        correctAnswer: Number,
        explanation: String,
      },
    ],
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "published",
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    // Advanced Quiz Settings
    settings: {
      // Time settings
      timeLimit: {
        type: Number, // in seconds, 0 means no time limit
        default: 0,
      },
      timeLimitPerQuestion: {
        type: Number, // in seconds, 0 means no per-question limit
        default: 0,
      },
      allowPause: {
        type: Boolean,
        default: true,
      },
      // Question settings
      randomizeQuestions: {
        type: Boolean,
        default: false,
      },
      randomizeOptions: {
        type: Boolean,
        default: false,
      },
      showQuestionNumbers: {
        type: Boolean,
        default: true,
      },
      allowSkip: {
        type: Boolean,
        default: true,
      },
      allowReview: {
        type: Boolean,
        default: true,
      },
      // Results settings
      showResultsImmediately: {
        type: Boolean,
        default: true,
      },
      showCorrectAnswers: {
        type: Boolean,
        default: true,
      },
      showExplanations: {
        type: Boolean,
        default: true,
      },
      showScore: {
        type: Boolean,
        default: true,
      },
      // Passing settings
      passingScore: {
        type: Number, // percentage (0-100)
        default: 60,
        min: 0,
        max: 100,
      },
      requirePassingScore: {
        type: Boolean,
        default: false,
      },
      // Attempts settings
      maxAttempts: {
        type: Number, // 0 means unlimited
        default: 0,
        min: 0,
      },
      allowMultipleAttempts: {
        type: Boolean,
        default: true,
      },
      // Question bank settings
      useQuestionBank: {
        type: Boolean,
        default: false,
      },
      questionBankIds: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: "QuestionBank",
        default: [],
      },
      questionsPerQuiz: {
        type: Number, // Number of questions to randomly select from bank
        default: 0,
      },
    },
  },
  {
    timestamps: true,
  }
);

const Quiz = mongoose.model("Quiz", quizSchema);

export default Quiz;

