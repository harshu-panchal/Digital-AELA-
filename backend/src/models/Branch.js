import mongoose from "mongoose";

const branchSchema = new mongoose.Schema(
  {
    instituteName: {
      type: String,
      required: true,
      trim: true,
    },
    branchName: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    contactEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    contactPhone: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
      default: "",
    },
    city: {
      type: String,
      trim: true,
      default: "",
    },
    state: {
      type: String,
      trim: true,
      default: "",
    },
    country: {
      type: String,
      trim: true,
      default: "",
    },
    postalCode: {
      type: String,
      trim: true,
      default: "",
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    logoUrl: {
      type: String,
      trim: true,
      default: "",
    },
    bannerUrl: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "suspended"],
      default: "pending",
    },
    isLive: {
      type: Boolean,
      default: false,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    rejectionReason: {
      type: String,
      trim: true,
      default: null,
    },
    settings: {
      autoApproveTeachers: {
        type: Boolean,
        default: false,
      },
      autoApproveStudents: {
        type: Boolean,
        default: false,
      },
      allowTeacherContentSubmission: {
        type: Boolean,
        default: true,
      },
      defaultAnnouncementAudience: {
        type: String,
        enum: ["all", "teachers", "students"],
        default: "all",
      },
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

branchSchema.index({ status: 1, isLive: 1, instituteName: 1 });
branchSchema.index({ ownerId: 1, status: 1 });
branchSchema.index({ city: 1, state: 1, country: 1, status: 1 });
branchSchema.index({
  instituteName: "text",
  branchName: "text",
  city: "text",
  state: "text",
  country: "text",
});

const Branch = mongoose.model("Branch", branchSchema);

export default Branch;
