import mongoose from "mongoose";

const questionBankSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },
    options: {
      type: [String],
      required: true,
      validate: {
        validator: function (v) {
          return v && v.length >= 2;
        },
        message: "At least 2 options are required",
      },
    },
    correctAnswer: {
      type: Number,
      required: true,
      min: 0,
    },
    explanation: {
      type: String,
      default: "",
    },
    category: {
      type: String,
      enum: ["quiz", "vocabulary", "speaking"],
      default: "quiz",
    },
    difficulty: {
      type: String,
      enum: ["beginner", "intermediate", "advanced", "all-levels"],
      default: "intermediate",
    },
    tags: {
      type: [String],
      default: [],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isPublic: {
      type: Boolean,
      default: false, // Only creator can use by default
    },
    usageCount: {
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

// Index for efficient searching
questionBankSchema.index({ createdBy: 1, category: 1, difficulty: 1 });
questionBankSchema.index({ tags: 1 });
questionBankSchema.index({ isPublic: 1 });

const QuestionBank = mongoose.model("QuestionBank", questionBankSchema);

export default QuestionBank;

