import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: ["general", "email", "payment", "features", "maintenance", "social", "seo"],
      default: "general",
      index: true,
    },
    type: {
      type: String,
      enum: ["string", "number", "boolean", "object", "array"],
      default: "string",
    },
    label: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    isPublic: {
      type: Boolean,
      default: false, // If true, can be accessed without authentication
    },
    isEncrypted: {
      type: Boolean,
      default: false, // For sensitive data like API keys
    },
    validation: {
      type: mongoose.Schema.Types.Mixed,
      default: null, // Can store validation rules
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
settingsSchema.index({ category: 1, key: 1 });

const Settings = mongoose.model("Settings", settingsSchema);

export default Settings;

