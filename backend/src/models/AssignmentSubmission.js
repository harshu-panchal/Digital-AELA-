import mongoose from "mongoose";

const assignmentSubmissionSchema = new mongoose.Schema(
  {
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assignment",
      required: true,
    },
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
    submissionType: {
      type: String,
      enum: ["file", "text", "url", "mixed"],
      default: "file",
    },
    submittedFiles: [
      {
        type: {
          type: String,
          enum: ["pdf", "doc", "docx", "image", "zip", "other"],
        },
        url: String,
        name: String,
        size: Number,
      },
    ],
    submittedText: {
      type: String,
      trim: true,
    },
    submittedUrl: {
      type: String,
      trim: true,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["submitted", "graded", "returned", "late"],
      default: "submitted",
    },
    marks: {
      type: Number,
      min: 0,
      default: null,
    },
    maxMarks: {
      type: Number,
      min: 0,
    },
    feedback: {
      type: String,
      trim: true,
    },
    gradedAt: {
      type: Date,
    },
    gradedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    isLate: {
      type: Boolean,
      default: false,
    },
    latePenaltyApplied: {
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

// Prevent duplicate submissions (one submission per student per assignment)
assignmentSubmissionSchema.index({ assignment: 1, student: 1 }, { unique: true });

// Indexes for efficient queries
assignmentSubmissionSchema.index({ assignment: 1, status: 1 });
assignmentSubmissionSchema.index({ student: 1, createdAt: -1 });
assignmentSubmissionSchema.index({ course: 1 });
assignmentSubmissionSchema.index({ gradedBy: 1 });

const AssignmentSubmission = mongoose.model("AssignmentSubmission", assignmentSubmissionSchema);

export default AssignmentSubmission;

