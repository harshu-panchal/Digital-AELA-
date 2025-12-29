import mongoose from "mongoose";

const moduleFileSchema = new mongoose.Schema(
  {
    fileUrl: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    fileType: {
      type: String, // MIME type
      required: true,
    },
    fileSize: {
      type: Number, // in bytes
      required: true,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { _id: false }
);

const courseModuleSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    files: {
      type: [moduleFileSchema],
      default: [],
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

// Index for efficient queries (chronological ordering)
courseModuleSchema.index({ course: 1, createdAt: 1 });

const CourseModule = mongoose.model("CourseModule", courseModuleSchema);

export default CourseModule;

