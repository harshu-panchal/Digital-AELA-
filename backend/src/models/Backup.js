import mongoose from "mongoose";

const backupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["full", "database", "files", "custom"],
      default: "full",
    },
    status: {
      type: String,
      enum: ["pending", "in_progress", "completed", "failed", "expired"],
      default: "pending",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    filePath: {
      type: String,
      default: null,
    },
    fileName: {
      type: String,
      default: null,
    },
    fileSize: {
      type: Number, // in bytes
      default: 0,
    },
    metadata: {
      collections: [String], // For custom backups
      database: String,
      version: String,
      timestamp: Date,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    error: {
      message: String,
      stack: String,
    },
    retentionDays: {
      type: Number,
      default: 30, // Default 30 days retention
    },
    isScheduled: {
      type: Boolean,
      default: false,
    },
    scheduleId: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
backupSchema.index({ createdBy: 1, createdAt: -1 });
backupSchema.index({ status: 1, createdAt: -1 });
backupSchema.index({ type: 1 });
backupSchema.index({ expiresAt: 1 });
backupSchema.index({ isScheduled: 1 });

// Method to mark backup as completed
backupSchema.methods.markCompleted = function (filePath, fileName, fileSize) {
  this.status = "completed";
  this.filePath = filePath;
  this.fileName = fileName;
  this.fileSize = fileSize;
  this.completedAt = new Date();
  if (this.retentionDays) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + this.retentionDays);
    this.expiresAt = expiryDate;
  }
  return this.save();
};

// Method to mark backup as failed
backupSchema.methods.markFailed = function (error) {
  this.status = "failed";
  this.completedAt = new Date();
  this.error = {
    message: error.message || String(error),
    stack: error.stack || null,
  };
  return this.save();
};

const Backup = mongoose.model("Backup", backupSchema);

export default Backup;

