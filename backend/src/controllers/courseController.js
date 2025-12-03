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
    const { premium } = req.query;
    
    // Build query - always filter for published courses only
    const query = { status: "published" };
    
    // If premium=true, filter for premium courses
    if (premium === "true" || premium === true) {
      query["metadata.isPremium"] = true;
    }
    
    // Always filter for published courses only - never return draft or archived
    const courses = await Course.find(query)
      .populate("instructor", "fullName email")
      .sort({ createdAt: -1 })
      .lean();

    // Normalize URLs in all courses before returning
    const normalizedCourses = await normalizeCoursesUrls(courses);

    return res.status(200).json({ courses: normalizedCourses });
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

    if (!mongoose.isValidObjectId(courseId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid course ID",
        },
      });
    }

    const course = await Course.findOne({ _id: courseId, status: "published" })
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

