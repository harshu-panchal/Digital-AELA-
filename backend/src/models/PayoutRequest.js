import mongoose from "mongoose";

const payoutRequestSchema = new mongoose.Schema(
  {
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
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
    status: {
      type: String,
      enum: ["pending", "approved", "processing", "completed", "rejected", "cancelled"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["bank_transfer", "paypal", "stripe", "other"],
      default: "bank_transfer",
    },
    paymentDetails: {
      accountName: { type: String, trim: true },
      accountNumber: { type: String, trim: true },
      bankName: { type: String, trim: true },
      iban: { type: String, trim: true },
      swiftCode: { type: String, trim: true },
      paypalEmail: { type: String, trim: true },
      other: { type: String, trim: true },
    },
    earnings: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Earning",
      },
    ],
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    approvedAt: {
      type: Date,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    processedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
    paymentSlip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PaymentSlip",
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

payoutRequestSchema.index({ teacher: 1, createdAt: -1 });
payoutRequestSchema.index({ status: 1 });
payoutRequestSchema.index({ teacher: 1, status: 1 });

const PayoutRequest = mongoose.model("PayoutRequest", payoutRequestSchema);

export default PayoutRequest;

