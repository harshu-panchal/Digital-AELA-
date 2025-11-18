import mongoose from "mongoose";
import Enrollment from "../models/Enrollment.js";
import LessonCompletion from "../models/LessonCompletion.js";
import StudentPoints from "../models/StudentPoints.js";
import SpeakingAssessment from "../models/SpeakingAssessment.js";
import Course from "../models/Course.js";
import Quiz from "../models/Quiz.js";
import EbookResource from "../models/EbookResource.js";
import RecruiterBlog from "../models/RecruiterBlog.js";
import JobPost from "../models/JobPost.js";
import User from "../models/User.js";
import StudentProfile from "../models/StudentProfile.js";

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
    const redeemedCoins = studentPoints.redeemedCoins || 0;
    const availableCoins = totalCoins - redeemedCoins;

    // Calculate totalEarned from transactions (sum of all earned and bonus transactions)
    let totalEarned = 0;
    if (studentPoints.transactions && Array.isArray(studentPoints.transactions)) {
      totalEarned = studentPoints.transactions
        .filter((txn) => txn.type === "earned" || txn.type === "bonus")
        .reduce((sum, txn) => sum + (txn.amount || 0), 0);
    }

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
      totalCoins: totalCoins,
      totalEarned: totalEarned,
      totalRedeemed: redeemedCoins,
      redeemRoute: "/learn-earn/wallet",
      badges: (studentPoints.badges || []).map((badge) => ({
        label: badge.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        description: `Earned ${badge} badge`,
        icon: "🏆",
      })),
    };

    // Get Quiz Challenges (top 3 published quizzes)
    let quizChallenges = [];
    try {
      const quizzes = await Quiz.find({ status: "published" })
        .sort({ createdAt: -1 })
        .limit(3)
        .lean();
      
      quizChallenges = quizzes.map((quiz) => {
        const difficultyMap = {
          beginner: "Beginner",
          intermediate: "Intermediate",
          advanced: "Advanced",
          "all-levels": "All Levels",
        };
        
        return {
          id: quiz._id.toString(),
          title: quiz.title,
          reward: `+${quiz.rewardCoins || 0} coins`,
          closing: quiz.difficulty ? `${difficultyMap[quiz.difficulty] || quiz.difficulty} challenge` : "Daily challenge",
          playRoute: `/learn-earn/quiz/${quiz._id}`,
        };
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error fetching quizzes:", error);
      quizChallenges = [];
    }

    // Get Marketplace Picks (top 3 published courses and ebooks)
    let marketplaceHighlights = [];
    try {
      const [courses, ebooks] = await Promise.all([
        Course.find({ status: "published" })
          .populate("instructor", "fullName")
          .sort({ createdAt: -1 })
          .limit(2)
          .lean(),
        EbookResource.find({ isPublic: true })
          .sort({ publishedAt: -1, createdAt: -1 })
          .limit(1)
          .lean(),
      ]);

      const courseItems = courses.map((course) => ({
        id: course._id.toString(),
        type: "Course",
        tag: "Best Seller",
        title: course.title,
        mentor: course.instructor?.fullName || "Instructor",
        price: `AED ${course.price || 0}`,
        to: `/learn-earn/courses/${course._id}`,
      }));

      const ebookItems = ebooks.map((ebook) => ({
        id: ebook._id.toString(),
        type: "E-Book",
        tag: "Top Rated",
        title: ebook.title,
        mentor: ebook.metadata?.author || "Digital AELA",
        price: ebook.metadata?.price ? `AED ${ebook.metadata.price}` : "Free",
        to: `/books/${ebook._id}/payment`,
      }));

      marketplaceHighlights = [...courseItems, ...ebookItems].slice(0, 3);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error fetching marketplace items:", error);
      marketplaceHighlights = [];
    }

    // Get Library Picks (top 3 public ebooks)
    let ebookShelf = [];
    try {
      const ebooks = await EbookResource.find({ isPublic: true })
        .sort({ publishedAt: -1, createdAt: -1 })
        .limit(3)
        .lean();
      
      ebookShelf = ebooks.map((ebook) => ({
        id: ebook._id.toString(),
        title: ebook.title,
        pages: ebook.pages || 0,
        to: `/books/${ebook._id}/payment`,
      }));
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error fetching library ebooks:", error);
      ebookShelf = [];
    }

    // Get Latest Blogs (top 3 published blogs)
    let blogFeed = [];
    try {
      const blogs = await RecruiterBlog.find({ status: "published" })
        .populate("author", "fullName")
        .sort({ publishedAt: -1, createdAt: -1 })
        .limit(3)
        .lean();
      
      blogFeed = blogs.map((blog) => {
        const publishedDate = blog.publishedAt || blog.createdAt;
        const timeAgo = formatTimeAgo(publishedDate);
        
        return {
          id: blog._id.toString(),
          title: blog.title,
          author: blog.author?.fullName || "Author",
          time: timeAgo,
          to: `/blogs/${blog._id}`,
        };
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error fetching blogs:", error);
      blogFeed = [];
    }

    // Get Job Matches (top 3 published jobs)
    let jobsBoard = [];
    try {
      const jobs = await JobPost.find({ status: "published" })
        .sort({ publishedAt: -1, createdAt: -1 })
        .limit(3)
        .lean();
      
      jobsBoard = jobs.map((job) => {
        const publishedDate = job.publishedAt || job.createdAt;
        const timeAgo = formatTimeAgo(publishedDate);
        const employmentType = job.employmentType || "full-time";
        const location = job.isRemote ? "Remote" : job.location || "Location TBD";
        
        return {
          id: job._id.toString(),
          title: job.title,
          company: job.company,
          type: employmentType.charAt(0).toUpperCase() + employmentType.slice(1).replace("-", " "),
          posted: timeAgo,
          to: `/explore-jobs/jobs/${job._id}`,
        };
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error fetching jobs:", error);
      jobsBoard = [];
    }

    // Get Student Profiles (top 3 students)
    let studentProfiles = [];
    try {
      const students = await User.find({ role: "student", isActive: true })
        .select("fullName")
        .limit(3)
        .lean();
      
      studentProfiles = students.map((student, index) => {
        const focuses = ["IELTS Scholar", "Debate Captain", "Blog Creator", "Speaking Champion", "Grammar Master"];
        return {
          id: student._id.toString(),
          name: student.fullName,
          focus: focuses[index % focuses.length],
          to: `/community/students/${student._id}`,
        };
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error fetching students:", error);
      studentProfiles = [];
    }

    // Get Teachers (top 2 teachers)
    let teacherSpotlight = [];
    try {
      const teachers = await User.find({ role: "teacher", isActive: true })
        .select("fullName metadata")
        .limit(2)
        .lean();
      
      teacherSpotlight = teachers.map((teacher) => ({
        id: teacher._id.toString(),
        name: teacher.fullName,
        expertise: teacher.metadata?.expertise || "English Language",
        to: `/community/teachers/${teacher._id}`,
      }));
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error fetching teachers:", error);
      teacherSpotlight = [];
    }

    // Get Recruiters (top 2 recruiters)
    let recruiterSpotlight = [];
    try {
      const recruiters = await User.find({ role: "recruiter", isActive: true })
        .select("fullName metadata")
        .limit(2)
        .lean();
      
      recruiterSpotlight = recruiters.map((recruiter) => ({
        id: recruiter._id.toString(),
        name: recruiter.fullName,
        roles: recruiter.metadata?.company || "Talent Partner",
        to: `/community/recruiters/${recruiter._id}`,
      }));
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error fetching recruiters:", error);
      recruiterSpotlight = [];
    }

    return res.json({
      journeyStats,
      ongoingCourses: ongoingCourses.filter(Boolean),
      learnEarnProgress,
      quizChallenges,
      marketplaceHighlights,
      ebookShelf,
      blogFeed,
      jobsBoard,
      studentProfiles,
      teacherSpotlight,
      recruiterSpotlight,
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
    const user = await User.findById(studentObjectId).select("fullName email metadata").lean();
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
    const availableCoins = totalCoins - redeemedCoins;

    // Calculate totalEarned from transactions (sum of all earned and bonus transactions)
    let totalEarned = 0;
    if (studentPoints?.transactions && Array.isArray(studentPoints.transactions)) {
      totalEarned = studentPoints.transactions
        .filter((txn) => txn.type === "earned" || txn.type === "bonus")
        .reduce((sum, txn) => sum + (txn.amount || 0), 0);
    }

    // Get streak (public stat)
    const streak = studentPoints?.streak || 0;

    // Calculate Learning Hours (public stat)
    let lessonCompletions = [];
    try {
      lessonCompletions = await LessonCompletion.find({ student: studentObjectId });
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
      latestAssessment = await SpeakingAssessment.findOne({ student: studentObjectId })
        .sort({ createdAt: -1 });
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
        speakingScore: speakingScore ? parseFloat(speakingScore.toFixed(1)) : null,
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

    // Get student points for achievements
    let studentPoints = null;
    try {
      studentPoints = await StudentPoints.findOne({ student: studentObjectId });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error fetching student points:", error);
    }

    // Recent Activity Widget - Get last 7 days of activity
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentActivities = [];
    
    // Get recent enrollments
    const recentEnrollments = await Enrollment.find({
      student: studentObjectId,
      enrolledAt: { $gte: sevenDaysAgo },
    })
      .populate("course", "title")
      .sort({ enrolledAt: -1 })
      .limit(5)
      .lean();
    
    recentEnrollments.forEach((enrollment) => {
      recentActivities.push({
        id: enrollment._id.toString(),
        type: "enrollment",
        title: `Enrolled in ${enrollment.course?.title || "Course"}`,
        timestamp: enrollment.enrolledAt,
        icon: "📚",
      });
    });

    // Get recent lesson completions
    const recentCompletions = await LessonCompletion.find({
      student: studentObjectId,
      completedAt: { $gte: sevenDaysAgo },
    })
      .populate("course", "title")
      .sort({ completedAt: -1 })
      .limit(5)
      .lean();
    
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
    recentActivities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
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
    const weeklyProgress = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayCompletions = await LessonCompletion.find({
        student: studentObjectId,
        completedAt: { $gte: date, $lt: nextDate },
      });

      const hours = dayCompletions.reduce((total, completion) => {
        return total + (completion.duration || 0) / 60;
      }, 0);

      weeklyProgress.push({
        date: date.toISOString().split("T")[0],
        day: date.toLocaleDateString("en-US", { weekday: "short" }),
        hours: parseFloat(hours.toFixed(1)),
        lessons: dayCompletions.length,
      });
    }

    // Learning Goals Widget
    const totalLearningHours = await LessonCompletion.find({ student: studentObjectId })
      .then((completions) => {
        return completions.reduce((total, completion) => {
          return total + (completion.duration || 0) / 60;
        }, 0);
      });

    const activeCourses = await Enrollment.countDocuments({
      student: studentObjectId,
      status: "active",
    });

    const learningGoals = {
      weeklyHours: {
        current: weeklyProgress.reduce((sum, day) => sum + day.hours, 0),
        target: 10, // Default target, can be customized
        unit: "hours",
      },
      coursesCompleted: {
        current: await Enrollment.countDocuments({
          student: studentObjectId,
          status: "completed",
        }),
        target: 5, // Default target
        unit: "courses",
      },
      streak: {
        current: studentPoints?.streak || 0,
        target: 30, // Default target
        unit: "days",
      },
    };

    // Course Recommendations Widget
    const enrolledCourseIds = await Enrollment.find({ student: studentObjectId })
      .select("course")
      .lean()
      .then((enrollments) => enrollments.map((e) => e.course));

    const recommendations = await Course.find({
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
    const studentPoints = await StudentPoints.findOne({ student: studentObjectId });
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
      .lean();

    const timeline = enrollments.map((enrollment) => ({
      id: enrollment._id.toString(),
      type: "enrollment",
      title: `Enrolled in ${enrollment.course?.title || "Course"}`,
      date: enrollment.enrolledAt,
      courseId: enrollment.course?._id?.toString(),
    }));

    // Get course completions
    const completions = await LessonCompletion.find({ student: studentObjectId })
      .populate("course", "title")
      .sort({ completedAt: -1 })
      .limit(10)
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
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)} weeks ago`;
  return `${Math.floor(diffInSeconds / 2592000)} months ago`;
}

