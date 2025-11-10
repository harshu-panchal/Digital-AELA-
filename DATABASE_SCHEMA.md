# Database Schema Design - LMS & Job Portal Platform

## Complete Database Schema Reference

This document provides the complete database schema design using Mongoose ODM (MongoDB).

---

## 📋 Schema Overview

### Core Models

1. **User Management**: User, UserProfile, InstructorProfile, RecruiterProfile, CompanyProfile
2. **LMS Module**: Course, CourseModule, Lesson, Enrollment, LessonCompletion, Certificate
3. **Job Portal**: Job, JobApplication, Resume
4. **Communication**: Notification, Message
5. **Monetization**: Payment, Membership, MembershipPlan

---

## 🗄 Complete Mongoose Schemas

### User Management Models

#### User Model (`models/User.js`)

```javascript
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    passwordHash: {
      type: String,
      required: [true, "Password is required"],
      select: false, // Don't include in queries by default
    },
    role: {
      type: String,
      enum: ["ADMIN", "INSTRUCTOR", "STUDENT", "RECRUITER", "JOB_SEEKER"],
      required: [true, "Role is required"],
    },
    firstName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    avatarUrl: {
      type: String,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "SUSPENDED", "PENDING_VERIFICATION"],
      default: "PENDING_VERIFICATION",
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerifiedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // Creates createdAt and updatedAt automatically
  }
);

// Index for faster queries
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });

// Virtual for full name
userSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`.trim();
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.passwordHash);
};

// Remove passwordHash from JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

module.exports = mongoose.model("User", userSchema);
```

#### UserProfile Model (`models/UserProfile.js`)

```javascript
const mongoose = require("mongoose");

const userProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    bio: {
      type: String,
      maxlength: 500,
    },
    skills: [
      {
        type: String,
        trim: true,
      },
    ],
    experienceLevel: {
      type: String,
      enum: ["BEGINNER", "INTERMEDIATE", "ADVANCED"],
    },
    location: {
      type: String,
      trim: true,
    },
    linkedinUrl: {
      type: String,
      trim: true,
    },
    githubUrl: {
      type: String,
      trim: true,
    },
    websiteUrl: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("UserProfile", userProfileSchema);
```

#### InstructorProfile Model (`models/InstructorProfile.js`)

```javascript
const mongoose = require("mongoose");

const instructorProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    specialization: [
      {
        type: String,
        trim: true,
      },
    ],
    bio: {
      type: String,
      maxlength: 1000,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalStudents: {
      type: Number,
      default: 0,
    },
    totalCourses: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("InstructorProfile", instructorProfileSchema);
```

#### CompanyProfile Model (`models/CompanyProfile.js`)

```javascript
const mongoose = require("mongoose");

const companyProfileSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
    },
    logoUrl: {
      type: String,
      default: null,
    },
    industry: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      maxlength: 2000,
    },
    website: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
    size: {
      type: String,
      enum: ["1-50", "51-200", "201-500", "500+"],
    },
    foundedYear: {
      type: Number,
      min: 1800,
      max: new Date().getFullYear(),
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("CompanyProfile", companyProfileSchema);
```

#### RecruiterProfile Model (`models/RecruiterProfile.js`)

```javascript
const mongoose = require("mongoose");

const recruiterProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CompanyProfile",
      required: true,
    },
    position: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("RecruiterProfile", recruiterProfileSchema);
```

---

### LMS Module Models

#### Course Model (`models/Course.js`)

```javascript
const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Course title is required"],
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: [true, "Course description is required"],
      maxlength: 5000,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    instructorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    category: {
      type: String,
      enum: [
        "IT",
        "DESIGN",
        "BUSINESS",
        "MARKETING",
        "DATA_SCIENCE",
        "PERSONAL_DEVELOPMENT",
        "OTHER",
      ],
      required: true,
    },
    skillLevel: {
      type: String,
      enum: ["BEGINNER", "INTERMEDIATE", "ADVANCED"],
      required: true,
    },
    durationHours: {
      type: Number,
      default: 0,
      min: 0,
    },
    price: {
      type: Number,
      default: 0,
      min: 0,
    },
    isFree: {
      type: Boolean,
      default: false,
    },
    thumbnailUrl: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ["DRAFT", "PUBLISHED", "ARCHIVED"],
      default: "DRAFT",
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalStudents: {
      type: Number,
      default: 0,
    },
    totalLessons: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

courseSchema.index({ instructorId: 1 });
courseSchema.index({ category: 1, status: 1 });
courseSchema.index({ slug: 1 });

module.exports = mongoose.model("Course", courseSchema);
```

#### CourseModule Model (`models/CourseModule.js`)

```javascript
const mongoose = require("mongoose");

const courseModuleSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    title: {
      type: String,
      required: [true, "Module title is required"],
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      maxlength: 1000,
    },
    orderIndex: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

courseModuleSchema.index({ courseId: 1, orderIndex: 1 });

module.exports = mongoose.model("CourseModule", courseModuleSchema);
```

#### Lesson Model (`models/Lesson.js`)

```javascript
const mongoose = require("mongoose");

const lessonSchema = new mongoose.Schema(
  {
    moduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CourseModule",
      required: true,
    },
    title: {
      type: String,
      required: [true, "Lesson title is required"],
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      maxlength: 2000,
    },
    videoUrl: {
      type: String,
      default: null,
    },
    durationSeconds: {
      type: Number,
      default: 0,
      min: 0,
    },
    orderIndex: {
      type: Number,
      required: true,
      min: 0,
    },
    resources: [
      {
        type: {
          type: String,
          enum: ["PDF", "DOC", "LINK", "OTHER"],
        },
        url: String,
        name: String,
      },
    ],
    attachments: [
      {
        type: {
          type: String,
          enum: ["PDF", "DOC", "IMAGE", "OTHER"],
        },
        url: String,
        name: String,
        size: Number,
      },
    ],
    isPreview: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

lessonSchema.index({ moduleId: 1, orderIndex: 1 });

module.exports = mongoose.model("Lesson", lessonSchema);
```

#### Enrollment Model (`models/Enrollment.js`)

```javascript
const mongoose = require("mongoose");

const enrollmentSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    enrolledAt: {
      type: Date,
      default: Date.now,
    },
    progressPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "COMPLETED", "DROPPED"],
      default: "ACTIVE",
    },
  },
  {
    timestamps: true,
  }
);

enrollmentSchema.index({ studentId: 1, courseId: 1 }, { unique: true });
enrollmentSchema.index({ studentId: 1 });
enrollmentSchema.index({ courseId: 1 });

module.exports = mongoose.model("Enrollment", enrollmentSchema);
```

#### LessonCompletion Model (`models/LessonCompletion.js`)

```javascript
const mongoose = require("mongoose");

const lessonCompletionSchema = new mongoose.Schema(
  {
    enrollmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Enrollment",
      required: true,
    },
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
      required: true,
    },
    completedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

lessonCompletionSchema.index(
  { enrollmentId: 1, lessonId: 1 },
  { unique: true }
);

module.exports = mongoose.model("LessonCompletion", lessonCompletionSchema);
```

#### Certificate Model (`models/Certificate.js`)

```javascript
const mongoose = require("mongoose");
const crypto = require("crypto");

const certificateSchema = new mongoose.Schema(
  {
    enrollmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Enrollment",
      required: true,
      unique: true,
    },
    certificateUrl: {
      type: String,
      required: true,
    },
    verificationCode: {
      type: String,
      required: true,
      unique: true,
      default: () => crypto.randomBytes(16).toString("hex"),
    },
    issuedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

certificateSchema.index({ verificationCode: 1 });

module.exports = mongoose.model("Certificate", certificateSchema);
```

---

### Job Portal Models

#### Job Model (`models/Job.js`)

```javascript
const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    recruiterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CompanyProfile",
      required: true,
    },
    title: {
      type: String,
      required: [true, "Job title is required"],
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: [true, "Job description is required"],
      maxlength: 5000,
    },
    requirements: [
      {
        type: String,
        trim: true,
      },
    ],
    skills: [
      {
        type: String,
        trim: true,
      },
    ],
    experienceLevel: {
      type: String,
      enum: ["BEGINNER", "INTERMEDIATE", "ADVANCED"],
    },
    location: {
      type: String,
      trim: true,
    },
    salaryMin: {
      type: Number,
      min: 0,
    },
    salaryMax: {
      type: Number,
      min: 0,
    },
    jobType: {
      type: String,
      enum: ["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP", "FREELANCE"],
      required: true,
    },
    status: {
      type: String,
      enum: ["DRAFT", "PUBLISHED", "CLOSED", "EXPIRED"],
      default: "DRAFT",
    },
    postedAt: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

jobSchema.index({ recruiterId: 1 });
jobSchema.index({ companyId: 1 });
jobSchema.index({ status: 1, postedAt: -1 });
jobSchema.index({ location: 1, jobType: 1 });

module.exports = mongoose.model("Job", jobSchema);
```

#### JobApplication Model (`models/JobApplication.js`)

```javascript
const mongoose = require("mongoose");

const jobApplicationSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    applicantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    resumeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resume",
      default: null,
    },
    resumeUrl: {
      type: String,
      default: null,
    },
    coverLetter: {
      type: String,
      maxlength: 2000,
    },
    status: {
      type: String,
      enum: [
        "PENDING",
        "REVIEWED",
        "SHORTLISTED",
        "REJECTED",
        "INTERVIEW_SCHEDULED",
        "OFFERED",
        "WITHDRAWN",
      ],
      default: "PENDING",
    },
    appliedAt: {
      type: Date,
      default: Date.now,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      maxlength: 1000,
    },
  },
  {
    timestamps: true,
  }
);

jobApplicationSchema.index({ jobId: 1, applicantId: 1 }, { unique: true });
jobApplicationSchema.index({ applicantId: 1 });
jobApplicationSchema.index({ jobId: 1, status: 1 });

module.exports = mongoose.model("JobApplication", jobApplicationSchema);
```

#### Resume Model (`models/Resume.js`)

```javascript
const mongoose = require("mongoose");

const resumeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    templateId: {
      type: String,
      default: null,
    },
    data: {
      personalInfo: {
        firstName: String,
        lastName: String,
        email: String,
        phone: String,
        location: String,
        linkedin: String,
        github: String,
        website: String,
      },
      summary: String,
      education: [
        {
          degree: String,
          institution: String,
          year: Number,
          description: String,
        },
      ],
      experience: [
        {
          title: String,
          company: String,
          startDate: Date,
          endDate: Date,
          current: Boolean,
          description: String,
        },
      ],
      skills: [String],
      projects: [
        {
          name: String,
          description: String,
          url: String,
        },
      ],
      certifications: [
        {
          name: String,
          issuer: String,
          date: Date,
        },
      ],
    },
    pdfUrl: {
      type: String,
      default: null,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

resumeSchema.index({ userId: 1 });
resumeSchema.index({ userId: 1, isDefault: 1 });

module.exports = mongoose.model("Resume", resumeSchema);
```

---

### Communication Models

#### Notification Model (`models/Notification.js`)

```javascript
const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: [
        "COURSE_ENROLLMENT",
        "COURSE_COMPLETION",
        "CERTIFICATE_ISSUED",
        "JOB_APPLICATION_RECEIVED",
        "APPLICATION_STATUS_UPDATE",
        "NEW_JOB_POSTING",
        "COURSE_RECOMMENDATION",
        "SYSTEM",
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
      maxlength: 200,
    },
    message: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
    linkUrl: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
```

#### Message Model (`models/Message.js`)

```javascript
const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    subject: {
      type: String,
      maxlength: 200,
    },
    content: {
      type: String,
      required: true,
      maxlength: 5000,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

messageSchema.index({ senderId: 1, createdAt: -1 });
messageSchema.index({ receiverId: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model("Message", messageSchema);
```

---

### Monetization Models

#### Payment Model (`models/Payment.js`)

```javascript
const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      default: null,
    },
    membershipId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Membership",
      default: null,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "USD",
      maxlength: 3,
    },
    paymentMethod: {
      type: String,
      enum: ["STRIPE", "PAYPAL", "RAZORPAY", "BANK_TRANSFER"],
      required: true,
    },
    transactionId: {
      type: String,
      unique: true,
      sparse: true, // Allows multiple nulls
    },
    status: {
      type: String,
      enum: ["PENDING", "COMPLETED", "FAILED", "REFUNDED"],
      default: "PENDING",
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

paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ transactionId: 1 });

module.exports = mongoose.model("Payment", paymentSchema);
```

#### MembershipPlan Model (`models/MembershipPlan.js`)

```javascript
const mongoose = require("mongoose");

const membershipPlanSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Plan name is required"],
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      maxlength: 1000,
    },
    planType: {
      type: String,
      enum: ["MONTHLY", "ANNUAL", "LIFETIME"],
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    durationDays: {
      type: Number,
      default: null, // null for lifetime
      min: 1,
    },
    features: [
      {
        type: String,
        trim: true,
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("MembershipPlan", membershipPlanSchema);
```

#### Membership Model (`models/Membership.js`)

```javascript
const mongoose = require("mongoose");

const membershipSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MembershipPlan",
      required: true,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      default: null, // null for lifetime
    },
    status: {
      type: String,
      enum: ["ACTIVE", "EXPIRED", "CANCELLED"],
      default: "ACTIVE",
    },
    autoRenew: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

membershipSchema.index({ userId: 1, status: 1 });
membershipSchema.index({ endDate: 1, status: 1 }); // For finding expired memberships

module.exports = mongoose.model("Membership", membershipSchema);
```

---

## 📊 Database Relationships

### Relationships Overview

```
User
├── UserProfile (1:1)
├── InstructorProfile (1:1)
├── RecruiterProfile (1:1)
├── Course[] (1:N) - as instructor
├── Enrollment[] (1:N) - as student
├── JobApplication[] (1:N) - as applicant
├── Resume[] (1:N)
├── Message[] (1:N) - as sender/receiver
├── Notification[] (1:N)
├── Payment[] (1:N)
└── Membership[] (1:N)

Course
├── CourseModule[] (1:N)
├── Enrollment[] (1:N)
└── Payment[] (1:N)

CourseModule
└── Lesson[] (1:N)

Lesson
└── LessonCompletion[] (1:N)

Enrollment
├── LessonCompletion[] (1:N)
└── Certificate (1:1)

CompanyProfile
├── RecruiterProfile[] (1:N)
└── Job[] (1:N)

Job
└── JobApplication[] (1:N)

JobApplication
└── Resume (N:1)
```

---

## 🔑 Key Database Design Decisions

### 1. User Role Management

- **Single User Collection**: All users in one collection with role field
- **Profile Collections**: Separate profile collections for different roles
- **Flexibility**: Users can have multiple roles (future enhancement)

### 2. Course Structure

- **Hierarchical**: Course → Module → Lesson
- **Ordering**: `orderIndex` for maintaining sequence
- **Resources**: Array of objects for flexible resource storage

### 3. Enrollment & Progress

- **Progress Calculation**: Based on completed lessons
- **Status Tracking**: ACTIVE, COMPLETED, DROPPED
- **Unique Constraint**: One enrollment per student per course

### 4. Job Portal

- **Company-Employer Link**: CompanyProfile linked to RecruiterProfile
- **Application Status**: Comprehensive status tracking
- **Expiration**: Automatic expiration handling

### 5. Monetization

- **Flexible Payments**: Support for course and membership payments
- **Transaction Tracking**: Transaction ID for payment gateway integration
- **Membership Plans**: Flexible plan types (monthly, annual, lifetime)

### 6. Communication

- **Notifications**: In-app notifications with read status
- **Messages**: Direct messaging between users (optional)

---

## 📝 Connection Setup

### MongoDB Connection (`config/database.js`)

```javascript
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
```

### Usage in `server.js`

```javascript
const express = require("express");
const connectDB = require("./config/database");

const app = express();

// Connect to MongoDB
connectDB();

// Rest of your server code
```

---

## 🔍 Common Queries

### Get User with Enrollments

```javascript
const user = await User.findById(userId).populate({
  path: "enrollments",
  populate: {
    path: "courseId",
    model: "Course",
  },
});
```

### Get Course with Progress

```javascript
const course = await Course.findById(courseId).populate({
  path: "modules",
  populate: {
    path: "lessons",
    model: "Lesson",
  },
});

const enrollment = await Enrollment.findOne({
  studentId: userId,
  courseId: courseId,
});

const completedLessons = await LessonCompletion.find({
  enrollmentId: enrollment._id,
});
```

### Get Job Applications for Recruiter

```javascript
const applications = await JobApplication.find({
  job: {
    $in: await Job.find({ recruiterId: recruiterId }).distinct("_id"),
  },
})
  .populate("applicantId", "firstName lastName email")
  .populate("resumeId")
  .sort({ appliedAt: -1 });
```

---

## ⚡ Performance Optimization

### Indexes

- Add indexes on frequently queried fields
- Compound indexes for complex queries
- Unique indexes for preventing duplicates

### Considerations

- Use pagination for large datasets
- Use `.select()` to limit fields returned
- Use `.lean()` for read-only queries (faster)
- Use aggregation pipeline for complex queries

---

## 🔒 Security Considerations

1. **Password Hashing**: Never store plain passwords (use bcrypt)
2. **Data Validation**: Validate all inputs at schema level and API level
3. **NoSQL Injection**: Mongoose prevents NoSQL injection
4. **Access Control**: Implement at application level
5. **Soft Deletes**: Consider soft delete for important data (add `deletedAt` field)

---

## 📚 Next Steps

1. Review this schema
2. Adjust based on your specific requirements
3. Create Mongoose model files
4. Set up MongoDB connection
5. Seed initial data (optional)
6. Start building APIs

---

**Note**: This schema is comprehensive and can be adjusted based on your specific needs. Consider starting with MVP features and expanding as needed.
