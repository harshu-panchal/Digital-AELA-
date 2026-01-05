import Course from "../models/Course.js";
import mongoose from "mongoose";

/**
 * Normalize URLs in course data
 * Fixes malformed URLs like "https://static/..." to proper "/static/..." format
 */
const normalizeCourseUrls = async (course) => {
  const { normalizeUrl } = await import("../utils/urlNormalizer.js");

  if (course.thumbnailUrl) {
    course.thumbnailUrl = normalizeUrl(course.thumbnailUrl) || course.thumbnailUrl;
  }
  if (course.brochureUrl) {
    course.brochureUrl = normalizeUrl(course.brochureUrl) || course.brochureUrl;
  }
  if (course.metadata?.introVideoUrl) {
    course.metadata.introVideoUrl = normalizeUrl(course.metadata.introVideoUrl) || course.metadata.introVideoUrl;
  }

  return course;
};

/**
 * Normalize URLs in multiple courses
 */
const normalizeCoursesUrls = async (courses) => {
  const { normalizeUrl } = await import("../utils/urlNormalizer.js");

  return courses.map(course => {
    if (course.thumbnailUrl) {
      course.thumbnailUrl = normalizeUrl(course.thumbnailUrl) || course.thumbnailUrl;
    }
    if (course.brochureUrl) {
      course.brochureUrl = normalizeUrl(course.brochureUrl) || course.brochureUrl;
    }
    if (course.metadata?.introVideoUrl) {
      course.metadata.introVideoUrl = normalizeUrl(course.metadata.introVideoUrl) || course.metadata.introVideoUrl;
    }
    return course;
  });
};

/**
 * Get all published courses (public endpoint)
 * Only returns courses with status "published"
 * Supports query parameter: ?premium=true to get only premium courses
 */
export const getPublishedCourses = async (req, res, next) => {
  try {
    const { premium, category, page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10))); // Max 100 per page
    const skip = (pageNum - 1) * limitNum;

    // Build query - always filter for published courses only
    const query = { status: "published" };

    // If premium=true, filter for premium courses
    if (premium === "true" || premium === true) {
      query["metadata.isPremium"] = true;
    }

    // Filter by category if provided
    if (category) {
      // Support both direct category field and metadata.category
      query.$or = [
        { category: { $regex: new RegExp(`^${category}$`, "i") } },
        { "metadata.category": { $regex: new RegExp(`^${category}$`, "i") } },
      ];
    }

    // Fetch courses and total count in parallel
    const [courses, total] = await Promise.all([
      Course.find(query)
        .populate("instructor", "fullName email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Course.countDocuments(query),
    ]);

    // Normalize URLs in all courses before returning
    const normalizedCourses = await normalizeCoursesUrls(courses);

    return res.status(200).json({
      courses: normalizedCourses,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
        hasMore: skip + courses.length < total,
      },
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get premium course count (for admin use)
 * Returns the count of published premium courses
 */
export const getPremiumCourseCount = async (req, res, next) => {
  try {
    const count = await Course.countDocuments({
      "metadata.isPremium": true,
      status: "published",
    });

    return res.status(200).json({ count, maxAllowed: 6 });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get a single course by ID (public endpoint)
 * Only returns if course is published
 */
export const getCourseById = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    let query;

    if (mongoose.isValidObjectId(courseId)) {
      query = { _id: courseId, status: "published" };
    } else {
      // Try to find by slug
      query = { slug: courseId, status: "published" };
    }

    const course = await Course.findOne(query)
      .populate("instructor", "fullName email")
      .lean();

    if (!course) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Course not found or not published",
        },
      });
    }

    // Normalize URLs in course before returning
    const normalizedCourse = await normalizeCourseUrls(course);

    return res.status(200).json({ course: normalizedCourse });
  } catch (error) {
    return next(error);
  }
};

