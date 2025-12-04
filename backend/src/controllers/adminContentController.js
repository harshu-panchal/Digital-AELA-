import mongoose from "mongoose";
import Course from "../models/Course.js";
import EbookResource from "../models/EbookResource.js";
import JobPost from "../models/JobPost.js";
import User from "../models/User.js";
import RecruiterBlog from "../models/RecruiterBlog.js";
import { uploadPdfToCloudinary } from "../middleware/uploadMiddleware.js";
import { normalizeUrl } from "../utils/urlNormalizer.js";

/**
 * Super Admin: Get Content Management Statistics
 */
export const getContentManagementStats = async (req, res, next) => {
  try {
    const { userRole } = req.auth || {};

    if (!req.auth || userRole !== "super-admin") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only super admins can access this endpoint",
        },
      });
    }

    // Get all super admin users
    const superAdmins = await User.find({ role: "super-admin" }).select("_id").lean();
    const superAdminIds = superAdmins.map((admin) => admin._id);

    // Get statistics
    const [
      totalBooks,
      booksByAdmin,
      totalCourses,
      coursesByAdmin,
    ] = await Promise.all([
      // Total books
      EbookResource.countDocuments({}),
      // Books uploaded by super admin
      EbookResource.countDocuments({
        $or: [
          { "metadata.uploadedBy": { $in: superAdminIds } },
          { "metadata.author": "Digital AELA" },
        ],
      }),
      // Total courses
      Course.countDocuments({}),
      // Courses created by super admin
      Course.countDocuments({
        instructor: { $in: superAdminIds },
      }),
    ]);

    return res.json({
      stats: {
        totalBooks,
        booksByAdmin,
        totalCourses,
        coursesByAdmin,
      },
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Super Admin: Get All Courses for Management
 */
export const getAllCoursesForManagement = async (req, res, next) => {
  try {
    const { userRole } = req.auth || {};

    if (!req.auth || userRole !== "super-admin") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only super admins can access this endpoint",
        },
      });
    }

    const { page = 1, pageSize = 20, status, search } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);

    const query = {};
    if (status) {
      query.status = status;
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const [courses, total] = await Promise.all([
      Course.find(query)
        .populate("instructor", "fullName email role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(pageSize))
        .lean(),
      Course.countDocuments(query),
    ]);

    return res.json({
      courses,
      meta: {
        page: Number(page),
        pageSize: Number(pageSize),
        total,
      },
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Super Admin: Get All Books for Management
 */
export const getAllBooksForManagement = async (req, res, next) => {
  try {
    const { userRole } = req.auth || {};

    if (!req.auth || userRole !== "super-admin") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only super admins can access this endpoint",
        },
      });
    }

    const { page = 1, pageSize = 20, isPublic, search } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);

    const query = {};
    if (isPublic !== undefined) {
      query.isPublic = isPublic === "true" || isPublic === true;
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const [books, total] = await Promise.all([
      EbookResource.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(pageSize))
        .lean(),
      EbookResource.countDocuments(query),
    ]);

    return res.json({
      books,
      meta: {
        page: Number(page),
        pageSize: Number(pageSize),
        total,
      },
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Super Admin: Delete Course
 */
export const deleteCourse = async (req, res, next) => {
  try {
    const { userRole } = req.auth || {};

    if (!req.auth || userRole !== "super-admin") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only super admins can access this endpoint",
        },
      });
    }

    const { courseId } = req.params;

    if (!mongoose.isValidObjectId(courseId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid course ID",
        },
      });
    }

    const course = await Course.findByIdAndDelete(courseId);

    if (!course) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Course not found",
        },
      });
    }

    return res.json({
      message: "Course deleted successfully",
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Super Admin: Delete Book
 */
export const deleteBook = async (req, res, next) => {
  try {
    const { userRole } = req.auth || {};

    if (!req.auth || userRole !== "super-admin") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only super admins can access this endpoint",
        },
      });
    }

    const { bookId } = req.params;

    if (!mongoose.isValidObjectId(bookId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid book ID",
        },
      });
    }

    const book = await EbookResource.findByIdAndDelete(bookId);

    if (!book) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Book not found",
        },
      });
    }

    return res.json({
      message: "Book deleted successfully",
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Super Admin: Toggle Course Visibility (Hide/Show)
 */
export const toggleCourseVisibility = async (req, res, next) => {
  try {
    const { userRole } = req.auth || {};

    if (!req.auth || userRole !== "super-admin") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only super admins can access this endpoint",
        },
      });
    }

    const { courseId } = req.params;
    const { isVisible } = req.body;

    if (!mongoose.isValidObjectId(courseId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid course ID",
        },
      });
    }

    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Course not found",
        },
      });
    }

    // Toggle visibility: if visible, set to archived (hidden), otherwise set to published (visible)
    if (isVisible === true || isVisible === "true") {
      course.status = "published";
    } else {
      course.status = "archived";
    }

    await course.save();

    return res.json({
      course,
      message: `Course ${course.status === "published" ? "shown" : "hidden"} successfully`,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Super Admin: Toggle Book Visibility (Hide/Show)
 */
export const toggleBookVisibility = async (req, res, next) => {
  try {
    const { userRole } = req.auth || {};

    if (!req.auth || userRole !== "super-admin") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only super admins can access this endpoint",
        },
      });
    }

    const { bookId } = req.params;
    const { isVisible } = req.body;

    if (!mongoose.isValidObjectId(bookId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid book ID",
        },
      });
    }

    const book = await EbookResource.findById(bookId);

    if (!book) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Book not found",
        },
      });
    }

    // Toggle visibility
    book.isPublic = isVisible === true || isVisible === "true";
    if (book.isPublic && !book.publishedAt) {
      book.publishedAt = new Date();
    }

    await book.save();

    return res.json({
      book,
      message: `Book ${book.isPublic ? "shown" : "hidden"} successfully`,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Approve/Reject Course
 */
export const approveCourse = async (req, res, next) => {
  try {
    const { userRole, userId } = req.auth || {};

    if (!req.auth || userRole !== "super-admin") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only super admins can access this endpoint",
        },
      });
    }

    const { courseId } = req.params;
    const { action } = req.body; // "approve" or "reject"

    if (!mongoose.isValidObjectId(courseId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid course ID",
        },
      });
    }

    if (!["approve", "reject"].includes(action)) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Action must be 'approve' or 'reject'",
        },
      });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Course not found",
        },
      });
    }

    if (action === "approve") {
      // Check premium course limit if this course is marked as premium
      const isPremium = course.metadata?.isPremium === true;
      if (isPremium) {
        // Count premium courses excluding the current course
        const premiumCount = await Course.countDocuments({
          "metadata.isPremium": true,
          status: "published",
          _id: { $ne: courseId },
        });
        
        if (premiumCount >= 6) {
          return res.status(422).json({
            error: {
              code: "VALIDATION_ERROR",
              message: "Maximum of 6 premium courses allowed. Please unmark another premium course first.",
            },
          });
        }
      }
      course.status = "published";
    } else {
      course.status = "archived";
    }

    await course.save();

    // Create notification for course instructor (if exists)
    if (course.instructor) {
      try {
        const { createNotification } = await import("../utils/notificationHelper.js");
        await createNotification(
          course.instructor,
          action === "approve" ? "Course Approved" : "Course Rejected",
          action === "approve"
            ? `Your course "${course.title}" has been approved and is now published.`
            : `Your course "${course.title}" has been rejected.`,
          "approval",
          {
            courseId: course._id.toString(),
            action: action,
          },
          `/teacher/courses/${course._id}`
        );
      } catch (notifError) {
        // eslint-disable-next-line no-console
        console.error("[CourseApproval] Error creating notification:", notifError);
      }
    }

    return res.json({
      course,
      message: `Course ${action === "approve" ? "approved" : "rejected"} successfully`,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Approve/Reject Ebook
 */
export const approveEbook = async (req, res, next) => {
  try {
    const { userRole } = req.auth || {};

    if (!req.auth || userRole !== "super-admin") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only super admins can access this endpoint",
        },
      });
    }

    const { ebookId } = req.params;
    const { action } = req.body; // "approve" or "reject"

    if (!mongoose.isValidObjectId(ebookId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid ebook ID",
        },
      });
    }

    if (!["approve", "reject"].includes(action)) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Action must be 'approve' or 'reject'",
        },
      });
    }

    const ebook = await EbookResource.findById(ebookId);
    if (!ebook) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Ebook not found",
        },
      });
    }

    if (action === "approve") {
      ebook.isPublic = true;
      ebook.publishedAt = new Date();
      // Clear rejection status if it exists
      if (ebook.metadata) {
        ebook.metadata.rejected = false;
        ebook.metadata.rejectionReason = null;
        ebook.metadata.rejectedAt = null;
        // Mark metadata as modified for Mongoose to save nested changes
        ebook.markModified("metadata");
      }
    } else {
      // Mark as rejected
      ebook.isPublic = false;
      if (!ebook.metadata) ebook.metadata = {};
      ebook.metadata.rejected = true;
      ebook.metadata.rejectedAt = new Date();
      // Store rejection reason if provided
      if (req.body.rejectionReason) {
        ebook.metadata.rejectionReason = req.body.rejectionReason;
      }
      // Mark metadata as modified for Mongoose to save nested changes
      ebook.markModified("metadata");
    }

    await ebook.save();

    // Create notification for ebook author (if exists)
    if (ebook.createdBy) {
      try {
        const { createNotification } = await import("../utils/notificationHelper.js");
        await createNotification(
          ebook.createdBy,
          action === "approve" ? "Ebook Approved" : "Ebook Rejected",
          action === "approve"
            ? `Your ebook "${ebook.title}" has been approved and is now public.`
            : `Your ebook "${ebook.title}" has been rejected.`,
          "approval",
          {
            ebookId: ebook._id.toString(),
            action: action,
          },
          `/teacher/ebooks/${ebook._id}`
        );
      } catch (notifError) {
        // eslint-disable-next-line no-console
        console.error("[EbookApproval] Error creating notification:", notifError);
      }
    }

    return res.json({
      ebook,
      message: `Ebook ${action === "approve" ? "approved" : "rejected"} successfully`,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Approve/Reject Job Post
 */
export const approveJob = async (req, res, next) => {
  try {
    const { userRole } = req.auth || {};

    if (!req.auth || userRole !== "super-admin") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only super admins can access this endpoint",
        },
      });
    }

    const { jobId } = req.params;
    const { action } = req.body; // "approve" or "reject"

    if (!mongoose.isValidObjectId(jobId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid job ID",
        },
      });
    }

    if (!["approve", "reject"].includes(action)) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Action must be 'approve' or 'reject'",
        },
      });
    }

    const job = await JobPost.findById(jobId);
    if (!job) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Job post not found",
        },
      });
    }

    if (action === "approve") {
      job.status = "published";
      job.publishedAt = new Date();
      
      // Calculate expiration date if not set
      if (!job.expirationDate) {
        const expiresInDays = 30;
        job.expirationDate = new Date();
        job.expirationDate.setDate(job.expirationDate.getDate() + expiresInDays);
      }
    } else {
      job.status = "archived";
    }

    await job.save();

    // Create notification for job owner
    if (job.owner) {
      try {
        const { createNotification } = await import("../utils/notificationHelper.js");
        await createNotification(
          job.owner,
          action === "approve" ? "Job Post Approved" : "Job Post Rejected",
          action === "approve"
            ? `Your job post "${job.title}" has been approved and is now live.`
            : `Your job post "${job.title}" has been rejected.`,
          "approval",
          {
            jobId: job._id.toString(),
            action: action,
          },
          `/jobs/${job._id}`
        );
      } catch (notifError) {
        // eslint-disable-next-line no-console
        console.error("[JobApproval] Error creating notification:", notifError);
      }
    }

    // Create notifications for all students when job is approved
    if (action === "approve") {
      try {
        const User = (await import("../models/User.js")).default;
        const { createBulkNotifications } = await import("../utils/notificationHelper.js");
        
        // Get all active students
        const students = await User.find({ role: "student", isActive: true })
          .select("_id")
          .lean();
        
        if (students.length > 0) {
          const studentIds = students.map((s) => s._id);
          const jobTitle = job.title;
          const companyName = job.company || "A company";
          
          await createBulkNotifications(
            studentIds,
            "New Job Post Available",
            `A new job "${jobTitle}" has been posted by ${companyName}.`,
            "job_post",
            {
              jobId: job._id.toString(),
              jobTitle: jobTitle,
              companyName: companyName,
            },
            `/jobs/${job._id}`
          );
        }
      } catch (notifError) {
        // eslint-disable-next-line no-console
        console.error("[JobApproval] Error creating student notifications:", notifError);
        // Don't fail approval if notification fails
      }
    }

    return res.json({
      job,
      message: `Job post ${action === "approve" ? "approved" : "rejected"} successfully`,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Approve/Reject Teacher Application
 */
export const approveTeacher = async (req, res, next) => {
  try {
    const { userRole } = req.auth || {};

    if (!req.auth || userRole !== "super-admin") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only super admins can access this endpoint",
        },
      });
    }

    const { userId } = req.params;
    const { action } = req.body; // "approve" or "reject"

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid user ID",
        },
      });
    }

    if (!["approve", "reject"].includes(action)) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Action must be 'approve' or 'reject'",
        },
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "User not found",
        },
      });
    }

    if (user.role !== "teacher") {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "User is not a teacher",
        },
      });
    }

    if (action === "approve") {
      user.isActive = true;
    } else {
      user.isActive = false;
    }

    await user.save();

    // Create notification for teacher
    try {
      const { createNotification } = await import("../utils/notificationHelper.js");
      await createNotification(
        userId,
        action === "approve" ? "Teacher Application Approved" : "Teacher Application Rejected",
        action === "approve"
          ? "Your teacher application has been approved. You can now access the teacher dashboard."
          : "Your teacher application has been rejected.",
        "approval",
        {
          userId: userId,
          action: action,
        },
        action === "approve" ? "/teacher/dashboard" : null
      );
    } catch (notifError) {
      // eslint-disable-next-line no-console
      console.error("[TeacherApproval] Error creating notification:", notifError);
    }

    return res.json({
      user: await User.findById(userId).select("-passwordHash").lean(),
      message: `Teacher ${action === "approve" ? "approved" : "rejected"} successfully`,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Approve/Reject Student Application
 */
export const approveStudent = async (req, res, next) => {
  try {
    const { userRole } = req.auth || {};

    if (!req.auth || userRole !== "super-admin") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only super admins can access this endpoint",
        },
      });
    }

    const { userId } = req.params;
    const { action } = req.body; // "approve" or "reject"

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid user ID",
        },
      });
    }

    if (!["approve", "reject"].includes(action)) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Action must be 'approve' or 'reject'",
        },
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "User not found",
        },
      });
    }

    if (user.role !== "student") {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "User is not a student",
        },
      });
    }

    if (action === "approve") {
      user.isActive = true;
    } else {
      user.isActive = false;
    }

    await user.save();

    // Create notification for student
    try {
      const { createNotification } = await import("../utils/notificationHelper.js");
      await createNotification(
        userId,
        action === "approve" ? "Student Application Approved" : "Student Application Rejected",
        action === "approve"
          ? "Your student application has been approved. You can now access all student features."
          : "Your student application has been rejected.",
        "approval",
        {
          userId: userId,
          action: action,
        },
        action === "approve" ? "/student/dashboard" : null
      );
    } catch (notifError) {
      // eslint-disable-next-line no-console
      console.error("[StudentApproval] Error creating notification:", notifError);
    }

    return res.json({
      user: await User.findById(userId).select("-passwordHash").lean(),
      message: `Student ${action === "approve" ? "approved" : "rejected"} successfully`,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Approve/Reject Recruiter Application
 */
export const approveRecruiter = async (req, res, next) => {
  try {
    const { userRole } = req.auth || {};

    if (!req.auth || userRole !== "super-admin") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only super admins can access this endpoint",
        },
      });
    }

    const { userId } = req.params;
    const { action } = req.body; // "approve" or "reject"

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid user ID",
        },
      });
    }

    if (!["approve", "reject"].includes(action)) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Action must be 'approve' or 'reject'",
        },
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "User not found",
        },
      });
    }

    if (user.role !== "recruiter") {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "User is not a recruiter",
        },
      });
    }

    if (action === "approve") {
      user.isActive = true;
    } else {
      user.isActive = false;
    }

    await user.save();

    // Create notification for recruiter
    try {
      const { createNotification } = await import("../utils/notificationHelper.js");
      await createNotification(
        userId,
        action === "approve" ? "Recruiter Application Approved" : "Recruiter Application Rejected",
        action === "approve"
          ? "Your recruiter application has been approved. You can now access the recruiter dashboard."
          : "Your recruiter application has been rejected.",
        "approval",
        {
          userId: userId,
          action: action,
        },
        action === "approve" ? "/recruiter/dashboard" : null
      );
    } catch (notifError) {
      // eslint-disable-next-line no-console
      console.error("[RecruiterApproval] Error creating notification:", notifError);
    }

    return res.json({
      user: await User.findById(userId).select("-passwordHash").lean(),
      message: `Recruiter ${action === "approve" ? "approved" : "rejected"} successfully`,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Super Admin: Create Course
 */
export const createCourse = async (req, res, next) => {
  try {
    const { userRole, userId } = req.auth || {};

    if (!req.auth || userRole !== "super-admin") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only super admins can access this endpoint",
        },
      });
    }

    const {
      title,
      subtitle,
      description,
      category,
      difficulty,
      price,
      discountPrice,
      language,
      deliveryMode,
      duration,
      lessonCount,
      learningOutcomes,
      requirements,
      coverImage,
      introVideoUrl,
      syllabus,
      tags,
      thumbnailUrl,
      currency = "AED",
      status = "published",
      isPremium = false,
    } = req.body;

    if (!title) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Title is required",
        },
      });
    }

    if (!description || description.length < 60) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Description is required (minimum 60 characters)",
        },
      });
    }

    // Allow price to be 0 for free courses
    if (price === undefined || price === null || price === "" || isNaN(Number(price))) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Valid price is required (use 0 for free courses)",
        },
      });
    }

    // Check premium course limit (max 6)
    const isPremiumValue = isPremium === true || isPremium === "true";
    if (isPremiumValue) {
      const premiumCount = await Course.countDocuments({
        "metadata.isPremium": true,
        status: "published",
      });
      
      if (premiumCount >= 6) {
        return res.status(422).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Maximum of 6 premium courses allowed. Please unmark another premium course first.",
          },
        });
      }
    }

    // Normalize URLs before storing
    const normalizedThumbnailUrl = normalizeUrl(coverImage || thumbnailUrl || "") || coverImage || thumbnailUrl || "";
    const normalizedIntroVideoUrl = normalizeUrl(introVideoUrl || "") || introVideoUrl || "";

    const course = await Course.create({
      title,
      description,
      category: category || "Uncategorised",
      duration: duration ? parseFloat(duration) : 0,
      price: Number(price),
      currency: currency || "AED",
      thumbnailUrl: normalizedThumbnailUrl,
      status,
      instructor: userId, // Super admin as instructor
      metadata: {
        subtitle: subtitle || "",
        difficulty: difficulty || "Intermediate",
        discountPrice: discountPrice ? Number(discountPrice) : null,
        language: language || "English",
        deliveryMode: deliveryMode || "Live cohort",
        lessonCount: lessonCount || "",
        learningOutcomes: learningOutcomes || "",
        requirements: requirements || "",
        introVideoUrl: normalizedIntroVideoUrl,
        syllabus: syllabus || "",
        tags: tags ? (Array.isArray(tags) ? tags : tags.split(",").map((t) => t.trim()).filter(Boolean)) : [],
        isPremium: isPremium === true || isPremium === "true",
      },
    });

    const populatedCourse = await Course.findById(course._id)
      .populate("instructor", "fullName email")
      .lean();

    return res.status(201).json({ course: populatedCourse });
  } catch (error) {
    return next(error);
  }
};

/**
 * Super Admin: Get Course by ID
 */
export const getAdminCourseById = async (req, res, next) => {
  try {
    const { userId, userRole } = req.auth || {};

    if (!userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    if (userRole !== "super-admin") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only super admins can access this endpoint",
        },
      });
    }

    const { courseId } = req.params;

    if (!mongoose.isValidObjectId(courseId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid course ID",
        },
      });
    }

    const instructorObjectId = mongoose.isValidObjectId(userId)
      ? new mongoose.Types.ObjectId(userId)
      : null;

    const course = await Course.findOne({
      _id: courseId,
      instructor: instructorObjectId,
    })
      .populate("instructor", "fullName email")
      .lean();

    if (!course) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Course not found or you don't have permission to view it",
        },
      });
    }

    return res.status(200).json({ course });
  } catch (error) {
    return next(error);
  }
};

/**
 * Super Admin: Update Course
 */
export const updateAdminCourse = async (req, res, next) => {
  try {
    const { userId, userRole } = req.auth || {};

    if (!userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    if (userRole !== "super-admin") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only super admins can update courses",
        },
      });
    }

    const { courseId } = req.params;

    if (!mongoose.isValidObjectId(courseId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid course ID",
        },
      });
    }

    const instructorObjectId = mongoose.isValidObjectId(userId)
      ? new mongoose.Types.ObjectId(userId)
      : null;

    const course = await Course.findOne({
      _id: courseId,
      instructor: instructorObjectId,
    });

    if (!course) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Course not found or you don't have permission to edit it",
        },
      });
    }

    // Allow updating courses in any status (draft, pending, published)
    // Super admins can update their courses even after publishing

    const {
      title,
      subtitle,
      description,
      category,
      difficulty,
      price,
      discountPrice,
      language,
      deliveryMode,
      duration,
      lessonCount,
      learningOutcomes,
      requirements,
      coverImage,
      introVideoUrl,
      syllabus,
      tags,
      status,
      isPremium,
    } = req.body;

    if (title) course.title = title;
    if (description) course.description = description;
    if (category) course.category = category;
    if (duration !== undefined) course.duration = parseFloat(duration) || 0;
    if (price !== undefined) course.price = Number(price);
    if (coverImage !== undefined) course.thumbnailUrl = normalizeUrl(coverImage) || coverImage;
    if (req.body.brochureUrl !== undefined) course.brochureUrl = normalizeUrl(req.body.brochureUrl) || req.body.brochureUrl;
    if (status !== undefined) course.status = status;

    // Update metadata
    if (!course.metadata) course.metadata = {};
    if (subtitle !== undefined) course.metadata.subtitle = subtitle;
    if (difficulty !== undefined) course.metadata.difficulty = difficulty;
    if (discountPrice !== undefined) course.metadata.discountPrice = discountPrice ? Number(discountPrice) : null;
    if (language !== undefined) course.metadata.language = language;
    if (deliveryMode !== undefined) course.metadata.deliveryMode = deliveryMode;
    if (lessonCount !== undefined) course.metadata.lessonCount = lessonCount;
    if (learningOutcomes !== undefined) course.metadata.learningOutcomes = learningOutcomes;
    if (requirements !== undefined) course.metadata.requirements = requirements;
    if (introVideoUrl !== undefined) course.metadata.introVideoUrl = normalizeUrl(introVideoUrl) || introVideoUrl;
    if (syllabus !== undefined) course.metadata.syllabus = syllabus;
    if (tags !== undefined) {
      course.metadata.tags = Array.isArray(tags) ? tags : tags.split(",").map((t) => t.trim()).filter(Boolean);
    }
    if (isPremium !== undefined) {
      const isPremiumValue = isPremium === true || isPremium === "true";
      
      // Check premium course limit (max 6) only if setting to premium
      if (isPremiumValue) {
        const premiumCount = await Course.countDocuments({
          "metadata.isPremium": true,
          status: "published",
          _id: { $ne: course._id }, // Exclude current course
        });
        
        if (premiumCount >= 6) {
          return res.status(422).json({
            error: {
              code: "VALIDATION_ERROR",
              message: "Maximum of 6 premium courses allowed. Please unmark another premium course first.",
            },
          });
        }
      }
      
      course.metadata.isPremium = isPremiumValue;
    }

    await course.save();

    const populatedCourse = await Course.findById(course._id)
      .populate("instructor", "fullName email")
      .lean();

    return res.status(200).json({ course: populatedCourse });
  } catch (error) {
    return next(error);
  }
};

/**
 * Super Admin: Upload Course Brochure PDF
 */
export const uploadAdminCourseBrochure = async (req, res, next) => {
  try {
    const { userId, userRole } = req.auth || {};

    if (!userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    if (userRole !== "super-admin") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only super admins can upload brochures",
        },
      });
    }

    const { courseId } = req.params;

    if (!mongoose.isValidObjectId(courseId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid course ID",
        },
      });
    }

    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Course not found",
        },
      });
    }

    // Verify that the course was created by a super admin (instructor is the admin)
    if (course.instructor.toString() !== userId) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "You can only upload brochures for courses you created",
        },
      });
    }

    if (!req.file) {
      return res.status(400).json({
        error: {
          code: "FILE_REQUIRED",
          message: "No PDF file uploaded",
        },
      });
    }

    // Save PDF to local storage
    const uploadResult = await uploadPdfToCloudinary(
      req.file.buffer,
      `digital-aela/courses/${courseId}/brochures`,
      req.file.originalname
    );

    // Update course with brochure URL
    course.brochureUrl = uploadResult.url;
    await course.save();

    const populatedCourse = await Course.findById(course._id)
      .populate("instructor", "fullName email")
      .lean();

    return res.status(200).json({
      message: "Brochure uploaded successfully",
      course: populatedCourse,
      brochureUrl: uploadResult.url,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Super Admin: Create Ebook
 */
export const createEbook = async (req, res, next) => {
  try {
    const { userRole, userId } = req.auth || {};

    if (!req.auth || userRole !== "super-admin") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only super admins can access this endpoint",
        },
      });
    }

    const {
      title,
      subtitle,
      description,
      price,
      category,
      coverImage,
      previewUrl,
      tags,
      downloadUrl,
      pages,
      categories,
      isPublic = true,
      isFeatured = false,
      bookType,
    } = req.body;

    if (!title) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Title is required",
        },
      });
    }

    if (!description || description.length < 40) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Description is required (minimum 40 characters)",
        },
      });
    }

    if (!pages || pages <= 0) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Number of pages is required and must be greater than 0",
        },
      });
    }

    // Determine book type (default to "ebook" for backward compatibility)
    // Handle both string and boolean comparisons, and check req.body directly as fallback
    const receivedBookType = (bookType || req.body?.bookType || "").toString().trim().toLowerCase();
    const isPhysicalBook = receivedBookType === "physical" || receivedBookType === "physical-book";
    
    // Debug logging (can be removed in production)
    console.log("[createEbook] Book type check:", {
      bookType,
      receivedBookType,
      isPhysicalBook,
      hasFile: !!req.file,
      downloadUrl: downloadUrl ? "provided" : "not provided",
    });

    // Handle PDF file upload if provided (only for e-books)
    let finalDownloadUrl = downloadUrl;
    if (req.file) {
      if (isPhysicalBook) {
        return res.status(422).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "PDF file upload is not allowed for physical books",
          },
        });
      }
      // Save PDF to local storage
      const uploadResult = await uploadPdfToCloudinary(
        req.file.buffer,
        `digital-aela/ebooks/admin/${userId}`,
        req.file.originalname
      );
      finalDownloadUrl = uploadResult.url;
    } else if (downloadUrl) {
      // Only validate downloadUrl for e-books
      if (!isPhysicalBook) {
        // Validate that downloadUrl is a PDF, not an image
        const urlLower = downloadUrl.toLowerCase();
        const urlPath = urlLower.split('?')[0].split('#')[0];
        const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
        const isImageUrl = imageExtensions.some(ext => urlPath.endsWith(ext));
        const isCoverImagePath = urlLower.includes('/books/covers/') || urlLower.includes('/covers/');
        
        if (isImageUrl || isCoverImagePath) {
          return res.status(422).json({
            error: {
              code: "VALIDATION_ERROR",
              message: "Download URL must point to a PDF file, not an image. Please provide a valid PDF URL or upload a PDF file.",
            },
          });
        }
        
        // Check if URL ends with .pdf or is a Cloudinary raw resource
        if (!urlPath.endsWith('.pdf') && !urlLower.includes('/raw/upload/')) {
          return res.status(422).json({
            error: {
              code: "VALIDATION_ERROR",
              message: "Download URL must point to a PDF file. Please provide a valid PDF URL or upload a PDF file.",
            },
          });
        }
      }
    }

    // Only require PDF/downloadUrl for e-books, not physical books
    // IMPORTANT: This check must come AFTER handling file uploads and downloadUrl validation
    if (!isPhysicalBook && !finalDownloadUrl) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "PDF file or download URL is required for e-books",
        },
      });
    }

    // For physical books, use a placeholder or empty string for downloadUrl
    // (since the model requires it, we'll use a placeholder that indicates it's a physical book)
    if (isPhysicalBook && !finalDownloadUrl) {
      finalDownloadUrl = "physical-book"; // Placeholder to satisfy model requirement
    }

    // Check featured book limit (max 4)
    const isFeaturedValue = isFeatured === true || isFeatured === "true";
    if (isFeaturedValue) {
      const featuredCount = await EbookResource.countDocuments({
        "metadata.isFeatured": true,
        isPublic: true,
      });
      
      if (featuredCount >= 4) {
        return res.status(422).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Maximum of 4 featured books allowed. Please unmark another featured book first.",
          },
        });
      }
    }

    const priceValue = price ? Number(price) : 0;
    const isFree = priceValue === 0;

    const ebook = await EbookResource.create({
      title,
      description,
      pages: Number(pages),
      downloadUrl: finalDownloadUrl,
      categories: category ? [category] : categories || [],
      isPublic,
      publishedAt: isPublic ? new Date() : null,
      metadata: {
        subtitle: subtitle || "",
        price: priceValue,
        isFree: isFree, // Mark as free if price is 0
        coverImage: coverImage || "",
        previewUrl: previewUrl || "",
        author: "Digital AELA",
        bookType: bookType || "ebook", // Store book type (ebook or physical)
        tags: tags
          ? Array.isArray(tags)
            ? tags
            : tags.split(",").map((t) => t.trim()).filter(Boolean)
          : [],
        isFeatured: isFeaturedValue,
      },
    });

    return res.status(201).json({ ebook });
  } catch (error) {
    return next(error);
  }
};

/**
 * Super Admin: Create Blog
 */
export const createBlog = async (req, res, next) => {
  try {
    const { userRole, userId } = req.auth || {};

    if (!req.auth || userRole !== "super-admin") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only super admins can access this endpoint",
        },
      });
    }

    const { title, excerpt, content, coverImage, status = "published" } = req.body;

    if (!title || !content) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Title and content are required",
        },
      });
    }

    const blog = await RecruiterBlog.create({
      author: userId,
      title,
      excerpt,
      content,
      coverImage,
      status,
      publishedAt: status === "published" ? new Date() : null,
    });

    const populatedBlog = await RecruiterBlog.findById(blog._id)
      .populate("author", "fullName email")
      .lean();

    return res.status(201).json({ blog: populatedBlog });
  } catch (error) {
    return next(error);
  }
};

