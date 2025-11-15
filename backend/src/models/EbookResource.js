import mongoose from "mongoose";

const ebookResourceSchema = new mongoose.Schema(
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
    pages: Number,
    downloadUrl: {
      type: String,
      required: true,
    },
    categories: [String],
    publishedAt: {
      type: Date,
      default: Date.now,
    },
    isPublic: {
      type: Boolean,
      default: true,
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

const EbookResource = mongoose.model("EbookResource", ebookResourceSchema);

export default EbookResource;

