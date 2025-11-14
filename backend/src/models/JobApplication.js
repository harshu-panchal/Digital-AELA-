import mongoose from "mongoose";

const jobApplicationSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JobPost",
      required: true,
    },
    candidateId: {
      type: String,
      required: true,
    },
    candidateName: {
      type: String,
      required: true,
    },
    candidateHeadline: String,
    profileUrl: String,
    resumeUrl: String,
    portfolioUrl: String,
    currentStage: {
      type: String,
      enum: [
        "screening",
        "assessment",
        "interview",
        "offer",
        "hired",
        "rejected",
      ],
      default: "screening",
    },
    notes: String,
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate applications
jobApplicationSchema.index({ job: 1, candidateId: 1 }, { unique: true });

const JobApplication = mongoose.model("JobApplication", jobApplicationSchema);

export default JobApplication;

