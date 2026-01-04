import mongoose from "mongoose";
import Enrollment from "../models/Enrollment.js";
import Course from "../models/Course.js";
import EbookResource from "../models/EbookResource.js";
import Quiz from "../models/Quiz.js";
import QuizAttempt from "../models/QuizAttempt.js";
import User from "../models/User.js";
import LessonCompletion from "../models/LessonCompletion.js";
import { formatCurrency } from "../utils/currencyUtils.js";

// Helper function to format time ago
function formatTimeAgo(date) {
  if (!date) return "Recently";
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now - past) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
  if (diffInSeconds < 86400)
    return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800)
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  if (diffInSeconds < 2592000)
    return `${Math.floor(diffInSeconds / 604800)} weeks ago`;
  return `${Math.floor(diffInSeconds / 2592000)} months ago`;
}

/**
 * Get teacher dashboard data
 */
export const getTeacherDashboard = async (req, res, next) => {
  try {
    const { userId } = req.auth;

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

    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get teacher's courses
    const teacherCourses = await Course.find({
      instructor: teacherObjectId,
    }).lean();
    const publishedCourses = teacherCourses.filter(
      (c) => c.status === "published"
    );
    const draftCourses = teacherCourses.filter((c) => c.status === "draft");
    const courseIds = teacherCourses.map((c) => c._id);

    // Get teacher's ebooks (check by uploadedBy in metadata or author name)
    const teacher = await User.findById(teacherObjectId)
      .select("fullName")
      .lean();
    const teacherName = teacher?.fullName || "";

    // Build query conditions - try multiple formats to catch all ebooks
    const queryConditions = [
      { "metadata.uploadedBy": userId }, // String format
      { "metadata.uploadedBy": teacherObjectId.toString() }, // String from ObjectId
    ];

    // Add ObjectId format if valid
    if (teacherObjectId) {
      queryConditions.push({ "metadata.uploadedBy": teacherObjectId });
    }

    // Add author name if available
    if (teacherName) {
      queryConditions.push({ "metadata.author": teacherName });
    }

    const teacherEbooks = await EbookResource.find({
      $or: queryConditions,
    }).lean();

    // Debug: Log the query results
    // eslint-disable-next-line no-console
    console.log(
      `[TeacherDashboard] Found ${teacherEbooks.length} ebooks for teacher ${userId} (${teacherName})`
    );
    const publishedEbooks = teacherEbooks.filter((e) => e.isPublic);
    const draftEbooks = teacherEbooks.filter((e) => !e.isPublic);

    // Get teacher's quizzes (check metadata for createdBy)
    // Note: We need to ensure createdBy is stored in metadata when quiz is created
    const quizQueryConditions = [
      { "metadata.createdBy": userId }, // String format
      { "metadata.createdBy": teacherObjectId.toString() }, // String from ObjectId
    ];

    // Add ObjectId format if valid
    if (teacherObjectId) {
      quizQueryConditions.push({ "metadata.createdBy": teacherObjectId });
    }

    const teacherQuizzes = await Quiz.find({
      $or: quizQueryConditions,
    }).lean();

    // Debug: Log the query results
    // eslint-disable-next-line no-console
    console.log(
      `[TeacherDashboard] Found ${teacherQuizzes.length} quizzes for teacher ${userId}`
    );
    const publishedQuizzes = teacherQuizzes.filter(
      (q) => q.status === "published"
    );

    // Get enrollments for teacher's courses
    const courseEnrollments = await Enrollment.find({
      course: { $in: courseIds },
    })
      .populate("student", "fullName")
      .populate("course", "title price currency")
      .sort({ createdAt: -1 })
      .lean();

    // Calculate course revenue (last 30 days)
    const courseEnrollmentsLast30Days = courseEnrollments.filter(
      (e) => new Date(e.createdAt) >= last30Days && e.course && e.course.price
    );
    let courseRevenue = 0;
    courseEnrollmentsLast30Days.forEach((e) => {
      courseRevenue += e.course.price || 0;
    });

    // Calculate course revenue last month for trend
    const courseEnrollmentsLastMonth = courseEnrollments.filter(
      (e) =>
        new Date(e.createdAt) >= lastMonthStart &&
        new Date(e.createdAt) < thisMonthStart &&
        e.course &&
        e.course.price
    );
    let courseRevenueLastMonth = 0;
    courseEnrollmentsLastMonth.forEach((e) => {
      courseRevenueLastMonth += e.course.price || 0;
    });

    const courseTrend =
      courseRevenueLastMonth > 0
        ? `+${Math.round(
            ((courseRevenue - courseRevenueLastMonth) /
              courseRevenueLastMonth) *
              100
          )}%`
        : courseRevenue > 0
        ? "+100%"
        : "0%";

    // Get top performing course
    const courseEnrollmentCounts = {};
    courseEnrollmentsLast30Days.forEach((e) => {
      if (e.course && e.course._id) {
        const courseId = e.course._id.toString();
        courseEnrollmentCounts[courseId] =
          (courseEnrollmentCounts[courseId] || 0) + 1;
      }
    });
    const topCourseId = Object.keys(courseEnrollmentCounts).reduce(
      (a, b) => (courseEnrollmentCounts[a] > courseEnrollmentCounts[b] ? a : b),
      null
    );
    const topCourse = topCourseId
      ? teacherCourses.find((c) => c._id.toString() === topCourseId)
      : null;

    // Calculate ebook revenue (approximate - based on downloads or purchases)
    // For now, we'll use a simple calculation based on downloads
    let ebookRevenue = 0;
    let ebookEnrollments = 0;
    publishedEbooks.forEach((ebook) => {
      const price = ebook.metadata?.price ? Number(ebook.metadata.price) : 0;
      const downloads = ebook.downloads || 0;
      ebookRevenue += price * downloads * 0.7; // Assume 70% conversion
      ebookEnrollments += downloads;
    });

    // Get top performing ebook
    const topEbook = publishedEbooks.reduce(
      (top, ebook) => {
        const downloads = ebook.downloads || 0;
        return downloads > (top.downloads || 0) ? ebook : top;
      },
      { downloads: 0 }
    );

    // Calculate quiz revenue (from quiz attempts - coins earned)
    const quizIds = teacherQuizzes.map((q) => q._id);
    const allQuizAttempts =
      quizIds.length > 0
        ? await QuizAttempt.find({
            quiz: { $in: quizIds },
          })
            .lean()
            .catch(() => [])
        : [];

    const quizAttemptsLast30Days = allQuizAttempts.filter((a) => {
      const attemptDate = a.completedAt || a.createdAt;
      return attemptDate && new Date(attemptDate) >= last30Days;
    });

    // Estimate revenue from quiz attempts (assuming coins have value)
    // For simplicity, we'll use a conversion rate
    const totalCoinsEarned = quizAttemptsLast30Days.reduce(
      (sum, attempt) => sum + (attempt.coinsEarned || 0),
      0
    );
    const quizRevenue = totalCoinsEarned * 0.01; // 1 coin = 0.01 INR (example)

    // Get top performing quiz and participant counts
    const quizAttemptCounts = {};
    allQuizAttempts.forEach((a) => {
      if (a.quiz) {
        const quizId = a.quiz.toString();
        quizAttemptCounts[quizId] = (quizAttemptCounts[quizId] || 0) + 1;
      }
    });

    const topQuizId = Object.keys(quizAttemptCounts).reduce(
      (a, b) => (quizAttemptCounts[a] > quizAttemptCounts[b] ? a : b),
      null
    );
    const topQuiz = topQuizId
      ? teacherQuizzes.find((q) => q._id.toString() === topQuizId)
      : null;

    // Add participant counts to quizzes for dashboard display
    const quizzesWithParticipants = teacherQuizzes.map((quiz) => ({
      ...quiz,
      participants: quizAttemptCounts[quiz._id.toString()] || 0,
      metadata: quiz.metadata || {}, // Ensure metadata is included for frontend filtering
    }));

    // Format revenue
    const formatRevenue = (amount) => {
      if (amount >= 1000) {
        return (
          formatCurrency(amount / 1000, { maximumFractionDigits: 1 }) + "K"
        );
      }
      return formatCurrency(amount, { maximumFractionDigits: 0 });
    };

    // Sales breakdown
    const salesBreakdown = [
      {
        type: "Courses",
        revenue: formatRevenue(courseRevenue),
        enrollments: courseEnrollmentsLast30Days.length,
        topCourse: topCourse?.title || "No courses yet",
        trend: courseTrend,
      },
      {
        type: "Books",
        revenue: formatRevenue(ebookRevenue),
        enrollments: ebookEnrollments,
        topCourse: topEbook?.title || "No books yet",
        trend: "+9%", // TODO: Calculate actual trend
      },
      {
        type: "Learn & Earn",
        revenue: formatRevenue(quizRevenue),
        enrollments: quizAttemptsLast30Days.length,
        topCourse: topQuiz?.title || "No quizzes yet",
        trend: "+28%", // TODO: Calculate actual trend
      },
    ];

    // Latest purchases (recent enrollments)
    const recentPurchases = courseEnrollments.slice(0, 4).map((enrollment) => {
      const timeAgo = formatTimeAgo(enrollment.createdAt);
      return {
        learner: enrollment.student?.fullName || "Student",
        item: enrollment.course?.title || "Course",
        type: "Course",
        time: timeAgo,
        value: enrollment.course?.price
          ? formatCurrency(enrollment.course.price)
          : "Free",
      };
    });

    // Learner spotlight (students with progress in teacher's courses)
    const studentProgress = await LessonCompletion.find({
      course: { $in: courseIds },
    })
      .populate("student", "fullName")
      .populate("course", "title")
      .lean();

    // Group by student and calculate progress
    const studentProgressMap = new Map();
    studentProgress.forEach((completion) => {
      if (!completion.student || !completion.course) return;
      const studentId = completion.student._id.toString();
      const courseId = completion.course._id.toString();
      if (!studentProgressMap.has(studentId)) {
        studentProgressMap.set(studentId, {
          student: completion.student,
          courses: new Map(),
        });
      }
      const studentData = studentProgressMap.get(studentId);
      if (!studentData.courses.has(courseId)) {
        studentData.courses.set(courseId, {
          course: completion.course,
          completions: 0,
        });
      }
      studentData.courses.get(courseId).completions += 1;
    });

    // Get student points for coins
    const studentIds = Array.from(studentProgressMap.keys()).map(
      (id) => new mongoose.Types.ObjectId(id)
    );
    let StudentPoints;
    try {
      StudentPoints = mongoose.model("StudentPoints");
    } catch {
      // Model doesn't exist, skip
    }
    const studentPoints = StudentPoints
      ? await StudentPoints.find({ student: { $in: studentIds } })
          .lean()
          .catch(() => [])
      : [];

    const studentPointsMap = new Map();
    studentPoints.forEach((sp) => {
      const studentId = sp.student?.toString() || sp.student;
      if (studentId) {
        const availableCoins = (sp.totalCoins || 0) - (sp.redeemedCoins || 0);
        studentPointsMap.set(studentId, availableCoins);
      }
    });

    // Format learner spotlight
    const learnerSpotlight = Array.from(studentProgressMap.entries())
      .slice(0, 3)
      .map(([studentId, data]) => {
        const courseEntries = Array.from(data.courses.entries());
        const topCourseEntry = courseEntries[0];
        const course = topCourseEntry ? topCourseEntry[1].course : null;
        const progress = Math.min(
          100,
          Math.round((topCourseEntry ? topCourseEntry[1].completions : 0) * 10)
        );
        const coins = studentPointsMap.get(studentId) || 0;

        return {
          name: data.student.fullName || "Student",
          programme: course?.title || "Course",
          progress: `${progress}%`,
          coins: coins,
        };
      });

    // Mentor network (other teachers)
    const otherTeachers = await User.find({
      role: "teacher",
      isActive: true,
      _id: { $ne: teacherObjectId },
    })
      .select("fullName metadata")
      .limit(3)
      .lean();

    const mentorNetwork = await Promise.all(
      otherTeachers.map(async (teacher) => {
        const teacherCoursesCount = await Course.countDocuments({
          instructor: teacher._id,
          status: "published",
        });
        return {
          id: teacher._id.toString(),
          name: teacher.fullName,
          expertise: teacher.metadata?.expertise || "English Language",
          courses: teacherCoursesCount,
          rating: "4.8 ★", // TODO: Calculate actual rating
        };
      })
    );

    // Marketplace recommendations (other teachers' courses, ebooks, and quizzes)
    const [marketplaceCourses, marketplaceEbooks, marketplaceQuizzes] =
      await Promise.all([
        Course.find({
          instructor: { $ne: teacherObjectId },
          status: "published",
        })
          .populate("instructor", "fullName")
          .sort({ createdAt: -1 })
          .limit(2)
          .lean(),
        EbookResource.find({
          isPublic: true,
          $or: [
            { "metadata.uploadedBy": { $ne: teacherObjectId.toString() } },
            { "metadata.uploadedBy": { $ne: teacherObjectId } },
            { "metadata.uploadedBy": { $exists: false } },
          ],
        })
          .sort({ publishedAt: -1, createdAt: -1 })
          .limit(1)
          .lean(),
        Quiz.find({
          status: "published",
          $or: [
            { "metadata.createdBy": { $ne: teacherObjectId.toString() } },
            { "metadata.createdBy": { $ne: teacherObjectId } },
            { "metadata.createdBy": { $exists: false } },
          ],
        })
          .sort({ createdAt: -1 })
          .limit(1)
          .lean(),
      ]);

    const marketplace = [
      ...marketplaceCourses.map((course) => ({
        id: course._id.toString(),
        title: course.title,
        mentor: course.instructor?.fullName || "Mentor",
        type: "Course",
        price: course.price ? formatCurrency(course.price) : "Free",
        reason: "Great addition to your teaching portfolio",
        route: `/learn-earn/courses/${course._id}`,
      })),
      ...marketplaceEbooks.map((ebook) => ({
        id: ebook._id.toString(),
        title: ebook.title,
        mentor: ebook.metadata?.author || "Digital AELA",
        type: "E-Book",
        price: ebook.metadata?.price
          ? formatCurrency(ebook.metadata.price)
          : "Free",
        reason: "Pairs well with your courses",
        route: `/books/${ebook._id}/payment`,
      })),
      ...marketplaceQuizzes.map((quiz) => ({
        id: quiz._id.toString(),
        title: quiz.title,
        mentor: "Digital AELA",
        type: "Quiz",
        price: "Free",
        reason: "Boost Learn & Earn engagement",
        route: `/learn-earn/quiz/${quiz._id}`,
      })),
    ].slice(0, 3); // Limit to 3 total items

    // Headline stats
    const headlineStats = {
      coursesPublished: publishedCourses.length,
      ebooksLibrary: teacherEbooks.length,
      activeQuizzes: publishedQuizzes.length,
      monthlyRevenue: formatRevenue(courseRevenue + ebookRevenue + quizRevenue),
      monthlyRevenueContext: courseTrend,
    };

    // Format pending items for "Drafts & review"
    const pendingCourses = draftCourses.map((course) => ({
      id: course._id.toString(),
      type: "course",
      title: course.title,
      status: "draft",
      action: "Continue editing",
      route: `/teacher/courses/${course._id}`,
      createdAt: course.createdAt,
    }));

    const pendingEbooks = draftEbooks.map((ebook) => ({
      id: ebook._id.toString(),
      type: "ebook",
      title: ebook.title,
      status: "pending",
      action: "Awaiting approval",
      route: `/teacher/ebooks/${ebook._id}`,
      createdAt: ebook.createdAt,
    }));

    const pendingQuizzes = teacherQuizzes
      .filter((q) => q.status !== "published")
      .map((quiz) => ({
        id: quiz._id.toString(),
        type: "quiz",
        title: quiz.title,
        status: quiz.status,
        action: "Continue editing",
        route: `/teacher/quizzes/${quiz._id}`,
        createdAt: quiz.createdAt,
      }));

    // Combine all pending items and sort by creation date (newest first)
    const allPendingItems = [
      ...pendingCourses,
      ...pendingEbooks,
      ...pendingQuizzes,
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Format ebook library entries
    const ebookLibrary = teacherEbooks
      .map((ebook) => {
        const format = ebook.pages ? `PDF · ${ebook.pages} pages` : "PDF";
        // Downloads can be stored in metadata.downloads or we can track via enrollments/purchases
        // For now, use metadata.downloads or default to 0
        const downloads = ebook.metadata?.downloads || 0;
        const lastUpdated = formatTimeAgo(ebook.updatedAt || ebook.createdAt);
        // Check if rejected first, then check if published
        const status =
          ebook.metadata?.rejected === true
            ? "rejected"
            : ebook.isPublic
            ? "published"
            : "draft";

        return {
          id: ebook._id.toString(),
          title: ebook.title,
          format: format,
          downloads: downloads,
          lastUpdated: lastUpdated,
          status: status,
          rejectionReason: ebook.metadata?.rejectionReason || null,
          createdAt: ebook.createdAt,
          updatedAt: ebook.updatedAt,
        };
      })
      .sort((a, b) => {
        // Sort by status (published first, then draft, then rejected) then by updated date (newest first)
        const statusOrder = { published: 0, draft: 1, rejected: 2 };
        const orderA = statusOrder[a.status] ?? 3;
        const orderB = statusOrder[b.status] ?? 3;
        if (orderA !== orderB) {
          return orderA - orderB;
        }
        const dateA = new Date(a.updatedAt || a.createdAt);
        const dateB = new Date(b.updatedAt || b.createdAt);
        return dateB - dateA;
      });

    return res.json({
      headlineStats,
      salesBreakdown,
      recentPurchases,
      learnerSpotlight,
      mentorNetwork,
      marketplace,
      quizzesWithParticipants: quizzesWithParticipants.map((q) => ({
        id: q._id.toString(),
        _id: q._id.toString(),
        title: q.title,
        participants: q.participants,
        rewardCoins: q.rewardCoins || 0,
        status: q.status,
        metadata: q.metadata || {}, // Include metadata for frontend filtering
      })),
      pendingItems: allPendingItems,
      ebookLibrary: ebookLibrary,
    });
  } catch (error) {
    return next(error);
  }
};
