import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      enum: [
        "teacher_salary",
        "book_printing",
        "advertising",
        "office_expenses",
        "refunds",
        "software_subscriptions",
        "hosting",
        "utilities",
        "marketing",
        "maintenance",
        "other",
      ],
      default: "other",
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
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    month: {
      type: Number,
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "bank_transfer", "card", "check", "other"],
      default: "bank_transfer",
    },
    vendor: {
      type: String,
      trim: true,
    },
    receiptUrl: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "paid", "rejected"],
      default: "pending",
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    approvedAt: {
      type: Date,
    },
    paidAt: {
      type: Date,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tags: [
      {
        type: String,
        trim: true,
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

// Auto-set month and year from date
expenseSchema.pre("save", function (next) {
  if (this.date) {
    const date = new Date(this.date);
    this.month = date.getMonth() + 1;
    this.year = date.getFullYear();
  }
  next();
});

// Indexes for efficient queries
expenseSchema.index({ date: -1 });
expenseSchema.index({ month: 1, year: 1 });
expenseSchema.index({ category: 1 });
expenseSchema.index({ status: 1 });
expenseSchema.index({ createdBy: 1 });
expenseSchema.index({ createdAt: -1 });

const Expense = mongoose.model("Expense", expenseSchema);

export default Expense;

