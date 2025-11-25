import mongoose from "mongoose";

const testimonialSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    role: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    avatar: {
      type: String,
      default: null,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      default: 5,
    },
    section: {
      type: String,
      enum: ["home", "success-stories", "both"],
      default: "home",
      required: true,
    },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "published",
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
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

// Index for efficient queries
testimonialSchema.index({ status: 1, section: 1, displayOrder: 1, createdAt: -1 });
testimonialSchema.index({ createdBy: 1, createdAt: -1 });

const Testimonial = mongoose.model("Testimonial", testimonialSchema);

export default Testimonial;

