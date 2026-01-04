import mongoose from "mongoose";

const paymentSlipSchema = new mongoose.Schema(
  {
    payoutRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PayoutRequest",
      required: true,
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    slipNumber: {
      type: String,
      unique: true,
      sparse: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "INR",
      uppercase: true,
    },
    period: {
      startDate: { type: Date },
      endDate: { type: Date },
    },
    earnings: [
      {
        earning: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Earning",
        },
        amount: { type: Number },
        description: { type: String },
      },
    ],
    pdfUrl: {
      type: String,
      trim: true,
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Generate slip number before saving
paymentSlipSchema.pre("save", async function (next) {
  if (!this.slipNumber) {
    const count = await mongoose.model("PaymentSlip").countDocuments();
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    this.slipNumber = `SLIP-${year}${month}-${String(count + 1).padStart(6, "0")}`;
  }
  next();
});

paymentSlipSchema.index({ teacher: 1, createdAt: -1 });
paymentSlipSchema.index({ payoutRequest: 1 });
// slipNumber index is already created by unique: true in field definition

const PaymentSlip = mongoose.model("PaymentSlip", paymentSlipSchema);

export default PaymentSlip;

