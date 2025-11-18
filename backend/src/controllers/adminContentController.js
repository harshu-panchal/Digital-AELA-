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

    const course = await Course.create({
      title,
      description,
      category: category || "Uncategorised",
      duration: duration ? parseFloat(duration) : 0,
      price: Number(price),
      currency: currency || "AED",
      thumbnailUrl: coverImage || thumbnailUrl || "",
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
        introVideoUrl: introVideoUrl || "",
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

    if (!downloadUrl) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Download URL is required",
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

    const ebook = await EbookResource.create({
      title,
      description,
      pages: Number(pages),
      downloadUrl,
      categories: category ? [category] : categories || [],
      isPublic,
      publishedAt: isPublic ? new Date() : null,
      metadata: {
        subtitle: subtitle || "",
        price: price ? Number(price) : 0,
        coverImage: coverImage || "",
        previewUrl: previewUrl || "",
        author: "Digital AELA",
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

