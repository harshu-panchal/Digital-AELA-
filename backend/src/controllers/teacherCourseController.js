import Course from "../models/Course.js";
import mongoose from "mongoose";

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

    if (!price || isNaN(Number(price))) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Valid price is required",
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

    if (userRole !== "teacher") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only teachers can access this endpoint",
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

    const courses = await Course.find({ instructor: instructorObjectId })
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

    if (userRole !== "teacher") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only teachers can access this endpoint",
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

    // Only allow updating if course is still in draft
    if (course.status !== "draft") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only draft courses can be updated",
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

    if (title) course.title = title;
    if (description) course.description = description;
    if (category) course.category = category;
    if (duration !== undefined) course.duration = parseFloat(duration) || 0;
    if (price !== undefined) course.price = Number(price);
    if (coverImage !== undefined) course.thumbnailUrl = coverImage;

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

