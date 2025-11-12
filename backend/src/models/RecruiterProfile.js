import mongoose from "mongoose";

const recruiterProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    company: {
      type: String,
      trim: true,
    },
    headline: {
      type: String,
      trim: true,
    },
    bio: {
      type: String,
      trim: true,
    },
    avatarUrl: {
      type: String,
    },
    socials: {
      linkedin: String,
      website: String,
      twitter: String,
    },
    stats: {
      activeRoles: {
        type: Number,
        default: 0,
      },
      totalViews: {
        type: Number,
        default: 0,
      },
      totalApplications: {
        type: Number,
        default: 0,
      },
      savedApplicants: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
  }
);

const RecruiterProfile = mongoose.model("RecruiterProfile", recruiterProfileSchema);

export default RecruiterProfile;

