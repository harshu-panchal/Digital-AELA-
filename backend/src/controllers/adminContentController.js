import mongoose from "mongoose";
import Course from "../models/Course.js";
import EbookResource from "../models/EbookResource.js";
import JobPost from "../models/JobPost.js";
import User from "../models/User.js";
import RecruiterBlog from "../models/RecruiterBlog.js";

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
      course.status = "published";
    } else {
      course.status = "archived";
    }

    await course.save();

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
    } else {
      ebook.isPublic = false;
    }

    await ebook.save();

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
    } else {
      job.status = "archived";
    }

    await job.save();

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

    return res.json({
      user: await User.findById(userId).select("-passwordHash").lean(),
      message: `Teacher ${action === "approve" ? "approved" : "rejected"} successfully`,
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

    const { title, description, category, duration, price, currency, thumbnailUrl, status = "published" } = req.body;

    if (!title) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Title is required",
        },
      });
    }

    const course = await Course.create({
      title,
      description,
      category,
      duration: duration || 0,
      price: price || 0,
      currency: currency || "AED",
      thumbnailUrl,
      status,
      instructor: userId, // Super admin as instructor
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
 * Super Admin: Create Ebook
 */
export const createEbook = async (req, res, next) => {
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

    const { title, description, pages, downloadUrl, categories, isPublic = true } = req.body;

    if (!title || !downloadUrl) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Title and downloadUrl are required",
        },
      });
    }

    const ebook = await EbookResource.create({
      title,
      description,
      pages,
      downloadUrl,
      categories: categories || [],
      isPublic,
      publishedAt: isPublic ? new Date() : null,
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

