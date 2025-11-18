import mongoose from "mongoose";
import Enrollment from "../models/Enrollment.js";
import Course from "../models/Course.js";
import Quiz from "../models/Quiz.js";
import QuizAttempt from "../models/QuizAttempt.js";
import EbookResource from "../models/EbookResource.js";
import User from "../models/User.js";
import LessonCompletion from "../models/LessonCompletion.js";
import CourseReview from "../models/CourseReview.js";
import VideoProgress from "../models/VideoProgress.js";
import CourseVideo from "../models/CourseVideo.js";

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

    // Additional Analytics Metrics
    // Calculate engagement rate (active students / total enrollments)
    const activeEnrollments = await Enrollment.countDocuments({
      course: { $in: courseIds },
      status: "active",
    });
    const totalAllTimeEnrollments = await Enrollment.countDocuments({
      course: { $in: courseIds },
    });
    const engagementRate =
      totalAllTimeEnrollments > 0
        ? (activeEnrollments / totalAllTimeEnrollments) * 100
        : 0;

    // Calculate retention rate (students who completed / students who enrolled)
    const completedEnrollments = await Enrollment.countDocuments({
      course: { $in: courseIds },
      status: "completed",
    });
    const retentionRate =
      totalAllTimeEnrollments > 0
        ? (completedEnrollments / totalAllTimeEnrollments) * 100
        : 0;

    // Calculate average video watch time
    const courseVideoIds = await CourseVideo.find({
      course: { $in: courseIds },
    })
      .select("_id")
      .lean()
      .then((videos) => videos.map((v) => v._id));

    const videoProgresses =
      courseVideoIds.length > 0
        ? await VideoProgress.find({
            video: { $in: courseVideoIds },
          }).lean()
        : [];

    const totalWatchTime = videoProgresses.reduce(
      (sum, vp) => sum + (vp.watchTime || 0),
      0
    );
    const avgWatchTime =
      videoProgresses.length > 0 ? totalWatchTime / videoProgresses.length : 0;

    // Calculate student satisfaction (from course reviews)
    const courseReviews = await CourseReview.find({
      course: { $in: courseIds },
      status: "approved",
    }).lean();

    const avgRating =
      courseReviews.length > 0
        ? courseReviews.reduce((sum, r) => sum + (r.rating || 0), 0) /
          courseReviews.length
        : 0;
    const totalReviews = courseReviews.length;
    const satisfactionRate = (avgRating / 5) * 100; // Convert to percentage

    // Calculate average course completion time
    const completedEnrollmentsWithDates = await Enrollment.find({
      course: { $in: courseIds },
      status: "completed",
      enrolledAt: { $exists: true },
      completedAt: { $exists: true },
    }).lean();

    const avgCompletionTime =
      completedEnrollmentsWithDates.length > 0
        ? completedEnrollmentsWithDates.reduce((sum, e) => {
            const completionTime =
              new Date(e.completedAt) - new Date(e.enrolledAt);
            return sum + completionTime;
          }, 0) / completedEnrollmentsWithDates.length
        : 0;

    // Calculate average completion time in days
    const avgCompletionDays = avgCompletionTime / (1000 * 60 * 60 * 24);

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
        // Additional metrics
        engagementRate: Math.round(engagementRate * 100) / 100,
        retentionRate: Math.round(retentionRate * 100) / 100,
        avgWatchTime: Math.round(avgWatchTime / 60), // Convert to minutes
        avgRating: Math.round(avgRating * 100) / 100,
        totalReviews,
        satisfactionRate: Math.round(satisfactionRate * 100) / 100,
        avgCompletionDays: Math.round(avgCompletionDays * 100) / 100,
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

    // Additional metrics for course analytics
    // Calculate engagement metrics
    const engagementRate =
      totalEnrollments > 0 ? (activeEnrollments / totalEnrollments) * 100 : 0;

    // Calculate video watch time for this course
    const courseVideos = await CourseVideo.find({ course: courseId })
      .select("_id")
      .lean();
    const videoIds = courseVideos.map((v) => v._id);

    const videoProgresses =
      videoIds.length > 0
        ? await VideoProgress.find({ video: { $in: videoIds } }).lean()
        : [];

    const totalWatchTime = videoProgresses.reduce(
      (sum, vp) => sum + (vp.watchTime || 0),
      0
    );
    const avgWatchTimePerStudent =
      activeEnrollments > 0 ? totalWatchTime / activeEnrollments : 0;

    // Get course reviews
    const reviews = await CourseReview.find({
      course: courseId,
      status: "approved",
    }).lean();

    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
        : 0;

    // Calculate average progress percentage
    const enrollmentsWithProgress = await Enrollment.find({
      course: courseId,
      status: { $in: ["active", "completed"] },
    }).lean();

    const avgProgress =
      enrollmentsWithProgress.length > 0
        ? enrollmentsWithProgress.reduce(
            (sum, e) => sum + (e.progress || 0),
            0
          ) / enrollmentsWithProgress.length
        : 0;

    // Calculate student activity (lessons completed per student)
    const avgLessonsPerStudent =
      activeEnrollments > 0
        ? lessonCompletions.length / activeEnrollments
        : 0;

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
        // Additional metrics
        engagementRate: Math.round(engagementRate * 100) / 100,
        avgWatchTimePerStudent: Math.round(avgWatchTimePerStudent / 60), // minutes
        avgRating: Math.round(avgRating * 100) / 100,
        totalReviews: reviews.length,
        avgProgress: Math.round(avgProgress * 100) / 100,
        avgLessonsPerStudent: Math.round(avgLessonsPerStudent * 100) / 100,
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

/**
 * Get enhanced analytics report with detailed metrics
 * GET /api/v1/teacher/analytics/report
 */
export const getEnhancedAnalyticsReport = async (req, res, next) => {
  try {
    const { userId } = req.auth;
    const { startDate, endDate, format = "json" } = req.query;

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

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    // Get all teacher courses
    const teacherCourses = await Course.find({ instructor: teacherObjectId }).lean();
    const courseIds = teacherCourses.map((c) => c._id);

    // Get comprehensive data
    const enrollments = await Enrollment.find({
      course: { $in: courseIds },
      enrolledAt: { $gte: start, $lte: end },
    })
      .populate("student", "fullName email")
      .populate("course", "title price")
      .lean();

    const reviews = await CourseReview.find({
      course: { $in: courseIds },
      status: "approved",
      createdAt: { $gte: start, $lte: end },
    }).lean();

    const videoProgresses = await VideoProgress.find({
      updatedAt: { $gte: start, $lte: end },
    })
      .populate("video", "title course")
      .lean();

    // Build detailed report
    const report = {
      period: {
        startDate: start,
        endDate: end,
      },
      summary: {
        totalCourses: teacherCourses.length,
        totalEnrollments: enrollments.length,
        totalRevenue: enrollments.reduce((sum, e) => sum + (e.course?.price || 0), 0),
        totalReviews: reviews.length,
        avgRating: reviews.length > 0
          ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
          : 0,
        totalWatchTime: videoProgresses.reduce((sum, vp) => sum + (vp.watchTime || 0), 0),
      },
      courseDetails: await Promise.all(
        teacherCourses.map(async (course) => {
          const courseEnrollments = enrollments.filter(
            (e) => e.course?._id.toString() === course._id.toString()
          );
          const courseReviews = reviews.filter(
            (r) => r.course.toString() === course._id.toString()
          );

          return {
            courseId: course._id.toString(),
            title: course.title,
            enrollments: courseEnrollments.length,
            revenue: courseEnrollments.reduce((sum, e) => sum + (e.course?.price || 0), 0),
            reviews: courseReviews.length,
            avgRating: courseReviews.length > 0
              ? courseReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / courseReviews.length
              : 0,
          };
        })
      ),
      enrollmentBreakdown: {
        byStatus: {
          active: enrollments.filter((e) => e.status === "active").length,
          completed: enrollments.filter((e) => e.status === "completed").length,
          paused: enrollments.filter((e) => e.status === "paused").length,
          dropped: enrollments.filter((e) => e.status === "dropped").length,
        },
        byCourse: teacherCourses.map((course) => ({
          courseId: course._id.toString(),
          title: course.title,
          count: enrollments.filter(
            (e) => e.course?._id.toString() === course._id.toString()
          ).length,
        })),
      },
    };

    // Export as CSV if requested
    if (format === "csv") {
      const csvRows = [];
      csvRows.push("Course Title,Enrollments,Revenue,Reviews,Avg Rating");
      report.courseDetails.forEach((course) => {
        csvRows.push(
          `"${course.title}",${course.enrollments},${course.revenue},${course.reviews},${course.avgRating.toFixed(2)}`
        );
      });

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="teacher-analytics-${Date.now()}.csv"`
      );
      return res.send(csvRows.join("\n"));
    }

    return res.json(report);
  } catch (error) {
    return next(error);
  }
};

/**
 * Compare analytics between two periods
 * GET /api/v1/teacher/analytics/compare
 */
export const compareAnalytics = async (req, res, next) => {
  try {
    const { userId } = req.auth;
    const { period1Start, period1End, period2Start, period2End } = req.query;

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

    if (!period1Start || !period1End || !period2Start || !period2End) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "All period dates are required",
        },
      });
    }

    const p1Start = new Date(period1Start);
    const p1End = new Date(period1End);
    const p2Start = new Date(period2Start);
    const p2End = new Date(period2End);

    const courseIds = await Course.find({ instructor: teacherObjectId })
      .select("_id")
      .lean()
      .then((courses) => courses.map((c) => c._id));

    // Get data for both periods
    const [enrollments1, enrollments2] = await Promise.all([
      Enrollment.find({
        course: { $in: courseIds },
        enrolledAt: { $gte: p1Start, $lte: p1End },
      }).lean(),
      Enrollment.find({
        course: { $in: courseIds },
        enrolledAt: { $gte: p2Start, $lte: p2End },
      }).lean(),
    ]);

    const revenue1 = enrollments1.reduce(
      (sum, e) => sum + (e.course?.price || 0),
      0
    );
    const revenue2 = enrollments2.reduce(
      (sum, e) => sum + (e.course?.price || 0),
      0
    );

    const comparison = {
      period1: {
        start: p1Start,
        end: p1End,
        enrollments: enrollments1.length,
        revenue: revenue1,
      },
      period2: {
        start: p2Start,
        end: p2End,
        enrollments: enrollments2.length,
        revenue: revenue2,
      },
      changes: {
        enrollmentChange: enrollments2.length - enrollments1.length,
        enrollmentChangePercent:
          enrollments1.length > 0
            ? ((enrollments2.length - enrollments1.length) / enrollments1.length) * 100
            : 0,
        revenueChange: revenue2 - revenue1,
        revenueChangePercent:
          revenue1 > 0 ? ((revenue2 - revenue1) / revenue1) * 100 : 0,
      },
    };

    return res.json(comparison);
  } catch (error) {
    return next(error);
  }
};

