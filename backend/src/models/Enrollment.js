import mongoose from "mongoose";

const enrollmentSchema = new mongoose.Schema(
  {
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
    status: {
      type: String,
      enum: ["active", "completed", "dropped", "paused"],
      default: "active",
    },
    enrolledAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: Date,
    lastAccessedAt: Date,
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate enrollments
enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

// Additional indexes for efficient queries
enrollmentSchema.index({ student: 1, createdAt: -1 }); // For student enrollments
enrollmentSchema.index({ course: 1, createdAt: -1 }); // For course enrollments
enrollmentSchema.index({ createdAt: -1 }); // For analytics
enrollmentSchema.index({ student: 1, status: 1 }); // For active enrollments lookup

const Enrollment = mongoose.model("Enrollment", enrollmentSchema);

export default Enrollment;

