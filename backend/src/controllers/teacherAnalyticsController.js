import mongoose from "mongoose";
import Enrollment from "../models/Enrollment.js";
import Course from "../models/Course.js";
import Quiz from "../models/Quiz.js";
import QuizAttempt from "../models/QuizAttempt.js";
import EbookResource from "../models/EbookResource.js";
import User from "../models/User.js";
import LessonCompletion from "../models/LessonCompletion.js";

/**
 * Get comprehensive teacher analytics
 * GET /api/v1/teacher/analytics
 */
export const getTeacherAnalytics = async (req, res, next) => {
  try {
    const { userId } = req.auth;
    const { period = "30" } = req.query; // days

    if (!userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    const teacherObjectId = mongoose.isValidObjectId(userId)
      ? new mongoose.Types.ObjectId(userId)
      : null;

    if (!teacherObjectId) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid user ID",
        },
      });
    }

    const days = parseInt(period);
    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    // Get teacher's courses
    const teacherCourses = await Course.find({ instructor: teacherObjectId }).lean();
    const courseIds = teacherCourses.map((c) => c._id);

    // Get enrollments
    const enrollments = await Enrollment.find({
      course: { $in: courseIds },
      enrolledAt: { $gte: startDate },
    })
      .populate("student", "fullName email")
      .populate("course", "title price")
      .lean();

    // Calculate revenue
    const totalRevenue = enrollments.reduce((sum, e) => sum + (e.course?.price || 0), 0);
    const totalEnrollments = enrollments.length;
    const uniqueStudents = new Set(enrollments.map((e) => e.student._id.toString())).size;

    // Get course performance
    const coursePerformance = await Promise.all(
      teacherCourses.map(async (course) => {
        const courseEnrollments = await Enrollment.countDocuments({ course: course._id });
        const courseRevenue = enrollments
          .filter((e) => e.course?._id.toString() === course._id.toString())
          .reduce((sum, e) => sum + (e.course?.price || 0), 0);

        const completions = await Enrollment.countDocuments({
          course: course._id,
          status: "completed",
        });

        const completionRate =
          courseEnrollments > 0 ? (completions / courseEnrollments) * 100 : 0;

        return {
          courseId: course._id.toString(),
          title: course.title,
          enrollments: courseEnrollments,
          revenue: courseRevenue,
          completionRate: Math.round(completionRate * 100) / 100,
        };
      })
    );

    // Get quiz performance
    const teacherQuizzes = await Quiz.find({
      $or: [
        { "metadata.createdBy": userId },
        { "metadata.createdBy": teacherObjectId.toString() },
        { "metadata.createdBy": teacherObjectId },
      ],
    }).lean();

    const quizIds = teacherQuizzes.map((q) => q._id);
    const quizAttempts = quizIds.length > 0
      ? await QuizAttempt.find({
          quiz: { $in: quizIds },
          completedAt: { $gte: startDate },
        }).lean()
      : [];

    const totalQuizAttempts = quizAttempts.length;
    const avgQuizScore =
      quizAttempts.length > 0
        ? quizAttempts.reduce((sum, a) => sum + (a.score || 0), 0) / quizAttempts.length
        : 0;

    // Get ebook performance
    const teacherEbooks = await EbookResource.find({
      $or: [
        { "metadata.uploadedBy": userId },
        { "metadata.uploadedBy": teacherObjectId.toString() },
        { "metadata.uploadedBy": teacherObjectId },
      ],
    }).lean();

    const totalEbookDownloads = teacherEbooks.reduce((sum, e) => sum + (e.downloads || 0), 0);

    // Revenue trend (last 7 days)
    const revenueTrend = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));

      const dayEnrollments = enrollments.filter(
        (e) =>
          new Date(e.enrolledAt) >= dayStart && new Date(e.enrolledAt) <= dayEnd
      );

      const dayRevenue = dayEnrollments.reduce((sum, e) => sum + (e.course?.price || 0), 0);

      revenueTrend.push({
        date: dayStart.toISOString().split("T")[0],
        revenue: dayRevenue,
        enrollments: dayEnrollments.length,
      });
    }

    return res.json({
      period: {
        days,
        startDate,
        endDate: now,
      },
      overview: {
        totalRevenue,
        totalEnrollments,
        uniqueStudents,
        totalQuizAttempts,
        avgQuizScore: Math.round(avgQuizScore * 100) / 100,
        totalEbookDownloads,
      },
      coursePerformance: coursePerformance.sort((a, b) => b.enrollments - a.enrollments),
      revenueTrend,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get course-specific analytics
 * GET /api/v1/teacher/courses/:courseId/analytics
 */
export const getCourseAnalytics = async (req, res, next) => {
  try {
    const { userId } = req.auth;
    const { courseId } = req.params;
    const { period = "30" } = req.query;

    if (!userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    if (!mongoose.isValidObjectId(courseId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid course ID",
        },
      });
    }

    const teacherObjectId = mongoose.isValidObjectId(userId)
      ? new mongoose.Types.ObjectId(userId)
      : null;

    // Verify course ownership
    const course = await Course.findOne({
      _id: courseId,
      instructor: teacherObjectId,
    });

    if (!course) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Course not found or you don't have permission",
        },
      });
    }

    const days = parseInt(period);
    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    // Get enrollments
    const enrollments = await Enrollment.find({
      course: courseId,
      enrolledAt: { $gte: startDate },
    })
      .populate("student", "fullName email")
      .lean();

    const totalEnrollments = enrollments.length;
    const activeEnrollments = enrollments.filter((e) => e.status === "active").length;
    const completedEnrollments = enrollments.filter((e) => e.status === "completed").length;
    const droppedEnrollments = enrollments.filter((e) => e.status === "dropped").length;

    const completionRate =
      totalEnrollments > 0 ? (completedEnrollments / totalEnrollments) * 100 : 0;

    // Calculate revenue
    const revenue = enrollments.reduce((sum, e) => sum + (course.price || 0), 0);

    // Get student progress
    const lessonCompletions = await LessonCompletion.find({
      course: courseId,
    })
      .populate("student", "fullName email")
      .lean();

    // Group by student
    const studentProgress = {};
    lessonCompletions.forEach((lc) => {
      const studentId = lc.student._id.toString();
      if (!studentProgress[studentId]) {
        studentProgress[studentId] = {
          student: lc.student,
          completions: 0,
        };
      }
      studentProgress[studentId].completions += 1;
    });

    // Enrollment trend
    const enrollmentTrend = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));

      const dayEnrollments = enrollments.filter(
        (e) =>
          new Date(e.enrolledAt) >= dayStart && new Date(e.enrolledAt) <= dayEnd
      ).length;

      enrollmentTrend.push({
        date: dayStart.toISOString().split("T")[0],
        enrollments: dayEnrollments,
      });
    }

    return res.json({
      course: {
        id: course._id.toString(),
        title: course.title,
        price: course.price || 0,
      },
      period: {
        days,
        startDate,
        endDate: now,
      },
      stats: {
        totalEnrollments,
        activeEnrollments,
        completedEnrollments,
        droppedEnrollments,
        completionRate: Math.round(completionRate * 100) / 100,
        revenue,
      },
      enrollmentTrend,
      studentProgress: Object.values(studentProgress).map((sp) => ({
        studentId: sp.student._id.toString(),
        studentName: sp.student.fullName,
        studentEmail: sp.student.email,
        completions: sp.completions,
      })),
    });
  } catch (error) {
    return next(error);
  }
};

