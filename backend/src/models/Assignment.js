import mongoose from "mongoose";

const assignmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    maxMarks: {
      type: Number,
      default: 100,
      min: 0,
    },
    instructions: {
      type: String,
      trim: true,
    },
    attachments: [
      {
        type: {
          type: String,
          enum: ["pdf", "doc", "docx", "image", "other"],
        },
        url: String,
        name: String,
        size: Number,
      },
    ],
    allowLateSubmission: {
      type: Boolean,
      default: false,
    },
    latePenalty: {
      type: Number,
      default: 0,
      min: 0,
      max: 100, // percentage
    },
    status: {
      type: String,
      enum: ["draft", "published", "closed"],
      default: "published",
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

// Indexes for efficient queries
assignmentSchema.index({ course: 1, createdAt: -1 });
assignmentSchema.index({ instructor: 1 });
assignmentSchema.index({ dueDate: 1 });
assignmentSchema.index({ status: 1 });

const Assignment = mongoose.model("Assignment", assignmentSchema);

export default Assignment;

