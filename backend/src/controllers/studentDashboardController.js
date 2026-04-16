import mongoose from "mongoose";
import Enrollment from "../models/Enrollment.js";
import LessonCompletion from "../models/LessonCompletion.js";
import StudentPoints from "../models/StudentPoints.js";
import SpeakingAssessment from "../models/SpeakingAssessment.js";
import Course from "../models/Course.js";
import User from "../models/User.js";
import StudentProfile from "../models/StudentProfile.js";
import Batch from "../models/Batch.js";

export const getStudentDashboard = async (req, res, next) => {
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

    const studentObjectId = mongoose.isValidObjectId(userId)
      ? new mongoose.Types.ObjectId(userId)
      : null;

    if (!studentObjectId) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid user ID",
        },
      });
    }

    // Calculate Learning Hours (from lesson completions)
    // Parallelize all initial data fetches
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    let learningSummary = { totalDuration: 0, monthlyDuration: 0 };
    let activeEnrollments = [];
    let studentPoints = null;
    let latestAssessment = null;

    try {
      [learningSummary, activeEnrollments, studentPoints, latestAssessment] =
        await Promise.all([
          LessonCompletion.aggregate([
            { $match: { student: studentObjectId } },
            {
              $group: {
                _id: null,
                totalDuration: { $sum: { $ifNull: ["$duration", 0] } },
                monthlyDuration: {
                  $sum: {
                    $cond: [
                      { $gte: ["$completedAt", startOfMonth] },
                      { $ifNull: ["$duration", 0] },
                      0,
                    ],
                  },
                },
              },
            },
          ])
            .then((results) => results[0] || { totalDuration: 0, monthlyDuration: 0 })
            .catch(() => ({ totalDuration: 0, monthlyDuration: 0 })),
          Enrollment.find({
            student: studentObjectId,
            status: "active",
          })
            .populate({
              path: "course",
              select: "title instructor",
              populate: {
                path: "instructor",
                select: "fullName",
              },
            })
            .sort({ lastAccessedAt: -1, enrolledAt: -1 })
            .lean()
            .catch(() => []),
          StudentPoints.findOne({ student: studentObjectId })
            .lean()
            .catch(() => null),
          SpeakingAssessment.findOne({ student: studentObjectId })
            .sort({ createdAt: -1 })
            .lean()
            .catch(() => null),
        ]);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error fetching dashboard data:", error);
      learningSummary = { totalDuration: 0, monthlyDuration: 0 };
      activeEnrollments = [];
      studentPoints = null;
      latestAssessment = null;
    }

    const totalLearningHours = (learningSummary.totalDuration || 0) / 60;
    const hoursThisMonth = (learningSummary.monthlyDuration || 0) / 60;

    const activeCoursesCount = activeEnrollments.length;

    // Get courses with upcoming sessions (this week) from Batch records
    let liveCohortsThisWeek = 0;
    try {
      const now = new Date();
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      // Find batches where:
      // 1. Student is enrolled (in students array)
      // 2. Batch is active or upcoming
      // 3. Batch has sessions scheduled for this week (startDate is within next 7 days)
      const batchesThisWeek = await Batch.find({
        students: studentObjectId,
        status: { $in: ["active", "upcoming"] },
        startDate: { $lte: nextWeek },
        endDate: { $gte: now },
      }).lean();

      liveCohortsThisWeek = batchesThisWeek.length;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error fetching live cohorts:", error);
      liveCohortsThisWeek = 0;
    }

    // Create default points record if not found
    if (!studentPoints) {
      try {
        studentPoints = await StudentPoints.create({
          student: studentObjectId,
          totalCoins: 0,
          redeemedCoins: 0,
          pendingCoins: 0,
          streak: 0,
        });
        studentPoints = studentPoints.toObject(); // Convert to plain object
      } catch (createError) {
        // eslint-disable-next-line no-console
        console.error("Error creating student points:", createError);
        studentPoints = {
          totalCoins: 0,
          redeemedCoins: 0,
          pendingCoins: 0,
          streak: 0,
        };
      }
    }

    const totalCoins = studentPoints.totalCoins || 0;
    const pendingCoins = studentPoints.pendingCoins || 0;
    const redeemedCoins = studentPoints.redeemedCoins || 0;
    const availableCoins = totalCoins - redeemedCoins - pendingCoins;

    // Calculate totalEarned from transactions (sum of all earned and bonus transactions)
    let totalEarned = 0;
    if (
      studentPoints.transactions &&
      Array.isArray(studentPoints.transactions)
    ) {
      totalEarned = studentPoints.transactions
        .filter((txn) => txn.type === "earned" || txn.type === "bonus")
        .reduce((sum, txn) => sum + (txn.amount || 0), 0);
    }

    const speakingScore = latestAssessment?.score || null;

    // Calculate streak
    const streak = studentPoints.streak || 0;

    // Build journey stats
    const journeyStats = [
      {
        id: "learningHours",
        label: "Learning Hours",
        value: totalLearningHours.toFixed(1),
        delta:
          hoursThisMonth > 0
            ? `+${hoursThisMonth.toFixed(1)} hours this month`
            : "No activity this month",
      },
      {
        id: "activeCourses",
        label: "Active Courses",
        value: activeCoursesCount.toString(),
        delta:
          liveCohortsThisWeek > 0
            ? `${liveCohortsThisWeek} live cohorts this week`
            : "No live sessions",
      },
      {
        id: "aelaCoins",
        label: "AELA Coins",
        value: availableCoins.toString(),
        delta:
          pendingCoins > 0
            ? `+${pendingCoins} coins pending redemption`
            : "All coins available",
      },
      {
        id: "speakingScore",
        label: "Speaking Score",
        value: speakingScore
          ? `${speakingScore.toFixed(1)} / 10`
          : "Not assessed",
        delta:
          streak > 0
            ? "Consistent streak · Keep it up!"
            : "Start your learning journey",
      },
    ];

    // Get ongoing courses with progress
    // Batch fetch all course completions and batches to avoid N+1 queries
    const courseIds = activeEnrollments
      .slice(0, 5)
      .map((e) => e.course?._id)
      .filter(Boolean);

    const [allCourseCompletions, allBatches] = await Promise.all([
      courseIds.length > 0
        ? LessonCompletion.find({
            student: studentObjectId,
            course: { $in: courseIds },
          }).lean()
        : Promise.resolve([]),
      courseIds.length > 0
        ? Batch.find({
            course: { $in: courseIds },
            students: studentObjectId,
            status: { $in: ["active", "upcoming"] },
            endDate: { $gte: new Date() },
          })
            .sort({ startDate: 1 })
            .lean()
        : Promise.resolve([]),
    ]);

    // Group completions by course
    const completionsByCourse = allCourseCompletions.reduce(
      (acc, completion) => {
        const courseId = completion.course.toString();
        if (!acc[courseId]) acc[courseId] = [];
        acc[courseId].push(completion);
        return acc;
      },
      {}
    );

    // Group batches by course
    const batchesByCourse = allBatches.reduce((acc, batch) => {
      const courseId = batch.course.toString();
      if (!acc[courseId]) acc[courseId] = [];
      acc[courseId].push(batch);
      return acc;
    }, {});

    const ongoingCourses = activeEnrollments
      .slice(0, 5)
      .map((enrollment) => {
        const course = enrollment.course;
        if (!course || !course._id) return null;

        // Get completions for this course from pre-fetched data
        const courseCompletions =
          completionsByCourse[course._id.toString()] || [];
        // This is simplified - you'd need total lessons in course for real progress
        const progress = enrollment.progress || 0;

        // Get instructor name if available
        let instructorName = "Instructor";
        if (course.instructor) {
          if (
            typeof course.instructor === "object" &&
            course.instructor.fullName
          ) {
            instructorName = course.instructor.fullName;
          } else if (typeof course.instructor === "string") {
            // If instructor is just an ID, we'd need to populate it
            instructorName = "Instructor";
          }
        }

        // Get next session from pre-fetched batches
        let nextSession = "Check schedule";
        const batches = batchesByCourse[course._id.toString()] || [];

        if (batches.length > 0) {
          // Sort and get the first one (already sorted by startDate)
          const batch = batches[0];
          const startDate = new Date(batch.startDate);
          const now = new Date();
          const daysUntil = Math.ceil(
            (startDate - now) / (1000 * 60 * 60 * 24)
          );

          if (daysUntil === 0) {
            nextSession = "Today";
          } else if (daysUntil === 1) {
            nextSession = "Tomorrow";
          } else if (daysUntil < 7) {
            nextSession = startDate.toLocaleDateString("en-US", {
              weekday: "long",
            });
          } else {
            nextSession = startDate.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            });
          }

          // Add time if available
          if (batch.schedule?.time?.start) {
            nextSession += ` · ${batch.schedule.time.start}`;
          }
        }

        return {
          id: course._id.toString(),
          title: course.title || "Untitled Course",
          mentor: instructorName,
          progress: Math.round(progress),
          nextSession,
          access:
            enrollment.status === "active"
              ? "Active enrollment"
              : enrollment.status,
          route: `/student/courses/${course._id}`,
        };
      })
      .filter(Boolean); // Remove null entries

    // Get Learn & Earn progress
    const learnEarnProgress = {
      streak: streak,
      leaderboardPosition: studentPoints.leaderboardPosition || 0,
      coinsToRedeem: availableCoins,
      totalCoins: totalCoins,
      totalEarned: totalEarned,
      totalRedeemed: redeemedCoins,
      redeemRoute: "/learn-earn/wallet",
      badges: (studentPoints.badges || []).map((badge) => ({
        label: badge
          .replace(/-/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase()),
        description: `Earned ${badge} badge`,
        icon: "🏆",
      })),
    };

    return res.json({
      journeyStats,
      ongoingCourses: ongoingCourses.filter(Boolean),
      learnEarnProgress,
    });
  } catch (error) {
    return next(error);
  }
};

// Public endpoint to get basic stats/earnings for a user
export const getPublicUserStats = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "User ID is required",
        },
      });
    }

    const studentObjectId = mongoose.isValidObjectId(userId)
      ? new mongoose.Types.ObjectId(userId)
      : null;

    if (!studentObjectId) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid user ID",
        },
      });
    }

    // Get user basic info
    const user = await User.findById(studentObjectId)
      .select("fullName email metadata")
      .lean();
    if (!user) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "User not found",
        },
      });
    }

    // Get AELA Coins (public stats only)
    let studentPoints = null;
    try {
      studentPoints = await StudentPoints.findOne({ student: studentObjectId });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error fetching student points:", error);
    }

    const totalCoins = studentPoints?.totalCoins || 0;
    const redeemedCoins = studentPoints?.redeemedCoins || 0;
    const pendingCoins = studentPoints?.pendingCoins || 0;
    const availableCoins = totalCoins - redeemedCoins - pendingCoins;

    // Calculate totalEarned from transactions (sum of all earned and bonus transactions)
    let totalEarned = 0;
    if (
      studentPoints?.transactions &&
      Array.isArray(studentPoints.transactions)
    ) {
      totalEarned = studentPoints.transactions
        .filter((txn) => txn.type === "earned" || txn.type === "bonus")
        .reduce((sum, txn) => sum + (txn.amount || 0), 0);
    }

    // Get streak (public stat)
    const streak = studentPoints?.streak || 0;

    // Calculate Learning Hours (public stat)
    let lessonCompletions = [];
    try {
      lessonCompletions = await LessonCompletion.find({
        student: studentObjectId,
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error fetching lesson completions:", error);
    }

    const totalLearningHours = lessonCompletions.reduce((total, completion) => {
      return total + (completion.duration || 0) / 60; // Convert minutes to hours
    }, 0);

    // Get Active Courses count (public stat)
    let activeEnrollments = [];
    try {
      activeEnrollments = await Enrollment.find({
        student: studentObjectId,
        status: "active",
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error fetching enrollments:", error);
    }

    const activeCoursesCount = activeEnrollments.length;

    // Get Speaking Score (latest assessment) - public stat
    let latestAssessment = null;
    try {
      latestAssessment = await SpeakingAssessment.findOne({
        student: studentObjectId,
      }).sort({ createdAt: -1 });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error fetching speaking assessment:", error);
    }

    const speakingScore = latestAssessment?.score || null;

    return res.json({
      user: {
        id: user._id.toString(),
        fullName: user.fullName,
        avatarUrl: user.metadata?.avatarUrl || null,
      },
      earnings: {
        totalCoins,
        availableCoins,
        redeemedCoins,
        totalEarned,
      },
      stats: {
        learningHours: parseFloat(totalLearningHours.toFixed(1)),
        activeCourses: activeCoursesCount,
        streak,
        speakingScore: speakingScore
          ? parseFloat(speakingScore.toFixed(1))
          : null,
      },
    });
  } catch (error) {
    return next(error);
  }
};

// Get enhanced dashboard widgets
export const getDashboardWidgets = async (req, res, next) => {
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

    const studentObjectId = mongoose.isValidObjectId(userId)
      ? new mongoose.Types.ObjectId(userId)
      : null;

    if (!studentObjectId) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid user ID",
        },
      });
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const weeklyStart = new Date();
    weeklyStart.setDate(weeklyStart.getDate() - 6);
    weeklyStart.setHours(0, 0, 0, 0);

    const safeQuery = async (queryFn, fallback, label) => {
      try {
        return await queryFn();
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(`Error fetching ${label}:`, error);
        return fallback;
      }
    };

    const [
      studentPoints,
      recentEnrollments,
      recentCompletions,
      weeklyCompletionBuckets,
      completedCourses,
      enrolledCourseIds,
    ] = await Promise.all([
      safeQuery(
        () => StudentPoints.findOne({ student: studentObjectId }).lean(),
        null,
        "student points"
      ),
      safeQuery(
        () =>
          Enrollment.find({
            student: studentObjectId,
            enrolledAt: { $gte: sevenDaysAgo },
          })
            .populate("course", "title")
            .sort({ enrolledAt: -1 })
            .limit(5)
            .lean(),
        [],
        "recent enrollments"
      ),
      safeQuery(
        () =>
          LessonCompletion.find({
            student: studentObjectId,
            completedAt: { $gte: sevenDaysAgo },
          })
            .populate("course", "title")
            .sort({ completedAt: -1 })
            .limit(5)
            .lean(),
        [],
        "recent completions"
      ),
      safeQuery(
        () =>
          LessonCompletion.aggregate([
            {
              $match: {
                student: studentObjectId,
                completedAt: { $gte: weeklyStart },
              },
            },
            {
              $project: {
                day: {
                  $dateToString: {
                    format: "%Y-%m-%d",
                    date: "$completedAt",
                  },
                },
                duration: { $ifNull: ["$duration", 0] },
              },
            },
            {
              $group: {
                _id: "$day",
                duration: { $sum: "$duration" },
                lessons: { $sum: 1 },
              },
            },
          ]),
        [],
        "weekly progress"
      ),
      safeQuery(
        () =>
          Enrollment.countDocuments({
            student: studentObjectId,
            status: "completed",
          }),
        0,
        "completed courses"
      ),
      safeQuery(
        () =>
          Enrollment.find({
            student: studentObjectId,
          })
            .select("course")
            .lean()
            .then((enrollments) =>
              enrollments.map((e) => e.course).filter(Boolean)
            ),
        [],
        "enrolled courses"
      ),
    ]);

    const recentActivities = [];

    recentEnrollments.forEach((enrollment) => {
      recentActivities.push({
        id: enrollment._id.toString(),
        type: "enrollment",
        title: `Enrolled in ${enrollment.course?.title || "Course"}`,
        timestamp: enrollment.enrolledAt,
        icon: "📚",
      });
    });

    recentCompletions.forEach((completion) => {
      recentActivities.push({
        id: completion._id.toString(),
        type: "completion",
        title: `Completed lesson in ${completion.course?.title || "Course"}`,
        timestamp: completion.completedAt,
        icon: "✅",
      });
    });

    // Sort by timestamp and get top 10
    recentActivities.sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );
    const recentActivity = recentActivities.slice(0, 10).map((activity) => ({
      ...activity,
      timeAgo: formatTimeAgo(activity.timestamp),
    }));

    // Achievements Widget
    const badges = (studentPoints?.badges || []).map((badge) => ({
      id: badge,
      label: badge.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      description: `Earned ${badge} badge`,
      icon: getBadgeIcon(badge),
      earnedAt: new Date(), // TODO: Track when badge was earned
    }));

    // Weekly Progress Widget - Last 7 days
    const weeklyBucketMap = new Map(
      weeklyCompletionBuckets.map((bucket) => [bucket._id, bucket])
    );
    const weeklyProgress = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const dayKey = date.toISOString().split("T")[0];
      const bucket = weeklyBucketMap.get(dayKey);
      const hours = (bucket?.duration || 0) / 60;

      weeklyProgress.push({
        date: dayKey,
        day: date.toLocaleDateString("en-US", { weekday: "short" }),
        hours: parseFloat(hours.toFixed(1)),
        lessons: bucket?.lessons || 0,
      });
    }

    // Learning Goals Widget
    const learningGoals = {
      weeklyHours: {
        current: weeklyProgress.reduce((sum, day) => sum + day.hours, 0),
        target: 10, // Default target, can be customized
        unit: "hours",
      },
      coursesCompleted: {
        current: completedCourses,
        target: 5, // Default target
        unit: "courses",
      },
      streak: {
        current: studentPoints?.streak || 0,
        target: 30, // Default target
        unit: "days",
      },
    };

    const recommendations = await safeQuery(
      () =>
        Course.find({
          _id: { $nin: enrolledCourseIds },
          status: "published",
        })
          .populate("instructor", "fullName")
          .sort({ createdAt: -1 })
          .limit(3)
          .lean()
          .then((courses) =>
            courses.map((course) => ({
              id: course._id.toString(),
              title: course.title,
              instructor: course.instructor?.fullName || "Instructor",
              price: course.price || 0,
              thumbnail: course.thumbnail || null,
              route: `/learn-earn/courses/${course._id}`,
            }))
          ),
      [],
      "course recommendations"
    );

    return res.json({
      recentActivity,
      achievements: badges,
      weeklyProgress,
      learningGoals,
      recommendations,
    });
  } catch (error) {
    return next(error);
  }
};

// Get enhanced profile data
export const getEnhancedProfile = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { userId: authUserId } = req.auth || {};

    if (!userId) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "User ID is required",
        },
      });
    }

    const studentObjectId = mongoose.isValidObjectId(userId)
      ? new mongoose.Types.ObjectId(userId)
      : null;

    if (!studentObjectId) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid user ID",
        },
      });
    }

    // Get student profile
    const profile = await StudentProfile.findOne({ user: studentObjectId })
      .populate("user", "fullName email")
      .lean();

    if (!profile) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Profile not found",
        },
      });
    }

    // Calculate profile completion percentage
    const profileFields = [
      "headline",
      "bio",
      "phone",
      "location",
      "skills",
      "experience",
      "education",
      "resumeUrl",
      "portfolioUrl",
      "linkedinUrl",
      "socialLinks",
    ];

    const completedFields = profileFields.filter((field) => {
      const value = profile[field];
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === "object" && value !== null) {
        return Object.keys(value).length > 0;
      }
      return !!value;
    });

    const completionPercentage = Math.round(
      (completedFields.length / profileFields.length) * 100
    );

    // Get skills with levels (if stored in metadata)
    const skills = (profile.skills || []).map((skill) => ({
      name: skill,
      level: profile.metadata?.skillLevels?.[skill] || "intermediate",
      verified: false,
    }));

    // Get achievements
    const studentPoints = await StudentPoints.findOne({
      student: studentObjectId,
    }).lean();
    const achievements = (studentPoints?.badges || []).map((badge) => ({
      id: badge,
      label: badge.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      description: `Earned ${badge} badge`,
      icon: getBadgeIcon(badge),
    }));

    // Get learning timeline
    const enrollments = await Enrollment.find({ student: studentObjectId })
      .populate("course", "title")
      .sort({ enrolledAt: -1 })
      .limit(10)
      .lean()
      .lean();

    const timeline = enrollments.map((enrollment) => ({
      id: enrollment._id.toString(),
      type: "enrollment",
      title: `Enrolled in ${enrollment.course?.title || "Course"}`,
      date: enrollment.enrolledAt,
      courseId: enrollment.course?._id?.toString(),
    }));

    // Get course completions
    const completions = await LessonCompletion.find({
      student: studentObjectId,
    })
      .populate("course", "title")
      .sort({ completedAt: -1 })
      .limit(10)
      .lean()
      .lean();

    completions.forEach((completion) => {
      timeline.push({
        id: completion._id.toString(),
        type: "completion",
        title: `Completed lesson in ${completion.course?.title || "Course"}`,
        date: completion.completedAt,
        courseId: completion.course?._id?.toString(),
      });
    });

    timeline.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Get social links verification status
    const socialLinks = (profile.socialLinks || []).map((link) => ({
      platform: link.platform,
      url: link.url,
      verified: link.verified || false,
      verifiedAt: link.verifiedAt || null,
    }));

    // Check if viewing own profile
    const isOwnProfile = authUserId && authUserId.toString() === userId;

    return res.json({
      profile: {
        ...profile,
        completionPercentage,
        skills,
        achievements,
        timeline: timeline.slice(0, 20),
        socialLinks,
        isOwnProfile,
      },
    });
  } catch (error) {
    return next(error);
  }
};

// Helper function to get badge icon
function getBadgeIcon(badge) {
  const badgeIcons = {
    "first-quiz": "🎯",
    "course-complete": "🎓",
    "week-streak": "🔥",
    "month-streak": "⭐",
    "top-learner": "🏆",
    "social-verified": "✅",
    "early-adopter": "🚀",
  };
  return badgeIcons[badge] || "🏅";
}

// Helper function to format time ago
function formatTimeAgo(date) {
  if (!date) return "Recently";
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now - past) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} mins ago`;
  if (diffInSeconds < 86400)
    return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800)
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  if (diffInSeconds < 2592000)
    return `${Math.floor(diffInSeconds / 604800)} weeks ago`;
  return `${Math.floor(diffInSeconds / 2592000)} months ago`;
}
