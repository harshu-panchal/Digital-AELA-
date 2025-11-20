import mongoose from "mongoose";

const earningSchema = new mongoose.Schema(
  {
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: false,
    },
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      required: false,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "AED",
      uppercase: true,
    },
    earningType: {
      type: String,
      enum: ["course_sale", "referral", "bonus", "commission", "other"],
      default: "course_sale",
    },
    status: {
      type: String,
      enum: ["pending", "available", "paid", "cancelled"],
      default: "pending",
    },
    month: {
      type: Number,
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
    },
    description: {
      type: String,
      trim: true,
    },
    referralCode: {
      type: String,
      trim: true,
    },
    bonusReason: {
      type: String,
      trim: true,
    },
    paidAt: {
      type: Date,
    },
    paidVia: {
      type: String,
      enum: ["payout_request", "automatic", "manual"],
    },
    payoutRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PayoutRequest",
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

// Auto-set month and year from createdAt
earningSchema.pre("save", function (next) {
  if (!this.month || !this.year) {
    const date = this.createdAt || new Date();
    this.month = date.getMonth() + 1;
    this.year = date.getFullYear();
  }
  next();
});

// Indexes for efficient queries
earningSchema.index({ teacher: 1, createdAt: -1 });
earningSchema.index({ teacher: 1, month: 1, year: 1 });
earningSchema.index({ teacher: 1, status: 1 });
earningSchema.index({ course: 1 });
earningSchema.index({ payment: 1 });
earningSchema.index({ earningType: 1 });
earningSchema.index({ payoutRequest: 1 });

const Earning = mongoose.model("Earning", earningSchema);

export default Earning;

