import mongoose from "mongoose";

const followUpSchema = new mongoose.Schema(
  {
    lead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
      required: true,
    },
    type: {
      type: String,
      enum: ["call", "email", "meeting", "note", "task", "other"],
      default: "note",
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    scheduledAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["scheduled", "completed", "cancelled", "overdue"],
      default: "scheduled",
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
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    outcome: {
      type: String,
      trim: true,
    },
    nextAction: {
      type: String,
      trim: true,
    },
    nextFollowUpDate: {
      type: Date,
    },
    attachments: [
      {
        filename: String,
        url: String,
        filetype: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Auto-update status based on scheduledAt
followUpSchema.pre("save", function (next) {
  if (this.scheduledAt && !this.completedAt && !this.cancelled) {
    const now = new Date();
    if (this.scheduledAt < now && this.status === "scheduled") {
      this.status = "overdue";
    }
  }
  next();
});

followUpSchema.index({ lead: 1, createdAt: -1 });
followUpSchema.index({ assignedTo: 1, status: 1 });
followUpSchema.index({ scheduledAt: 1 });
followUpSchema.index({ status: 1 });
followUpSchema.index({ nextFollowUpDate: 1 });

const FollowUp = mongoose.model("FollowUp", followUpSchema);

export default FollowUp;

