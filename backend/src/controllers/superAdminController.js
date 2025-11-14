import mongoose from "mongoose";
import User from "../models/User.js";
import Course from "../models/Course.js";
import EbookResource from "../models/EbookResource.js";
import JobPost from "../models/JobPost.js";
import Enrollment from "../models/Enrollment.js";
import JobApplication from "../models/JobApplication.js";
import LessonCompletion from "../models/LessonCompletion.js";
import RecruiterBlog from "../models/RecruiterBlog.js";

/**
 * Get super admin dashboard statistics
 */
export const getDashboardStats = async (req, res, next) => {
  try {
    const { userRole } = req.auth;

    if (userRole !== "super-admin") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only super admins can access this endpoint",
        },
      });
    }

    // Get current date ranges
    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Count active learners (students with enrollments or activity in last 30 days)
    const activeLearners = await User.countDocuments({
      role: "student",
      isActive: true,
    });

    const learnersLastWeek = await User.countDocuments({
      role: "student",
      isActive: true,
      createdAt: { $gte: lastWeek },
    });

    const learnersLastMonth = await User.countDocuments({
      role: "student",
      isActive: true,
      createdAt: { $gte: lastMonth },
    });

    const learnersDelta = learnersLastMonth > 0
      ? `+${((learnersLastWeek / learnersLastMonth) * 100).toFixed(1)}% vs last week`
      : `${learnersLastWeek} new this week`;

    // Count verified teachers
    const verifiedTeachers = await User.countDocuments({
      role: "teacher",
      isActive: true,
    });

    const pendingTeachers = await User.countDocuments({
      role: "teacher",
      isActive: false,
    });

    // Calculate monthly revenue (from enrollments with paid courses)
    const enrollmentsThisMonth = await Enrollment.find({
      createdAt: { $gte: thisMonthStart },
    }).populate({
      path: "course",
      select: "price currency",
    });

    let monthlyRevenue = 0;
    const revenueByCurrency = {};

    enrollmentsThisMonth.forEach((enrollment) => {
      if (enrollment.course && enrollment.course.price) {
        const price = enrollment.course.price;
        const currency = enrollment.course.currency || "AED";
        monthlyRevenue += price;
        revenueByCurrency[currency] = (revenueByCurrency[currency] || 0) + price;
      }
    });

    // Format revenue (use most common currency or AED)
    const primaryCurrency = Object.keys(revenueByCurrency).length > 0
      ? Object.keys(revenueByCurrency).reduce((a, b) =>
          revenueByCurrency[a] > revenueByCurrency[b] ? a : b
        )
      : "AED";

    const revenueFormatted = monthlyRevenue >= 1000
      ? `${primaryCurrency} ${(monthlyRevenue / 1000).toFixed(1)}K`
      : `${primaryCurrency} ${Math.round(monthlyRevenue)}`;

    // Calculate revenue growth (compare with last month)
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const enrollmentsLastMonth = await Enrollment.countDocuments({
      createdAt: { $gte: lastMonthStart, $lt: thisMonthStart },
    });

    const revenueDelta = enrollmentsLastMonth > 0
      ? `+${((enrollmentsThisMonth.length / enrollmentsLastMonth) * 100).toFixed(0)}% vs last month`
      : "New this month";

    // Count open jobs
    const openJobs = await JobPost.countDocuments({
      status: "published",
    });

    const newJobsThisWeek = await JobPost.countDocuments({
      status: "published",
      createdAt: { $gte: lastWeek },
    });

    const jobsDelta = `${newJobsThisWeek} new this week`;

    return res.json({
      stats: [
        {
          id: "learners",
          label: "Active Learners",
          value: activeLearners.toLocaleString(),
          delta: learnersDelta,
        },
        {
          id: "teachers",
          label: "Verified Teachers",
          value: verifiedTeachers.toString(),
          delta: pendingTeachers > 0 ? `${pendingTeachers} pending approvals` : "All verified",
        },
        {
          id: "revenue",
          label: "Monthly Revenue",
          value: revenueFormatted,
          delta: revenueDelta,
        },
        {
          id: "jobs",
          label: "Open Jobs",
          value: openJobs.toString(),
          delta: jobsDelta,
        },
      ],
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get pending approvals (courses, ebooks, jobs)
 */
export const getPendingApprovals = async (req, res, next) => {
  try {
    const { userRole } = req.auth;

    if (userRole !== "super-admin") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only super admins can access this endpoint",
        },
      });
    }

    // Get courses pending approval (draft status)
    const pendingCourses = await Course.find({
      status: "draft",
    })
      .populate("instructor", "fullName")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Get ebooks pending approval (we'll use a metadata field or check if publishedAt is null)
    // For now, we'll get recent ebooks that might need review
    const pendingEbooks = await EbookResource.find({
      isPublic: false, // Assuming non-public ebooks need approval
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Get job posts pending approval (draft status)
    const pendingJobs = await JobPost.find({
      status: "draft",
    })
      .populate("owner", "fullName")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Format time ago
    const formatTimeAgo = (date) => {
      const now = new Date();
      const diffMs = now - new Date(date);
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins} min ago`;
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return `${diffDays} days ago`;
      return new Date(date).toLocaleDateString();
    };

    return res.json({
      approvals: [
        {
          id: "courses",
          title: "Courses Pending Approval",
          items: pendingCourses.map((course) => ({
            id: course._id.toString(),
            title: course.title,
            owner: course.instructor?.fullName || "Unknown",
            submitted: formatTimeAgo(course.createdAt),
          })),
          cta: "Review courses",
        },
        {
          id: "ebooks",
          title: "Books & E-Books",
          items: pendingEbooks.map((ebook) => ({
            id: ebook._id.toString(),
            title: ebook.title,
            owner: "System", // Ebooks don't have an owner field yet
            submitted: formatTimeAgo(ebook.createdAt),
          })),
          cta: "Moderate library",
        },
        {
          id: "jobs",
          title: "Job Posts",
          items: pendingJobs.map((job) => ({
            id: job._id.toString(),
            title: `${job.title} · ${job.location || "Remote"}`,
            owner: job.owner?.fullName || job.company || "Unknown",
            submitted: formatTimeAgo(job.createdAt),
          })),
          cta: "Moderate job board",
        },
      ],
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get recent activity feed
 */
export const getRecentActivity = async (req, res, next) => {
  try {
    const { userRole } = req.auth;

    if (userRole !== "super-admin") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only super admins can access this endpoint",
        },
      });
    }

    const activities = [];

    // Recent enrollments
    const recentEnrollments = await Enrollment.find()
      .populate("student", "fullName")
      .populate("course", "title")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    recentEnrollments.forEach((enrollment) => {
      activities.push({
        icon: "🎓",
        title: "New course enrollment",
        description: `${enrollment.student?.fullName || "Student"} enrolled in ${enrollment.course?.title || "Course"}`,
        time: enrollment.createdAt,
        type: "enrollment",
      });
    });

    // Recent course completions
    const recentCompletions = await LessonCompletion.aggregate([
      {
        $group: {
          _id: "$student",
          lastCompleted: { $max: "$completedAt" },
          courseId: { $first: "$course" },
        },
      },
      { $sort: { lastCompleted: -1 } },
      { $limit: 5 },
    ]);

    for (const completion of recentCompletions) {
      const student = await User.findById(completion._id).select("fullName").lean();
      const course = await Course.findById(completion.courseId).select("title").lean();
      activities.push({
        icon: "✅",
        title: "Course completion",
        description: `${student?.fullName || "Student"} completed ${course?.title || "course"}`,
        time: completion.lastCompleted,
        type: "completion",
      });
    }

    // Recent job applications
    const recentApplications = await JobApplication.find()
      .populate("applicant", "fullName")
      .populate("job", "title company")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    recentApplications.forEach((application) => {
      activities.push({
        icon: "💼",
        title: "New job application",
        description: `${application.applicant?.fullName || "Applicant"} applied for ${application.job?.title || "position"} at ${application.job?.company || "company"}`,
        time: application.createdAt,
        type: "application",
      });
    });

    // Recent blog posts
    const recentBlogs = await RecruiterBlog.find({ status: "published" })
      .populate("author", "fullName")
      .sort({ publishedAt: -1 })
      .limit(3)
      .lean();

    recentBlogs.forEach((blog) => {
      activities.push({
        icon: "📝",
        title: "New blog published",
        description: `${blog.author?.fullName || "Author"} published "${blog.title}"`,
        time: blog.publishedAt || blog.createdAt,
        type: "blog",
      });
    });

    // Sort by time and limit to 20 most recent
    activities.sort((a, b) => new Date(b.time) - new Date(a.time));
    const limitedActivities = activities.slice(0, 20);

    // Format time
    const formatTime = (date) => {
      const now = new Date();
      const diffMs = now - new Date(date);
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins} min ago`;
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
      if (diffDays === 0) return "Today, " + new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      if (diffDays === 1) return "Yesterday";
      return new Date(date).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    };

    return res.json({
      activities: limitedActivities.map((activity) => ({
        ...activity,
        time: formatTime(activity.time),
      })),
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get all dashboard data in one call
 */
export const getDashboardData = async (req, res, next) => {
  try {
    const { userRole } = req.auth || {};

    if (!req.auth || userRole !== "super-admin") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only super admins can access this endpoint",
        },
      });
    }

    // Get current date ranges
    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // Helper function to safely execute queries
    const safeQuery = async (queryFn, defaultValue) => {
      try {
        return await queryFn();
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("[SuperAdmin] Query error:", error.message);
        return defaultValue;
      }
    };

    // Get all data in parallel with error handling
    const [
      activeLearners,
      learnersLastWeek,
      learnersLastMonth,
      verifiedTeachers,
      pendingTeachers,
      enrollmentsThisMonth,
      enrollmentsLastMonth,
      openJobs,
      newJobsThisWeek,
      pendingCourses,
      pendingEbooks,
      pendingJobs,
      recentEnrollments,
      recentCompletions,
      recentApplications,
      recentBlogs,
    ] = await Promise.all([
      safeQuery(() => User.countDocuments({ role: "student", isActive: true }), 0),
      safeQuery(() => User.countDocuments({ role: "student", isActive: true, createdAt: { $gte: lastWeek } }), 0),
      safeQuery(() => User.countDocuments({ role: "student", isActive: true, createdAt: { $gte: lastMonth } }), 0),
      safeQuery(() => User.countDocuments({ role: "teacher", isActive: true }), 0),
      safeQuery(() => User.countDocuments({ role: "teacher", isActive: false }), 0),
      safeQuery(() => Enrollment.find({ createdAt: { $gte: thisMonthStart } }).populate("course", "price currency").lean(), []),
      safeQuery(() => Enrollment.countDocuments({ createdAt: { $gte: lastMonthStart, $lt: thisMonthStart } }), 0),
      safeQuery(() => JobPost.countDocuments({ status: "published" }), 0),
      safeQuery(() => JobPost.countDocuments({ status: "published", createdAt: { $gte: lastWeek } }), 0),
      safeQuery(() => Course.find({ status: "draft" }).populate("instructor", "fullName").sort({ createdAt: -1 }).limit(10).lean(), []),
      safeQuery(() => EbookResource.find({ isPublic: false }).sort({ createdAt: -1 }).limit(10).lean(), []),
      safeQuery(() => JobPost.find({ status: "draft" }).populate("owner", "fullName").sort({ createdAt: -1 }).limit(10).lean(), []),
      safeQuery(() => Enrollment.find().populate("student", "fullName").populate("course", "title").sort({ createdAt: -1 }).limit(5).lean(), []),
      safeQuery(() => LessonCompletion.aggregate([
        { $group: { _id: "$student", lastCompleted: { $max: "$completedAt" }, courseId: { $first: "$course" } } },
        { $sort: { lastCompleted: -1 } },
        { $limit: 5 },
      ]), []),
      safeQuery(() => JobApplication.find().populate("applicant", "fullName").populate("job", "title company").sort({ createdAt: -1 }).limit(5).lean(), []),
      safeQuery(() => RecruiterBlog.find({ status: "published" }).populate("author", "fullName").sort({ publishedAt: -1 }).limit(3).lean(), []),
    ]);

    // Calculate revenue
    let monthlyRevenue = 0;
    const revenueByCurrency = {};
    enrollmentsThisMonth.forEach((enrollment) => {
      if (enrollment.course && enrollment.course.price) {
        const price = enrollment.course.price;
        const currency = enrollment.course.currency || "AED";
        monthlyRevenue += price;
        revenueByCurrency[currency] = (revenueByCurrency[currency] || 0) + price;
      }
    });

    const primaryCurrency = Object.keys(revenueByCurrency).length > 0
      ? Object.keys(revenueByCurrency).reduce((a, b) => revenueByCurrency[a] > revenueByCurrency[b] ? a : b)
      : "AED";

    const revenueFormatted = monthlyRevenue >= 1000
      ? `${primaryCurrency} ${(monthlyRevenue / 1000).toFixed(1)}K`
      : `${primaryCurrency} ${Math.round(monthlyRevenue)}`;

    const learnersDelta = learnersLastMonth > 0
      ? `+${((learnersLastWeek / learnersLastMonth) * 100).toFixed(1)}% vs last week`
      : `${learnersLastWeek} new this week`;

    const revenueDelta = enrollmentsLastMonth > 0
      ? `+${((enrollmentsThisMonth.length / enrollmentsLastMonth) * 100).toFixed(0)}% vs last month`
      : "New this month";

    const formatTimeAgo = (date) => {
      const diffMs = now - new Date(date);
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);
      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins} min ago`;
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return `${diffDays} days ago`;
      return new Date(date).toLocaleDateString();
    };

    const formatTime = (date) => {
      const diffMs = now - new Date(date);
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);
      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins} min ago`;
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
      if (diffDays === 0) return "Today, " + new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      if (diffDays === 1) return "Yesterday";
      return new Date(date).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    };

    // Build activities with timestamps for sorting
    const activities = [];
    
    recentEnrollments.forEach((enrollment) => {
      activities.push({
        icon: "🎓",
        title: "New course enrollment",
        description: `${enrollment.student?.fullName || "Student"} enrolled in ${enrollment.course?.title || "Course"}`,
        time: formatTime(enrollment.createdAt),
        timestamp: enrollment.createdAt,
        type: "enrollment",
      });
    });

    for (const completion of recentCompletions || []) {
      try {
        const student = await User.findById(completion._id).select("fullName").lean();
        const course = await Course.findById(completion.courseId).select("title").lean();
        if (completion.lastCompleted) {
          activities.push({
            icon: "✅",
            title: "Course completion",
            description: `${student?.fullName || "Student"} completed ${course?.title || "course"}`,
            time: formatTime(completion.lastCompleted),
            timestamp: completion.lastCompleted,
            type: "completion",
          });
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("[SuperAdmin] Error processing completion:", error.message);
        // Skip this completion
      }
    }

    recentApplications.forEach((application) => {
      activities.push({
        icon: "💼",
        title: "New job application",
        description: `${application.applicant?.fullName || "Applicant"} applied for ${application.job?.title || "position"} at ${application.job?.company || "company"}`,
        time: formatTime(application.createdAt),
        timestamp: application.createdAt,
        type: "application",
      });
    });

    recentBlogs.forEach((blog) => {
      activities.push({
        icon: "📝",
        title: "New blog published",
        description: `${blog.author?.fullName || "Author"} published "${blog.title}"`,
        time: formatTime(blog.publishedAt || blog.createdAt),
        timestamp: blog.publishedAt || blog.createdAt,
        type: "blog",
      });
    });

    // Sort by timestamp (most recent first) and remove timestamp from response
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const sortedActivities = activities.map(({ timestamp, ...rest }) => rest);

    const responseData = {
      stats: [
        {
          id: "learners",
          label: "Active Learners",
          value: (activeLearners || 0).toLocaleString(),
          delta: learnersDelta,
        },
        {
          id: "teachers",
          label: "Verified Teachers",
          value: (verifiedTeachers || 0).toString(),
          delta: (pendingTeachers || 0) > 0 ? `${pendingTeachers} pending approvals` : "All verified",
        },
        {
          id: "revenue",
          label: "Monthly Revenue",
          value: revenueFormatted,
          delta: revenueDelta,
        },
        {
          id: "jobs",
          label: "Open Jobs",
          value: (openJobs || 0).toString(),
          delta: `${newJobsThisWeek || 0} new this week`,
        },
      ],
      approvals: [
        {
          id: "courses",
          title: "Courses Pending Approval",
          items: (pendingCourses || []).map((course) => ({
            id: course._id?.toString() || course.id || "",
            title: course.title || "Untitled",
            owner: course.instructor?.fullName || "Unknown",
            submitted: formatTimeAgo(course.createdAt || new Date()),
          })),
          cta: "Review courses",
        },
        {
          id: "ebooks",
          title: "Books & E-Books",
          items: (pendingEbooks || []).map((ebook) => ({
            id: ebook._id?.toString() || ebook.id || "",
            title: ebook.title || "Untitled",
            owner: "System",
            submitted: formatTimeAgo(ebook.createdAt || new Date()),
          })),
          cta: "Moderate library",
        },
        {
          id: "jobs",
          title: "Job Posts",
          items: (pendingJobs || []).map((job) => ({
            id: job._id?.toString() || job.id || "",
            title: `${job.title || "Untitled"} · ${job.location || "Remote"}`,
            owner: job.owner?.fullName || job.company || "Unknown",
            submitted: formatTimeAgo(job.createdAt || new Date()),
          })),
          cta: "Moderate job board",
        },
      ],
      activities: (sortedActivities || []).slice(0, 20),
    };

    // eslint-disable-next-line no-console
    console.log("[SuperAdmin] Dashboard data fetched successfully");
    return res.json(responseData);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[SuperAdmin] Error in getDashboardData:", error);
    return next(error);
  }
};

