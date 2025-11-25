import Course from "../models/Course.js";
import mongoose from "mongoose";
import { uploadPdfToCloudinary } from "../middleware/uploadMiddleware.js";

/**
 * Teacher: Create Course (with draft status)
 */
export const createTeacherCourse = async (req, res, next) => {
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

    if (userRole !== "teacher") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only teachers can create courses",
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

    const instructorObjectId = mongoose.isValidObjectId(userId)
      ? new mongoose.Types.ObjectId(userId)
      : null;

    if (!instructorObjectId) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid user ID",
        },
      });
    }

    // Create course with draft status (requires admin approval)
    const course = await Course.create({
      title,
      description,
      category: category || "Uncategorised",
      duration: duration ? parseFloat(duration) : 0,
      price: Number(price),
      currency: "AED",
      thumbnailUrl: coverImage || "",
      brochureUrl: "", // Will be set if brochure is uploaded
      status: "draft", // Always draft for teacher-created courses
      instructor: instructorObjectId,
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
        tags: tags ? (Array.isArray(tags) ? tags : tags.split(",").map((t) => t.trim())) : [],
      },
    });

    const populatedCourse = await Course.findById(course._id)
      .populate("instructor", "fullName email")
      .lean();

    // Create notification for super admin when course needs approval
    if (course.status === "draft") {
      try {
        const User = (await import("../models/User.js")).default;
        const { createBulkNotifications } = await import("../utils/notificationHelper.js");
        
        // Get all super-admin users
        const superAdmins = await User.find({ role: "super-admin", isActive: true })
          .select("_id")
          .lean();
        
        if (superAdmins.length > 0) {
          const adminIds = superAdmins.map((admin) => admin._id);
          const instructorName = populatedCourse.instructor?.fullName || "A teacher";
          
          await createBulkNotifications(
            adminIds,
            "New Course Pending Approval",
            `A new course "${course.title}" has been created by ${instructorName} and requires approval.`,
            "approval",
            {
              courseId: course._id.toString(),
              courseTitle: course.title,
              instructorId: userId,
              instructorName: instructorName,
              contentType: "course",
            },
            `/super-admin/content-management?type=course&id=${course._id}`
          );
        }
      } catch (notifError) {
        // eslint-disable-next-line no-console
        console.error("[CourseCreation] Error creating approval notification:", notifError);
        // Don't fail course creation if notification fails
      }
    }

    return res.status(201).json({ course: populatedCourse });
  } catch (error) {
    return next(error);
  }
};

/**
 * Teacher: Get My Courses
 */
export const getTeacherCourses = async (req, res, next) => {
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

    if (userRole !== "teacher" && userRole !== "super-admin") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only teachers and super admins can access this endpoint",
        },
      });
    }

    const instructorObjectId = mongoose.isValidObjectId(userId)
      ? new mongoose.Types.ObjectId(userId)
      : null;

    if (!instructorObjectId) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid user ID",
        },
      });
    }

    // Super-admin can see all courses, teachers only see their own
    const courseQuery = userRole === "super-admin" 
      ? {} 
      : { instructor: instructorObjectId };

    const courses = await Course.find(courseQuery)
      .populate("instructor", "fullName email")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({ courses });
  } catch (error) {
    return next(error);
  }
};

/**
 * Teacher: Get Course by ID
 */
export const getTeacherCourseById = async (req, res, next) => {
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

    if (userRole !== "teacher" && userRole !== "super-admin") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only teachers and super admins can access this endpoint",
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

    // Super-admin can view any course, teachers only their own
    const courseQuery = userRole === "super-admin"
      ? { _id: courseId }
      : { _id: courseId, instructor: instructorObjectId };

    const course = await Course.findOne(courseQuery)
      .populate("instructor", "fullName email")
      .lean();

    if (!course) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Course not found",
        },
      });
    }

    return res.status(200).json({ course });
  } catch (error) {
    return next(error);
  }
};

/**
 * Teacher: Update Course
 */
export const updateTeacherCourse = async (req, res, next) => {
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

    if (userRole !== "teacher") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only teachers can update courses",
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
          message: "Course not found",
        },
      });
    }

    // Allow updating courses in any status (draft, pending, published)
    // Teachers can update their courses even after publishing

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
    } = req.body;

    if (title) course.title = title;
    if (description) course.description = description;
    if (category) course.category = category;
    if (duration !== undefined) course.duration = parseFloat(duration) || 0;
    if (price !== undefined) course.price = Number(price);
    if (coverImage !== undefined) course.thumbnailUrl = coverImage;
    if (req.body.brochureUrl !== undefined) course.brochureUrl = req.body.brochureUrl;

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
    if (introVideoUrl !== undefined) course.metadata.introVideoUrl = introVideoUrl;
    if (syllabus !== undefined) course.metadata.syllabus = syllabus;
    if (tags !== undefined) {
      course.metadata.tags = Array.isArray(tags) ? tags : tags.split(",").map((t) => t.trim());
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
 * Teacher: Delete Course
 * DELETE /api/v1/teacher/courses/:courseId
 */
export const deleteTeacherCourse = async (req, res, next) => {
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

    if (userRole !== "teacher") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only teachers can delete courses",
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
          message: "Course not found",
        },
      });
    }

    // Teachers can delete their courses regardless of status
    await Course.findByIdAndDelete(courseId);

    return res.status(200).json({
      message: "Course deleted successfully",
      courseId: courseId,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Teacher: Upload Course Brochure PDF
 */
/**
 * Bulk operations for course management
 * POST /api/v1/teacher/courses/bulk
 */
export const bulkCourseOperations = async (req, res, next) => {
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

    if (userRole !== "teacher") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only teachers can perform bulk operations",
        },
      });
    }

    const { operation, courseIds } = req.body;

    if (!operation || !Array.isArray(courseIds) || courseIds.length === 0) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Operation and courseIds array are required",
        },
      });
    }

    const instructorObjectId = mongoose.isValidObjectId(userId)
      ? new mongoose.Types.ObjectId(userId)
      : null;

    if (!instructorObjectId) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid user ID",
        },
      });
    }

    // Validate course IDs
    const validCourseIds = courseIds
      .filter((id) => mongoose.isValidObjectId(id))
      .map((id) => new mongoose.Types.ObjectId(id));

    if (validCourseIds.length === 0) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "No valid course IDs provided",
        },
      });
    }

    // Verify all courses belong to this teacher
    const courses = await Course.find({
      _id: { $in: validCourseIds },
      instructor: instructorObjectId,
    });

    if (courses.length !== validCourseIds.length) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Some courses not found or you don't have permission",
        },
      });
    }

    let result;
    const updatedCourses = [];

    switch (operation) {
      case "delete":
        // Bulk delete courses (any status)
        await Course.deleteMany({ _id: { $in: validCourseIds } });
        result = {
          operation: "delete",
          deleted: courses.length,
          courseIds: courses.map((c) => c._id.toString()),
        };
        break;

      case "publish":
        // Bulk publish courses (change status to pending for admin approval)
        await Course.updateMany(
          { _id: { $in: validCourseIds } },
          { $set: { status: "pending" } }
        );
        result = {
          operation: "publish",
          updated: validCourseIds.length,
          courseIds: validCourseIds.map((id) => id.toString()),
        };
        break;

      case "unpublish":
        // Bulk unpublish courses (change status to draft)
        await Course.updateMany(
          { _id: { $in: validCourseIds } },
          { $set: { status: "draft" } }
        );
        result = {
          operation: "unpublish",
          updated: validCourseIds.length,
          courseIds: validCourseIds.map((id) => id.toString()),
        };
        break;

      case "updateStatus":
        // Bulk update status
        const { status } = req.body;
        if (!status || !["draft", "pending", "published"].includes(status)) {
          return res.status(422).json({
            error: {
              code: "VALIDATION_ERROR",
              message: "Valid status is required (draft, pending, published)",
            },
          });
        }
        await Course.updateMany(
          { _id: { $in: validCourseIds } },
          { $set: { status } }
        );
        result = {
          operation: "updateStatus",
          updated: validCourseIds.length,
          status,
          courseIds: validCourseIds.map((id) => id.toString()),
        };
        break;

      case "updateCategory":
        // Bulk update category
        const { category } = req.body;
        if (!category) {
          return res.status(422).json({
            error: {
              code: "VALIDATION_ERROR",
              message: "Category is required",
            },
          });
        }
        await Course.updateMany(
          { _id: { $in: validCourseIds } },
          { $set: { category } }
        );
        result = {
          operation: "updateCategory",
          updated: validCourseIds.length,
          category,
          courseIds: validCourseIds.map((id) => id.toString()),
        };
        break;

      default:
        return res.status(422).json({
          error: {
            code: "VALIDATION_ERROR",
            message: `Invalid operation: ${operation}. Supported: delete, publish, unpublish, updateStatus, updateCategory`,
          },
        });
    }

    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

export const uploadCourseBrochure = async (req, res, next) => {
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

    if (userRole !== "teacher") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only teachers can upload brochures",
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
          message: "Course not found",
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

    // Upload PDF to Cloudinary
    const uploadResult = await uploadPdfToCloudinary(
      req.file.buffer,
      `digital-aela/courses/${courseId}/brochures`
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

