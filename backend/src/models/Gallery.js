import mongoose from "mongoose";

const gallerySchema = new mongoose.Schema(
  {
    imageUrl: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      trim: true,
      default: "",
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    mediaType: {
      type: String,
      enum: ["image", "video"],
      default: "image",
    },
    sourceType: {
      type: String,
      enum: ["upload", "link"],
      default: "upload",
    },
    publicId: {
      type: String,
      trim: true,
      default: "",
    },
    mediaItems: [
      {
        url: {
          type: String,
          required: true,
          trim: true,
        },
        mediaType: {
          type: String,
          enum: ["image", "video"],
          default: "image",
        },
        sourceType: {
          type: String,
          enum: ["upload", "link"],
          default: "upload",
        },
        publicId: {
          type: String,
          trim: true,
          default: "",
        },
      },
    ],
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
gallerySchema.index({ isActive: 1, order: 1, createdAt: -1 });

const Gallery = mongoose.model("Gallery", gallerySchema);

export default Gallery;

