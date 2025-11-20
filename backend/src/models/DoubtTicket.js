import mongoose from "mongoose";

const doubtTicketSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: false, // Optional - doubts may be general
    },
    lesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
      required: false, // Optional - doubts may be about course in general
    },
    assignedTeacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // Auto-assigned or manually assigned
    },
    status: {
      type: String,
      enum: ["open", "in_progress", "resolved", "closed"],
      default: "open",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    category: {
      type: String,
      enum: [
        "course_content",
        "assignment",
        "quiz",
        "technical",
        "payment",
        "certificate",
        "general",
        "other",
      ],
      default: "general",
    },
    attachments: [
      {
        url: String,
        filename: String,
        mimetype: String,
        size: Number,
      },
    ],
    replies: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        message: {
          type: String,
          required: true,
        },
        attachments: [
          {
            url: String,
            filename: String,
            mimetype: String,
            size: Number,
          },
        ],
        createdAt: {
          type: Date,
          default: Date.now,
        },
        isTeacherReply: {
          type: Boolean,
          default: false,
        },
      },
    ],
    resolvedAt: {
      type: Date,
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    closedAt: {
      type: Date,
    },
    closedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
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
doubtTicketSchema.index({ student: 1, createdAt: -1 });
doubtTicketSchema.index({ assignedTeacher: 1, status: 1 });
doubtTicketSchema.index({ course: 1 });
doubtTicketSchema.index({ status: 1 });
doubtTicketSchema.index({ priority: 1 });
doubtTicketSchema.index({ category: 1 });
doubtTicketSchema.index({ createdAt: -1 });

const DoubtTicket = mongoose.model("DoubtTicket", doubtTicketSchema);

export default DoubtTicket;

