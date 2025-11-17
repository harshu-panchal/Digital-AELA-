import mongoose from "mongoose";
import User from "../models/User.js";
import Course from "../models/Course.js";
import EbookResource from "../models/EbookResource.js";
import JobPost from "../models/JobPost.js";
import Enrollment from "../models/Enrollment.js";
import JobApplication from "../models/JobApplication.js";
import LessonCompletion from "../models/LessonCompletion.js";
import RecruiterBlog from "../models/RecruiterBlog.js";
import CourseReview from "../models/CourseReview.js";
import VideoProgress from "../models/VideoProgress.js";
import EbookReadingProgress from "../models/EbookReadingProgress.js";

/**
 * Parse date range from query parameters
 */
function parseDateRange(startDate, endDate) {
  const now = new Date();
  let start, end;

  if (startDate && endDate) {
    start = new Date(startDate);
    end = new Date(endDate);
    // Set end date to end of day
    end.setHours(23, 59, 59, 999);
    // Set start date to start of day
    start.setHours(0, 0, 0, 0);
  } else if (startDate) {
    start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    end = new Date();
    end.setHours(23, 59, 59, 999);
  } else {
    // Default to last 30 days
    start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    start.setHours(0, 0, 0, 0);
    end = new Date();
    end.setHours(23, 59, 59, 999);
  }

  return { start, end };
}

/**
 * Get platform overview analytics
 * GET /api/v1/admin/analytics/overview
 */
export const getOverviewAnalytics = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const { start, end } = parseDateRange(startDate, endDate);

    const now = new Date();
    const previousPeriodStart = new Date(start.getTime() - (end.getTime() - start.getTime()));

    // Total counts
    const [
      totalUsers,
      totalCourses,
      totalJobs,
      totalEnrollments,
      totalApplications,
      totalBlogs,
      totalEbooks,
    ] = await Promise.all([
      User.countDocuments({ createdAt: { $lte: end } }),
      Course.countDocuments({ createdAt: { $lte: end } }),
      JobPost.countDocuments({ createdAt: { $lte: end } }),
      Enrollment.countDocuments({ createdAt: { $lte: end } }),
      JobApplication.countDocuments({ createdAt: { $lte: end } }),
      RecruiterBlog.countDocuments({ createdAt: { $lte: end } }),
      EbookResource.countDocuments({ createdAt: { $lte: end } }),
    ]);

    // Period counts
    const [
      usersInPeriod,
      coursesInPeriod,
      jobsInPeriod,
      enrollmentsInPeriod,
      applicationsInPeriod,
      blogsInPeriod,
      ebooksInPeriod,
    ] = await Promise.all([
      User.countDocuments({ createdAt: { $gte: start, $lte: end } }),
      Course.countDocuments({ createdAt: { $gte: start, $lte: end } }),
      JobPost.countDocuments({ createdAt: { $gte: start, $lte: end } }),
      Enrollment.countDocuments({ createdAt: { $gte: start, $lte: end } }),
      JobApplication.countDocuments({ createdAt: { $gte: start, $lte: end } }),
      RecruiterBlog.countDocuments({ createdAt: { $gte: start, $lte: end } }),
      EbookResource.countDocuments({ createdAt: { $gte: start, $lte: end } }),
    ]);

    // Previous period counts for growth calculation
    const [
      usersPreviousPeriod,
      coursesPreviousPeriod,
      enrollmentsPreviousPeriod,
    ] = await Promise.all([
      User.countDocuments({ createdAt: { $gte: previousPeriodStart, $lt: start } }),
      Course.countDocuments({ createdAt: { $gte: previousPeriodStart, $lt: start } }),
      Enrollment.countDocuments({ createdAt: { $gte: previousPeriodStart, $lt: start } }),
    ]);

    // Calculate growth percentages
    const calculateGrowth = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    // Active users (users with activity in the period)
    const activeUsers = await User.countDocuments({
      $or: [
        { createdAt: { $gte: start, $lte: end } },
        { lastLoginAt: { $gte: start, $lte: end } },
      ],
    });

    // User roles breakdown
    const userRolesBreakdown = await User.aggregate([
      { $match: { createdAt: { $lte: end } } },
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 },
        },
      },
    ]);

    const rolesMap = userRolesBreakdown.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    return res.json({
      overview: {
        totalUsers,
        totalCourses,
        totalJobs,
        totalEnrollments,
        totalApplications,
        totalBlogs,
        totalEbooks,
        activeUsers,
      },
      period: {
        start: start.toISOString(),
        end: end.toISOString(),
        users: usersInPeriod,
        courses: coursesInPeriod,
        jobs: jobsInPeriod,
        enrollments: enrollmentsInPeriod,
        applications: applicationsInPeriod,
        blogs: blogsInPeriod,
        ebooks: ebooksInPeriod,
      },
      growth: {
        users: calculateGrowth(usersInPeriod, usersPreviousPeriod),
        courses: calculateGrowth(coursesInPeriod, coursesPreviousPeriod),
        enrollments: calculateGrowth(enrollmentsInPeriod, enrollmentsPreviousPeriod),
      },
      breakdown: {
        userRoles: rolesMap,
      },
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get user analytics
 * GET /api/v1/admin/analytics/users
 */
export const getUserAnalytics = async (req, res, next) => {
  try {
    const { startDate, endDate, groupBy = "day" } = req.query;
    const { start, end } = parseDateRange(startDate, endDate);

    // User growth over time
    const userGrowth = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: groupBy === "day" ? "%Y-%m-%d" : groupBy === "week" ? "%Y-W%V" : "%Y-%m",
              date: "$createdAt",
            },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // User roles breakdown
    const rolesBreakdown = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 },
        },
      },
    ]);

    // Active vs inactive users
    const activeUsers = await User.countDocuments({
      isActive: true,
      createdAt: { $lte: end },
    });

    const inactiveUsers = await User.countDocuments({
      isActive: false,
      createdAt: { $lte: end },
    });

    // User engagement (users with activity in period)
    const engagedUsers = await User.countDocuments({
      $or: [
        { createdAt: { $gte: start, $lte: end } },
        { lastLoginAt: { $gte: start, $lte: end } },
      ],
    });

    // Top users by activity (if lastLoginAt exists)
    const topActiveUsers = await User.find({
      lastLoginAt: { $gte: start, $lte: end },
    })
      .select("fullName email role lastLoginAt createdAt")
      .sort({ lastLoginAt: -1 })
      .limit(10);

    return res.json({
      growth: userGrowth.map((item) => ({
        date: item._id,
        count: item.count,
      })),
      roles: rolesBreakdown.map((item) => ({
        role: item._id,
        count: item.count,
      })),
      status: {
        active: activeUsers,
        inactive: inactiveUsers,
      },
      engagement: {
        engaged: engagedUsers,
        total: activeUsers + inactiveUsers,
      },
      topActive: topActiveUsers.map((user) => ({
        id: user._id,
        name: user.fullName,
        email: user.email,
        role: user.role,
        lastLogin: user.lastLoginAt,
        joinedAt: user.createdAt,
      })),
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get course analytics
 * GET /api/v1/admin/analytics/courses
 */
export const getCourseAnalytics = async (req, res, next) => {
  try {
    const { startDate, endDate, groupBy = "day" } = req.query;
    const { start, end } = parseDateRange(startDate, endDate);

    // Course creation over time
    const courseGrowth = await Course.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: groupBy === "day" ? "%Y-%m-%d" : groupBy === "week" ? "%Y-W%V" : "%Y-%m",
              date: "$createdAt",
            },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Course status breakdown
    const statusBreakdown = await Course.aggregate([
      {
        $match: {
          createdAt: { $lte: end },
        },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    // Enrollment statistics
    const enrollmentStats = await Enrollment.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: {
            $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] },
          },
          completed: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
          },
          paused: {
            $sum: { $cond: [{ $eq: ["$status", "paused"] }, 1, 0] },
          },
        },
      },
    ]);

    // Top courses by enrollment
    const topCourses = await Enrollment.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: "$course",
          enrollmentCount: { $sum: 1 },
        },
      },
      { $sort: { enrollmentCount: -1 } },
      { $limit: 10 },
    ]);

    // Populate course details
    const topCoursesWithDetails = await Course.populate(topCourses, {
      path: "_id",
      select: "title description price status createdAt",
    });

    // Course completion rate
    const totalEnrollments = await Enrollment.countDocuments({
      createdAt: { $gte: start, $lte: end },
    });

    const completedEnrollments = await Enrollment.countDocuments({
      status: "completed",
      createdAt: { $gte: start, $lte: end },
    });

    const completionRate = totalEnrollments > 0
      ? (completedEnrollments / totalEnrollments) * 100
      : 0;

    // Course reviews statistics
    const reviewStats = await CourseReview.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          status: "approved",
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          averageRating: { $avg: "$rating" },
          ratingDistribution: {
            $push: "$rating",
          },
        },
      },
    ]);

    const ratingDistribution = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    };

    if (reviewStats.length > 0 && reviewStats[0].ratingDistribution) {
      reviewStats[0].ratingDistribution.forEach((rating) => {
        ratingDistribution[rating] = (ratingDistribution[rating] || 0) + 1;
      });
    }

    return res.json({
      growth: courseGrowth.map((item) => ({
        date: item._id,
        count: item.count,
      })),
      status: statusBreakdown.map((item) => ({
        status: item._id,
        count: item.count,
      })),
      enrollments: enrollmentStats[0] || {
        total: 0,
        active: 0,
        completed: 0,
        paused: 0,
      },
      topCourses: topCoursesWithDetails
        .filter((item) => item._id)
        .map((item) => ({
          courseId: item._id._id,
          title: item._id.title,
          description: item._id.description,
          price: item._id.price,
          status: item._id.status,
          enrollmentCount: item.enrollmentCount,
          createdAt: item._id.createdAt,
        })),
      completion: {
        rate: completionRate,
        total: totalEnrollments,
        completed: completedEnrollments,
      },
      reviews: {
        total: reviewStats[0]?.total || 0,
        averageRating: reviewStats[0]?.averageRating || 0,
        distribution: ratingDistribution,
      },
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get revenue analytics
 * GET /api/v1/admin/analytics/revenue
 */
export const getRevenueAnalytics = async (req, res, next) => {
  try {
    const { startDate, endDate, groupBy = "day" } = req.query;
    const { start, end } = parseDateRange(startDate, endDate);

    // Get enrollments with course details
    const enrollments = await Enrollment.find({
      createdAt: { $gte: start, $lte: end },
    }).populate({
      path: "course",
      select: "title price currency",
    });

    // Calculate revenue by date
    const revenueByDate = {};
    let totalRevenue = 0;
    const revenueByCurrency = {};

    enrollments.forEach((enrollment) => {
      if (enrollment.course && enrollment.course.price) {
        const price = enrollment.course.price;
        const currency = enrollment.course.currency || "AED";
        const dateKey = new Date(enrollment.createdAt).toISOString().split("T")[0];

        if (groupBy === "week") {
          const week = getWeekNumber(enrollment.createdAt);
          const year = new Date(enrollment.createdAt).getFullYear();
          const dateKey = `${year}-W${week}`;
          revenueByDate[dateKey] = (revenueByDate[dateKey] || 0) + price;
        } else if (groupBy === "month") {
          const date = new Date(enrollment.createdAt);
          const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
          revenueByDate[dateKey] = (revenueByDate[dateKey] || 0) + price;
        } else {
          revenueByDate[dateKey] = (revenueByDate[dateKey] || 0) + price;
        }

        totalRevenue += price;
        revenueByCurrency[currency] = (revenueByCurrency[currency] || 0) + price;
      }
    });

    // Convert to array format
    const revenueTrend = Object.entries(revenueByDate)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Revenue by course
    const revenueByCourse = {};
    enrollments.forEach((enrollment) => {
      if (enrollment.course && enrollment.course.price) {
        const courseId = enrollment.course._id.toString();
        const courseTitle = enrollment.course.title;
        if (!revenueByCourse[courseId]) {
          revenueByCourse[courseId] = {
            courseId,
            title: courseTitle,
            revenue: 0,
            enrollments: 0,
          };
        }
        revenueByCourse[courseId].revenue += enrollment.course.price;
        revenueByCourse[courseId].enrollments += 1;
      }
    });

    const topRevenueCourses = Object.values(revenueByCourse)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Calculate previous period for growth
    const previousPeriodStart = new Date(start.getTime() - (end.getTime() - start.getTime()));
    const previousEnrollments = await Enrollment.find({
      createdAt: { $gte: previousPeriodStart, $lt: start },
    }).populate({
      path: "course",
      select: "price",
    });

    let previousRevenue = 0;
    previousEnrollments.forEach((enrollment) => {
      if (enrollment.course && enrollment.course.price) {
        previousRevenue += enrollment.course.price;
      }
    });

    const revenueGrowth = previousRevenue > 0
      ? ((totalRevenue - previousRevenue) / previousRevenue) * 100
      : totalRevenue > 0 ? 100 : 0;

    return res.json({
      total: totalRevenue,
      growth: revenueGrowth,
      trend: revenueTrend,
      byCurrency: revenueByCurrency,
      topCourses: topRevenueCourses,
      period: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get job portal analytics
 * GET /api/v1/admin/analytics/jobs
 */
export const getJobAnalytics = async (req, res, next) => {
  try {
    const { startDate, endDate, groupBy = "day" } = req.query;
    const { start, end } = parseDateRange(startDate, endDate);

    // Job posting growth
    const jobGrowth = await JobPost.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: groupBy === "day" ? "%Y-%m-%d" : groupBy === "week" ? "%Y-W%V" : "%Y-%m",
              date: "$createdAt",
            },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Job status breakdown
    const statusBreakdown = await JobPost.aggregate([
      {
        $match: {
          createdAt: { $lte: end },
        },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    // Application statistics
    const applicationStats = await JobApplication.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: "$currentStage",
          count: { $sum: 1 },
        },
      },
    ]);

    // Top jobs by applications
    const topJobs = await JobApplication.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: "$job",
          applicationCount: { $sum: 1 },
        },
      },
      { $sort: { applicationCount: -1 } },
      { $limit: 10 },
    ]);

    // Populate job details
    const topJobsWithDetails = await JobPost.populate(topJobs, {
      path: "_id",
      select: "title company location employmentType status createdAt",
    });

    // Employment type breakdown
    const employmentTypeBreakdown = await JobPost.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: "$employmentType",
          count: { $sum: 1 },
        },
      },
    ]);

    // Application conversion rate
    const totalJobs = await JobPost.countDocuments({
      createdAt: { $gte: start, $lte: end },
      status: "published",
    });

    const totalApplications = await JobApplication.countDocuments({
      createdAt: { $gte: start, $lte: end },
    });

    const conversionRate = totalJobs > 0
      ? (totalApplications / totalJobs) * 100
      : 0;

    return res.json({
      growth: jobGrowth.map((item) => ({
        date: item._id,
        count: item.count,
      })),
      status: statusBreakdown.map((item) => ({
        status: item._id,
        count: item.count,
      })),
      applications: applicationStats.map((item) => ({
        stage: item._id,
        count: item.count,
      })),
      topJobs: topJobsWithDetails
        .filter((item) => item._id)
        .map((item) => ({
          jobId: item._id._id,
          title: item._id.title,
          company: item._id.company,
          location: item._id.location,
          employmentType: item._id.employmentType,
          applicationCount: item.applicationCount,
          status: item._id.status,
          createdAt: item._id.createdAt,
        })),
      employmentTypes: employmentTypeBreakdown.map((item) => ({
        type: item._id,
        count: item.count,
      })),
      conversion: {
        rate: conversionRate,
        totalJobs,
        totalApplications,
      },
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Helper function to get week number
 */
function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

