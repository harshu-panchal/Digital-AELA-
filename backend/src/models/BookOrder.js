import mongoose from "mongoose";

const shippingAddressSchema = new mongoose.Schema(
  {
    addressLine1: { type: String, trim: true },
    addressLine2: { type: String, trim: true, default: "" },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    pincode: { type: String, trim: true },
    country: { type: String, trim: true, default: "India" },
  },
  { _id: false }
);

const guestInfoSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, trim: true, default: "" },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const bookOrderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
      sparse: true,
    },
    bookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EbookResource",
      required: true,
    },
    bookTitle: {
      type: String,
      required: true,
      trim: true,
    },
    bookFormat: {
      type: String,
      enum: ["physical", "ebook"],
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
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
      enum: [
        "pending",
        "payment_initiated",
        "payment_completed",
        "payment_failed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "refunded",
      ],
      default: "pending",
    },
    // Link to the Payment model for financial tracking
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      default: null,
    },
    razorpayOrderId: { type: String, trim: true, default: null },
    razorpayPaymentId: { type: String, trim: true, default: null },
    razorpaySignature: { type: String, trim: true, default: null },
    razorpayPaymentLinkId: { type: String, trim: true, default: null },

    // Guest vs registered
    isGuest: {
      type: Boolean,
      required: true,
      default: false,
    },
    guestInfo: {
      type: guestInfoSchema,
      default: null,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Address
    shippingAddress: {
      type: shippingAddressSchema,
      default: null,
    },

    // CRM link
    crmLeadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
      default: null,
    },

    // Order management
    orderNotes: { type: String, trim: true, default: "" },
    adminNotes: { type: String, trim: true, default: "" },
    trackingNumber: { type: String, trim: true, default: "" },
    trackingUrl: { type: String, trim: true, default: "" },

    // Timestamps for fulfillment stages
    orderedAt: { type: Date, default: Date.now },
    shippedAt: { type: Date, default: null },
    deliveredAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },

    // Security / audit
    createdByIp: { type: String, trim: true, default: null },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Auto-generate order number before saving
bookOrderSchema.pre("save", async function (next) {
  if (!this.orderNumber) {
    const count = await mongoose.model("BookOrder").countDocuments();
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    this.orderNumber = `ORD-${year}${month}-${String(count + 1).padStart(6, "0")}`;
  }
  next();
});

// Indexes for efficient queries
bookOrderSchema.index({ status: 1 });
bookOrderSchema.index({ isGuest: 1 });
bookOrderSchema.index({ createdAt: -1 });
bookOrderSchema.index({ "guestInfo.email": 1 });
bookOrderSchema.index({ userId: 1, createdAt: -1 });
bookOrderSchema.index({ bookId: 1, createdAt: -1 });
bookOrderSchema.index({ orderNumber: 1 });
bookOrderSchema.index({ razorpayPaymentLinkId: 1 });
bookOrderSchema.index({ status: 1, isGuest: 1 });

const BookOrder = mongoose.model("BookOrder", bookOrderSchema);

export default BookOrder;
