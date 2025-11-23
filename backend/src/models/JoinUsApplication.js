import mongoose from "mongoose";

const attachmentSchema = new mongoose.Schema(
  {
    fieldName: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    publicId: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const joinUsApplicationSchema = new mongoose.Schema(
  {
    applicationType: {
      type: String,
      enum: ["teacher", "influencer"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    formData: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    attachments: {
      type: [attachmentSchema],
      default: [],
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    reviewedAt: {
      type: Date,
      required: false,
    },
    rejectionReason: {
      type: String,
      required: false,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
joinUsApplicationSchema.index({ status: 1 });
joinUsApplicationSchema.index({ applicationType: 1 });
joinUsApplicationSchema.index({ status: 1, applicationType: 1 });
joinUsApplicationSchema.index({ submittedAt: -1 });

const JoinUsApplication = mongoose.model(
  "JoinUsApplication",
  joinUsApplicationSchema
);

export default JoinUsApplication;

