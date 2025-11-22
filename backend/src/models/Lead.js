import mongoose from "mongoose";

const leadSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: false,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: false,
      trim: true,
    },
    company: {
      type: String,
      required: false,
      trim: true,
    },
    source: {
      type: String,
      enum: ["website", "referral", "social_media", "email", "phone", "event", "free_library", "other"],
      default: "website",
    },
    status: {
      type: String,
      enum: ["new", "contacted", "qualified", "proposal", "negotiation", "converted", "lost", "nurturing"],
      default: "new",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    assignedAt: {
      type: Date,
    },
    value: {
      type: Number,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      default: "AED",
      uppercase: true,
    },
    expectedCloseDate: {
      type: Date,
    },
    description: {
      type: String,
      trim: true,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    customFields: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    convertedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    convertedAt: {
      type: Date,
    },
    lastContactedAt: {
      type: Date,
    },
    nextFollowUpAt: {
      type: Date,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
leadSchema.index({ email: 1 });
leadSchema.index({ status: 1 });
leadSchema.index({ assignedTo: 1 });
leadSchema.index({ priority: 1 });
leadSchema.index({ source: 1 });
leadSchema.index({ createdAt: -1 });
leadSchema.index({ nextFollowUpAt: 1 });
leadSchema.index({ status: 1, assignedTo: 1 });

const Lead = mongoose.model("Lead", leadSchema);

export default Lead;

