import mongoose from "mongoose";

const studentProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    headline: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    bio: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    phone: {
      type: String,
      trim: true,
    },
    location: {
      city: String,
      country: String,
    },
    ageGroup: String,
    currentStatus: {
      type: String,
      enum: ["school-student", "college-graduate", "working-professional", "career-switcher"],
    },
    profession: String,
    englishLevel: String,
    maritalStatus: String,
    skills: [String],
    interests: [String],
    experience: {
      years: Number,
      description: String,
    },
    education: [
      {
        degree: String,
        institution: String,
        year: Number,
        description: String,
      },
    ],
    resumeUrl: String,
    portfolioUrl: String,
    linkedinUrl: String,
    githubUrl: String,
    websiteUrl: String,
    avatarUrl: String,
    preferredProgram: String,
    goals: String,
    socialLinks: [
      {
        platform: {
          type: String,
          enum: ["LinkedIn", "YouTube", "Instagram", "TikTok", "Twitter", "Facebook", "GitHub", "Website"],
          required: true,
        },
        url: {
          type: String,
          required: true,
        },
        verified: {
          type: Boolean,
          default: false,
        },
        verifiedAt: Date,
        bonus: {
          type: Number,
          default: 0,
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

// Index for quick user profile lookup (already unique, but explicit index helps)
studentProfileSchema.index({ user: 1 });

const StudentProfile = mongoose.model("StudentProfile", studentProfileSchema);

export default StudentProfile;

