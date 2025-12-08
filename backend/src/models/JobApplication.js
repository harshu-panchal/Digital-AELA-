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
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate applications
jobApplicationSchema.index({ job: 1, candidateId: 1 }, { unique: true });

// Additional indexes for efficient queries
jobApplicationSchema.index({ job: 1, currentStage: 1 }); // For job applications by stage
jobApplicationSchema.index({ candidateId: 1, currentStage: 1 }); // For applicant applications
jobApplicationSchema.index({ createdAt: -1 }); // For sorting

const JobApplication = mongoose.model("JobApplication", jobApplicationSchema);

export default JobApplication;

