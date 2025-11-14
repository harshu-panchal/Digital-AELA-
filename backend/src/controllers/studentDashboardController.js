import mongoose from "mongoose";
import Enrollment from "../models/Enrollment.js";
import LessonCompletion from "../models/LessonCompletion.js";
import StudentPoints from "../models/StudentPoints.js";
import SpeakingAssessment from "../models/SpeakingAssessment.js";
import Course from "../models/Course.js";

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
    let lessonCompletions = [];
    try {
      lessonCompletions = await LessonCompletion.find({ student: studentObjectId });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error fetching lesson completions:", error);
      lessonCompletions = [];
    }
    
    const totalLearningHours = lessonCompletions.reduce((total, completion) => {
      return total + (completion.duration || 0) / 60; // Convert minutes to hours
    }, 0);

    // Calculate hours this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const thisMonthCompletions = lessonCompletions.filter(
      (c) => new Date(c.completedAt) >= startOfMonth
    );
    const hoursThisMonth = thisMonthCompletions.reduce((total, completion) => {
      return total + (completion.duration || 0) / 60;
    }, 0);

    // Get Active Courses
    let activeEnrollments = [];
    try {
      activeEnrollments = await Enrollment.find({
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
        .sort({ lastAccessedAt: -1, enrolledAt: -1 });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error fetching enrollments:", error);
      activeEnrollments = [];
    }

    const activeCoursesCount = activeEnrollments.length;

    // Get courses with upcoming sessions (this week)
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    // This is a placeholder - you'd need a Session model for real data
    const liveCohortsThisWeek = 0; // TODO: Implement when Session model exists

    // Get AELA Coins
    let studentPoints = null;
    try {
      studentPoints = await StudentPoints.findOne({ student: studentObjectId });
      if (!studentPoints) {
        // Create default points record
        try {
          studentPoints = await StudentPoints.create({
            student: studentObjectId,
            totalCoins: 0,
            redeemedCoins: 0,
            pendingCoins: 0,
            streak: 0,
          });
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
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error fetching student points:", error);
      studentPoints = {
        totalCoins: 0,
        redeemedCoins: 0,
        pendingCoins: 0,
        streak: 0,
      };
    }

    const totalCoins = studentPoints.totalCoins || 0;
    const pendingCoins = studentPoints.pendingCoins || 0;
    const availableCoins = totalCoins - (studentPoints.redeemedCoins || 0);

    // Get Speaking Score (latest assessment)
    let latestAssessment = null;
    try {
      latestAssessment = await SpeakingAssessment.findOne({ student: studentObjectId })
        .sort({ createdAt: -1 });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error fetching speaking assessment:", error);
      latestAssessment = null;
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
        delta: hoursThisMonth > 0 ? `+${hoursThisMonth.toFixed(1)} hours this month` : "No activity this month",
      },
      {
        id: "activeCourses",
        label: "Active Courses",
        value: activeCoursesCount.toString(),
        delta: liveCohortsThisWeek > 0 ? `${liveCohortsThisWeek} live cohorts this week` : "No live sessions",
      },
      {
        id: "aelaCoins",
        label: "AELA Coins",
        value: availableCoins.toString(),
        delta: pendingCoins > 0 ? `+${pendingCoins} coins pending redemption` : "All coins available",
      },
      {
        id: "speakingScore",
        label: "Speaking Score",
        value: speakingScore ? `${speakingScore.toFixed(1)} / 10` : "Not assessed",
        delta: streak > 0 ? "Consistent streak · Keep it up!" : "Start your learning journey",
      },
    ];

    // Get ongoing courses with progress
    const ongoingCourses = await Promise.all(
      activeEnrollments.slice(0, 5).map(async (enrollment) => {
        const course = enrollment.course;
        if (!course || !course._id) return null;

        // Calculate progress from lesson completions
        const courseCompletions = await LessonCompletion.find({
          student: studentObjectId,
          course: course._id,
        });
        // This is simplified - you'd need total lessons in course for real progress
        const progress = enrollment.progress || 0;

        // Get instructor name if available
        let instructorName = "Instructor";
        if (course.instructor) {
          if (typeof course.instructor === "object" && course.instructor.fullName) {
            instructorName = course.instructor.fullName;
          } else if (typeof course.instructor === "string") {
            // If instructor is just an ID, we'd need to populate it
            instructorName = "Instructor";
          }
        }

        return {
          id: course._id.toString(),
          title: course.title || "Untitled Course",
          mentor: instructorName,
          progress: Math.round(progress),
          nextSession: "Check schedule", // TODO: Get from Session model
          access: enrollment.status === "active" ? "Active enrollment" : enrollment.status,
          route: `/learn-earn/courses/${course._id}`,
        };
      })
    );

    // Get Learn & Earn progress
    const learnEarnProgress = {
      streak: streak,
      leaderboardPosition: studentPoints.leaderboardPosition || 0,
      coinsToRedeem: availableCoins,
      redeemRoute: "/learn-earn/wallet",
      badges: (studentPoints.badges || []).map((badge) => ({
        label: badge.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        description: `Earned ${badge} badge`,
        icon: "🏆",
      })),
    };

    return res.json({
      journeyStats,
      ongoingCourses: ongoingCourses.filter(Boolean),
      learnEarnProgress,
      // Other dashboard sections can be added here
    });
  } catch (error) {
    return next(error);
  }
};

