import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // Optional for guest payments
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: false, // Optional for non-course payments
    },
    isGuest: {
      type: Boolean,
      default: false,
    },
    guestInfo: {
      firstName: { type: String },
      lastName: { type: String },
      email: { type: String },
      phone: { type: String },
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
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed", "refunded", "partially_refunded", "cancelled"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["card", "bank_transfer", "wallet", "cash", "other"],
      default: "card",
    },
    gateway: {
      type: String,
      enum: ["stripe", "paypal", "razorpay", "manual", "other"],
      default: "manual",
    },
    gatewayTransactionId: {
      type: String,
      trim: true,
    },
    gatewayPaymentIntentId: {
      type: String,
      trim: true,
    },
    invoiceNumber: {
      type: String,
      unique: true,
      sparse: true,
    },
    invoiceUrl: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    refundAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    refundReason: {
      type: String,
      trim: true,
    },
    refundedAt: {
      type: Date,
    },
    refundedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    failureReason: {
      type: String,
      trim: true,
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

// Generate invoice number before saving
paymentSchema.pre("save", async function (next) {
  if (!this.invoiceNumber && this.status === "completed") {
    const count = await mongoose.model("Payment").countDocuments();
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    this.invoiceNumber = `INV-${year}${month}-${String(count + 1).padStart(6, "0")}`;
  }
  next();
});

// Indexes for efficient queries
paymentSchema.index({ user: 1, createdAt: -1 });
paymentSchema.index({ course: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ gatewayTransactionId: 1 });
// invoiceNumber index is already created by unique: true in field definition
paymentSchema.index({ createdAt: -1 });

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;

