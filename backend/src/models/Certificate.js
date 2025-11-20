import mongoose from "mongoose";
import crypto from "crypto";

const certificateSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: false, // Optional for non-course certificates
    },
    enrollment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Enrollment",
      required: false,
    },
    template: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CertificateTemplate",
      required: false,
    },
    certificateNumber: {
      type: String,
      unique: true,
      sparse: true,
    },
    verificationCode: {
      type: String,
      required: true,
      unique: true,
      default: () => crypto.randomBytes(16).toString("hex"),
    },
    pdfUrl: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "generated", "issued", "revoked"],
      default: "pending",
    },
    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // Admin who manually issued
    },
    issuedAt: {
      type: Date,
      default: Date.now,
    },
    issuedType: {
      type: String,
      enum: ["automatic", "manual"],
      default: "automatic",
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    // Certificate content fields
    studentName: {
      type: String,
      required: true,
    },
    courseTitle: {
      type: String,
      required: false,
    },
    completionDate: {
      type: Date,
      default: Date.now,
    },
    grade: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Generate certificate number before saving
certificateSchema.pre("save", async function (next) {
  if (!this.certificateNumber && this.status === "issued") {
    const count = await mongoose.model("Certificate").countDocuments();
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    this.certificateNumber = `CERT-${year}${month}-${String(count + 1).padStart(6, "0")}`;
  }
  next();
});

// Indexes for efficient queries
certificateSchema.index({ student: 1, createdAt: -1 });
certificateSchema.index({ course: 1 });
certificateSchema.index({ verificationCode: 1 });
certificateSchema.index({ certificateNumber: 1 });
certificateSchema.index({ status: 1 });
certificateSchema.index({ issuedAt: -1 });

const Certificate = mongoose.model("Certificate", certificateSchema);

export default Certificate;

