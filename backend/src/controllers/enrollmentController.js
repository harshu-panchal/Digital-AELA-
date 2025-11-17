import Enrollment from "../models/Enrollment.js";
import Course from "../models/Course.js";
import mongoose from "mongoose";

/**
 * Enroll a student in a course
 * POST /api/v1/courses/:courseId/enroll
 */
export const enrollInCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { userId } = req.auth; // From auth middleware

    if (!mongoose.isValidObjectId(courseId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid course ID",
        },
      });
    }

    // Check if course exists and is published
    const course = await Course.findOne({ _id: courseId, status: "published" });
    if (!course) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Course not found or not available for enrollment",
        },
      });
    }

    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({
      student: userId,
      course: courseId,
    });

    if (existingEnrollment) {
      return res.status(409).json({
        error: {
          code: "ALREADY_ENROLLED",
          message: "You are already enrolled in this course",
        },
        enrollment: existingEnrollment,
      });
    }

    // Create new enrollment
    const enrollment = await Enrollment.create({
      student: userId,
      course: courseId,
      status: "active",
      enrolledAt: new Date(),
      lastAccessedAt: new Date(),
    });

    // Populate course and student details
    await enrollment.populate("course", "title description instructor category duration price thumbnailUrl");
    await enrollment.populate("student", "fullName email");

    return res.status(201).json({
      message: "Successfully enrolled in course",
      enrollment,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get all courses enrolled by the authenticated student
 * GET /api/v1/courses/enrolled
 */
export const getEnrolledCourses = async (req, res, next) => {
  try {
    const { userId } = req.auth;
    const { status, page = 1, pageSize = 10 } = req.query;

    const query = { student: userId };
    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    const limit = parseInt(pageSize);

    const enrollments = await Enrollment.find(query)
      .populate("course", "title description instructor category duration price thumbnailUrl status")
      .populate("student", "fullName email")
      .sort({ enrolledAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Enrollment.countDocuments(query);

    return res.status(200).json({
      enrollments,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total,
        totalPages: Math.ceil(total / parseInt(pageSize)),
      },
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get enrollment status for a specific course
 * GET /api/v1/courses/:courseId/enrollment
 */
export const getEnrollmentStatus = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { userId } = req.auth;

    if (!mongoose.isValidObjectId(courseId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid course ID",
        },
      });
    }

    const enrollment = await Enrollment.findOne({
      student: userId,
      course: courseId,
    })
      .populate("course", "title description instructor category duration price thumbnailUrl")
      .lean();

    if (!enrollment) {
      return res.status(404).json({
        error: {
          code: "NOT_ENROLLED",
          message: "You are not enrolled in this course",
        },
        enrolled: false,
      });
    }

    return res.status(200).json({
      enrolled: true,
      enrollment,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Unenroll from a course
 * DELETE /api/v1/courses/:courseId/enroll
 */
export const unenrollFromCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { userId } = req.auth;

    if (!mongoose.isValidObjectId(courseId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid course ID",
        },
      });
    }

    const enrollment = await Enrollment.findOneAndDelete({
      student: userId,
      course: courseId,
    });

    if (!enrollment) {
      return res.status(404).json({
        error: {
          code: "NOT_ENROLLED",
          message: "You are not enrolled in this course",
        },
      });
    }

    return res.status(200).json({
      message: "Successfully unenrolled from course",
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Update enrollment status (e.g., pause, resume)
 * PATCH /api/v1/courses/:courseId/enrollment
 */
export const updateEnrollmentStatus = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { userId } = req.auth;
    const { status } = req.body;

    if (!mongoose.isValidObjectId(courseId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid course ID",
        },
      });
    }

    const validStatuses = ["active", "completed", "dropped", "paused"];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: `Status must be one of: ${validStatuses.join(", ")}`,
        },
      });
    }

    const enrollment = await Enrollment.findOneAndUpdate(
      { student: userId, course: courseId },
      {
        ...(status && { status }),
        ...(status === "completed" && { completedAt: new Date() }),
        lastAccessedAt: new Date(),
      },
      { new: true }
    )
      .populate("course", "title description instructor category duration price thumbnailUrl")
      .lean();

    if (!enrollment) {
      return res.status(404).json({
        error: {
          code: "NOT_ENROLLED",
          message: "You are not enrolled in this course",
        },
      });
    }

    return res.status(200).json({
      message: "Enrollment status updated successfully",
      enrollment,
    });
  } catch (error) {
    return next(error);
  }
};

