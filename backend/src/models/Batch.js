import mongoose from "mongoose";

const batchSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    code: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      uppercase: true,
    },
    description: {
      type: String,
      trim: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["upcoming", "active", "completed", "cancelled"],
      default: "upcoming",
    },
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    capacity: {
      type: Number,
      default: 50,
    },
    enrolledCount: {
      type: Number,
      default: 0,
    },
    schedule: {
      days: [
        {
          type: String,
          enum: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
        },
      ],
      time: {
        start: String, // e.g., "09:00"
        end: String, // e.g., "17:00"
      },
      timezone: {
        type: String,
        default: "UTC",
      },
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      default: null,
    },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    metadata: {
      location: String,
      meetingLink: String,
      notes: String,
      resources: [
        {
          title: String,
          url: String,
          type: String,
        },
      ],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
// code index is already created by unique: true in field definition
batchSchema.index({ status: 1 });
batchSchema.index({ startDate: 1, endDate: 1 });
batchSchema.index({ students: 1 });
batchSchema.index({ instructor: 1 });
batchSchema.index({ course: 1 });

// Virtual for checking if batch is full
batchSchema.virtual("isFull").get(function () {
  return this.enrolledCount >= this.capacity;
});

// Method to add student to batch
batchSchema.methods.addStudent = async function (studentId) {
  if (this.students.includes(studentId)) {
    throw new Error("Student already enrolled in this batch");
  }
  if (this.isFull) {
    throw new Error("Batch is full");
  }
  this.students.push(studentId);
  this.enrolledCount = this.students.length;
  return this.save();
};

// Method to remove student from batch
batchSchema.methods.removeStudent = async function (studentId) {
  this.students = this.students.filter(
    (id) => id.toString() !== studentId.toString()
  );
  this.enrolledCount = this.students.length;
  return this.save();
};

// Method to update status based on dates
batchSchema.methods.updateStatus = function () {
  const now = new Date();
  if (now < this.startDate) {
    this.status = "upcoming";
  } else if (now >= this.startDate && now <= this.endDate) {
    this.status = "active";
  } else if (now > this.endDate) {
    this.status = "completed";
  }
  return this.save();
};

// Pre-save hook to update enrolledCount
batchSchema.pre("save", function (next) {
  if (this.isModified("students")) {
    this.enrolledCount = this.students.length;
  }
  next();
});

const Batch = mongoose.model("Batch", batchSchema);

export default Batch;

