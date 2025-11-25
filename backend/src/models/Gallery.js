import mongoose from "mongoose";

const gallerySchema = new mongoose.Schema(
  {
    imageUrl: {
      type: String,
      required: true,
      trim: true,
    },
    publicId: {
      type: String,
      required: true,
      trim: true,
    },
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

