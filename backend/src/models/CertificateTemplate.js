import mongoose from "mongoose";

const certificateTemplateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    templateType: {
      type: String,
      enum: ["course_completion", "achievement", "participation", "custom"],
      default: "course_completion",
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Template design configuration
    design: {
      backgroundColor: {
        type: String,
        default: "#FFFFFF",
      },
      textColor: {
        type: String,
        default: "#000000",
      },
      borderColor: {
        type: String,
        default: "#D4AF37",
      },
      logoUrl: {
        type: String,
        trim: true,
      },
      backgroundImageUrl: {
        type: String,
        trim: true,
      },
      fontFamily: {
        type: String,
        default: "Arial",
      },
      headerText: {
        type: String,
        default: "Certificate of Completion",
      },
      footerText: {
        type: String,
        default: "This certificate verifies the successful completion of the course.",
      },
    },
    // Field mappings for dynamic content
    fields: {
      studentName: {
        enabled: { type: Boolean, default: true },
        label: { type: String, default: "Student Name" },
        position: { type: String, default: "center" },
      },
      courseTitle: {
        enabled: { type: Boolean, default: true },
        label: { type: String, default: "Course Title" },
        position: { type: String, default: "center" },
      },
      completionDate: {
        enabled: { type: Boolean, default: true },
        label: { type: String, default: "Date of Completion" },
        format: { type: String, default: "MMMM DD, YYYY" },
        position: { type: String, default: "center" },
      },
      grade: {
        enabled: { type: Boolean, default: false },
        label: { type: String, default: "Grade" },
        position: { type: String, default: "center" },
      },
      certificateNumber: {
        enabled: { type: Boolean, default: true },
        label: { type: String, default: "Certificate Number" },
        position: { type: String, default: "bottom" },
      },
      verificationCode: {
        enabled: { type: Boolean, default: true },
        label: { type: String, default: "Verification Code" },
        position: { type: String, default: "bottom" },
      },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure only one default template per type
certificateTemplateSchema.pre("save", async function (next) {
  if (this.isDefault) {
    await mongoose.model("CertificateTemplate").updateMany(
      { templateType: this.templateType, _id: { $ne: this._id } },
      { $set: { isDefault: false } }
    );
  }
  next();
});

certificateTemplateSchema.index({ templateType: 1, isDefault: 1 });
certificateTemplateSchema.index({ isActive: 1 });

const CertificateTemplate = mongoose.model("CertificateTemplate", certificateTemplateSchema);

export default CertificateTemplate;

