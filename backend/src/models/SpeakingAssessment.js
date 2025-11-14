import mongoose from "mongoose";

const speakingAssessmentSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 10,
    },
    assessmentType: {
      type: String,
      enum: ["practice", "quiz", "mock_test", "live_session"],
      default: "practice",
    },
    feedback: String,
    assessedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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

// Index for quick lookups of latest score
speakingAssessmentSchema.index({ student: 1, createdAt: -1 });

const SpeakingAssessment = mongoose.model("SpeakingAssessment", speakingAssessmentSchema);

export default SpeakingAssessment;

