import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    targetAudience: {
      type: String,
      enum: ["all_students", "all_teachers", "specific_course", "specific_courses", "enrolled_students"],
      default: "all_students",
    },
    targetCourses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
      },
    ],
    targetUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    priority: {
      type: String,
      enum: ["low", "normal", "high", "urgent"],
      default: "normal",
    },
    status: {
      type: String,
      enum: ["draft", "scheduled", "published", "archived"],
      default: "draft",
    },
    scheduledAt: {
      type: Date,
    },
    publishedAt: {
      type: Date,
    },
    expiresAt: {
      type: Date,
    },
    attachments: [
      {
        url: String,
        filename: String,
        mimetype: String,
        size: Number,
      },
    ],
    readBy: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        readAt: {
          type: Date,
          default: Date.now,
        },
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
announcementSchema.index({ createdBy: 1, createdAt: -1 });
announcementSchema.index({ status: 1, publishedAt: -1 });
announcementSchema.index({ targetAudience: 1 });
announcementSchema.index({ targetCourses: 1 });
announcementSchema.index({ scheduledAt: 1 });
announcementSchema.index({ expiresAt: 1 });
announcementSchema.index({ createdAt: -1 });

const Announcement = mongoose.model("Announcement", announcementSchema);

export default Announcement;

