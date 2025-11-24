import mongoose from "mongoose";
import Message from "../models/Message.js";
import Notification from "../models/Notification.js";
import LiveRoom from "../models/LiveRoom.js";
import StudentPoints from "../models/StudentPoints.js";
import User from "../models/User.js";
import StudentProfile from "../models/StudentProfile.js";
import Follow from "../models/Follow.js";
import UserRating from "../models/UserRating.js";
import QuizAttempt from "../models/QuizAttempt.js";

export const getDashboardData = async (req, res, next) => {
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

    const userObjectId = mongoose.isValidObjectId(userId)
      ? new mongoose.Types.ObjectId(userId)
      : null;

    if (!userObjectId) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid user ID",
        },
      });
    }

    // Get unread messages count
    let unreadMessagesCount = 0;
    try {
      unreadMessagesCount = await Message.countDocuments({
        recipient: userObjectId,
        isRead: false,
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error counting unread messages:", error);
      unreadMessagesCount = 0;
    }

    // Get recent messages (conversations)
    let recentMessages = [];
    try {
      recentMessages = await Message.aggregate([
        {
          $match: {
            $or: [{ sender: userObjectId }, { recipient: userObjectId }],
          },
        },
        {
          $sort: { createdAt: -1 },
        },
        {
          $group: {
            _id: {
              $cond: [
                { $eq: ["$sender", userObjectId] },
                "$recipient",
                "$sender",
              ],
            },
            lastMessage: { $first: "$$ROOT" },
            unreadCount: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ["$recipient", userObjectId] },
                      { $eq: ["$isRead", false] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
        {
          $limit: 10,
        },
      ]);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error fetching messages:", error);
      recentMessages = [];
    }

    // Populate user data for messages
    const messagesWithUsers = await Promise.all(
      recentMessages.map(async (conv) => {
        const otherUserId = conv._id;
        const otherUser = await User.findById(otherUserId).select("fullName email metadata");
        const profile = await StudentProfile.findOne({ user: otherUserId });
        const lastMsg = conv.lastMessage;
        // Get avatarUrl from user metadata, then profile, then fallback
        const avatarUrl = otherUser?.metadata?.avatarUrl || profile?.avatarUrl || `https://i.pravatar.cc/150?img=${otherUserId.toString().slice(-2)}`;

        return {
          id: `chat-${otherUserId.toString()}`,
          userId: otherUserId.toString(),
          name: otherUser?.fullName || "User",
          avatar: avatarUrl,
          preview: lastMsg.content || "No messages yet",
          unread: conv.unreadCount || 0,
          timestamp: formatTimeAgo(lastMsg.createdAt),
        };
      })
    );

    // Get notifications
    let notifications = [];
    try {
      notifications = await Notification.find({ user: userObjectId })
        .sort({ createdAt: -1 })
        .limit(20)
        .select("title description type isRead createdAt");
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error fetching notifications:", error);
      notifications = [];
    }

    const formattedNotifications = notifications.map((notif) => ({
      id: notif._id.toString(),
      title: notif.title,
      description: notif.description,
      time: formatTimeAgo(notif.createdAt),
      type: notif.type,
    }));

    // Get live debates and open rooms
    let liveDebates = [];
    let openRooms = [];
    try {
      liveDebates = await LiveRoom.find({
        type: "debate",
        status: { $in: ["scheduled", "live"] },
      })
        .populate("host", "fullName")
        .populate("speakers", "fullName")
        .sort({ scheduledStart: 1 })
        .limit(5);

      openRooms = await LiveRoom.find({
        type: "open-room",
        status: { $in: ["scheduled", "live"] },
      })
        .populate("host", "fullName")
        .sort({ createdAt: -1 })
        .limit(5);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error fetching live rooms:", error);
      liveDebates = [];
      openRooms = [];
    }

    const formattedDebates = liveDebates.map((debate) => ({
      id: debate._id.toString(),
      topic: debate.topic || debate.title,
      forVotes: debate.forVotes || 0,
      againstVotes: debate.againstVotes || 0,
      startInMinutes: debate.scheduledStart
        ? Math.max(0, Math.floor((debate.scheduledStart - new Date()) / 60000))
        : 0,
      scheduledStart: debate.scheduledStart || null,
      status: debate.status || "scheduled",
      speakers: (debate.speakers || []).map((s) => s.fullName || "Speaker"),
    }));

    const formattedRooms = openRooms.map((room) => ({
      id: room._id.toString(),
      title: room.title,
      host: room.host?.fullName || "Host",
      listeners: room.listeners || 0,
      winners: room.winners || [],
      status: room.status || "scheduled",
    }));

    // Get user streak from StudentPoints
    let streak = 0;
    try {
      const userPoints = await StudentPoints.findOne({ student: userObjectId });
      streak = userPoints?.streak || 0;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error fetching user streak:", error);
      streak = 0;
    }

    // Get leaderboard (top users by coins shared/earned) - OPTIMIZED
    let leaderboard = [];
    try {
      // Get top 10 users by totalCoins in one query, including transactions
      const topUsersPoints = await StudentPoints.find()
        .sort({ totalCoins: -1 })
        .limit(10)
        .populate("student", "fullName email")
        .select("student totalCoins transactions") // Explicitly select transactions
        .lean();

      if (topUsersPoints.length > 0) {
        // Extract user IDs for batch queries
        const userIds = topUsersPoints
          .map((points) => points.student?._id)
          .filter(Boolean);

        // Batch fetch all profiles in one query
        const profiles = await StudentProfile.find({ user: { $in: userIds } })
          .select("user avatarUrl")
          .lean();
        const profilesMap = new Map(profiles.map((p) => [p.user.toString(), p]));

        // Batch calculate ratings using aggregation (much faster than individual queries)
        const ratingsData = await QuizAttempt.aggregate([
          { $match: { student: { $in: userIds } } },
          {
            $group: {
              _id: "$student",
              avgScore: {
                $avg: {
                  $cond: [
                    { $and: [{ $gte: ["$score", 0] }, { $ne: ["$score", null] }] },
                    "$score",
                    null,
                  ],
                },
              },
            },
          },
        ]);
        const ratingsMap = new Map(
          ratingsData.map((r) => [
            r._id.toString(),
            r.avgScore ? Math.round((r.avgScore / 20) * 10) / 10 : 0,
          ])
        );

        // Build leaderboard response
        leaderboard = topUsersPoints
          .map((points) => {
            const user = points.student;
            if (!user) return null;

            const userId = user._id.toString();
            const profile = profilesMap.get(userId);
            const rating = ratingsMap.get(userId) || 0;

            // Calculate totalEarned from transactions (matching frontend expectation)
            let totalEarned = 0;
            if (points.transactions && Array.isArray(points.transactions)) {
              totalEarned = points.transactions
                .filter((txn) => txn.type === "earned" || txn.type === "bonus")
                .reduce((sum, txn) => sum + (txn.amount || 0), 0);
            }
            // Fallback to totalCoins if no transactions or totalEarned is 0
            const displayCoins = totalEarned > 0 ? totalEarned : (points.totalCoins || 0);

            return {
              id: userId,
              name: user.fullName || "User",
              avatar:
                profile?.avatarUrl ||
                `https://i.pravatar.cc/150?img=${userId.slice(-2)}`,
              coinsShared: 0, // TODO: Implement when coin sharing is tracked
              rating,
              totalCoins: displayCoins, // Use calculated totalEarned or totalCoins
              totalEarned: displayCoins, // Add totalEarned for frontend compatibility
            };
          })
          .filter(Boolean);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error fetching leaderboard:", error);
      leaderboard = [];
    }

    return res.json({
      messages: messagesWithUsers,
      unreadMessages: unreadMessagesCount,
      notifications: formattedNotifications,
      liveDebates: formattedDebates,
      openRooms: formattedRooms,
      leaderboard: leaderboard.filter(Boolean),
      streak: streak,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Search for learners/students
 */
export const searchLearners = async (req, res, next) => {
  try {
    const { q: searchQuery, page = 1, pageSize = 20 } = req.query;

    if (!searchQuery || !searchQuery.trim()) {
      return res.json({
        learners: [],
        pagination: {
          page: 1,
          pageSize: parseInt(pageSize),
          total: 0,
          totalPages: 0,
        },
      });
    }

    const query = searchQuery.trim();
    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    const limit = parseInt(pageSize);

    // Search in User model by fullName or _id (user ID)
    const userQueryConditions = [{ fullName: { $regex: query, $options: "i" } }];
    if (mongoose.isValidObjectId(query)) {
      userQueryConditions.push({ _id: new mongoose.Types.ObjectId(query) });
    }
    const userQuery = {
      role: "student",
      $or: userQueryConditions,
    };

    // Search in StudentProfile by interests, headline, bio
    const profileQuery = {
      $or: [
        { headline: { $regex: query, $options: "i" } },
        { bio: { $regex: query, $options: "i" } },
        { interests: { $in: [new RegExp(query, "i")] } },
      ],
    };

    // Find users matching the query
    const users = await User.find(userQuery)
      .select("fullName email role metadata _id")
      .limit(limit)
      .skip(skip)
      .lean();

    // Get user IDs
    const userIds = users.map((u) => u._id);

    // Find profiles that match and get their user IDs
    const matchingProfiles = await StudentProfile.find(profileQuery)
      .select("user headline bio interests avatarUrl")
      .lean();

    const profileUserIds = matchingProfiles.map((p) => p.user);

    // Combine user IDs and remove duplicates
    const allUserIds = [...new Set([...userIds.map((id) => id.toString()), ...profileUserIds.map((id) => id.toString())])];

    // Get unique users (limit to page size)
    const uniqueUserIds = allUserIds.slice(skip, skip + limit);

    // Fetch complete user and profile data
    const learnersData = await Promise.all(
      uniqueUserIds.map(async (userId) => {
        const user = await User.findById(userId).select("fullName email role metadata _id").lean();
        if (!user) return null;

        const profile = await StudentProfile.findOne({ user: userId }).lean();

        return {
          id: user._id.toString(),
          userId: user._id.toString(),
          name: user.fullName,
          fullName: user.fullName,
          email: user.email,
          avatar: profile?.avatarUrl || user.metadata?.avatarUrl || `https://i.pravatar.cc/150?img=${user._id.toString().slice(-2)}`,
          avatarUrl: profile?.avatarUrl || user.metadata?.avatarUrl,
          title: profile?.headline || null,
          headline: profile?.headline || null,
          bio: profile?.bio || null,
          interests: profile?.interests || [],
        };
      })
    );

    const learners = learnersData.filter(Boolean);

    // Get total count for pagination
    const totalUsers = await User.countDocuments(userQuery);
    const totalProfiles = await StudentProfile.countDocuments(profileQuery);
    const total = Math.max(totalUsers, totalProfiles); // Approximate total

    return res.json({
      learners,
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
 * Get enhanced dashboard metrics
 * GET /api/v1/learn-earn/dashboard/metrics
 */
export const getEnhancedDashboardMetrics = async (req, res, next) => {
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

    const userObjectId = mongoose.isValidObjectId(userId)
      ? new mongoose.Types.ObjectId(userId)
      : null;

    if (!userObjectId) {
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

    // Get user points
    const userPoints = await StudentPoints.findOne({ student: userObjectId });

    // Get quiz attempts in period
    const quizAttempts = await QuizAttempt.find({
      student: userObjectId,
      completedAt: { $gte: startDate },
    }).lean();

    // Get ratings received
    const ratingsReceived = await UserRating.find({
      ratedUser: userObjectId,
      createdAt: { $gte: startDate },
    }).lean();

    // Get followers count
    const followersCount = await Follow.countDocuments({ following: userObjectId });

    // Get following count
    const followingCount = await Follow.countDocuments({ follower: userObjectId });

    // Calculate metrics
    const totalQuizAttempts = quizAttempts.length;
    const avgQuizScore = quizAttempts.length > 0
      ? quizAttempts.reduce((sum, a) => sum + (a.score || 0), 0) / quizAttempts.length
      : 0;
    const totalCoinsEarned = quizAttempts.reduce((sum, a) => sum + (a.coinsEarned || 0), 0);
    const avgRating = ratingsReceived.length > 0
      ? ratingsReceived.reduce((sum, r) => sum + (r.rating || 0), 0) / ratingsReceived.length
      : 0;

    // Calculate activity trend (last 7 days)
    const activityTrend = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));

      const dayAttempts = quizAttempts.filter(
        (a) => new Date(a.completedAt) >= dayStart && new Date(a.completedAt) <= dayEnd
      );

      activityTrend.push({
        date: dayStart.toISOString().split("T")[0],
        attempts: dayAttempts.length,
        coins: dayAttempts.reduce((sum, a) => sum + (a.coinsEarned || 0), 0),
      });
    }

    // Get category breakdown
    const categoryBreakdown = {};
    quizAttempts.forEach((attempt) => {
      const category = attempt.category || "quiz";
      if (!categoryBreakdown[category]) {
        categoryBreakdown[category] = { attempts: 0, totalCoins: 0, avgScore: 0 };
      }
      categoryBreakdown[category].attempts += 1;
      categoryBreakdown[category].totalCoins += attempt.coinsEarned || 0;
    });

    Object.keys(categoryBreakdown).forEach((cat) => {
      const catAttempts = quizAttempts.filter((a) => (a.category || "quiz") === cat);
      categoryBreakdown[cat].avgScore = catAttempts.length > 0
        ? catAttempts.reduce((sum, a) => sum + (a.score || 0), 0) / catAttempts.length
        : 0;
    });

    return res.json({
      period: {
        days,
        startDate,
        endDate: now,
      },
      overview: {
        totalCoins: userPoints?.totalCoins || 0,
        streak: userPoints?.streak || 0,
        totalQuizAttempts,
        avgQuizScore: Math.round(avgQuizScore * 100) / 100,
        totalCoinsEarned,
        avgRating: Math.round(avgRating * 100) / 100,
        totalRatings: ratingsReceived.length,
        followersCount,
        followingCount,
      },
      activityTrend,
      categoryBreakdown,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Advanced learner search with filters
 * GET /api/v1/learn-earn/search/advanced
 */
export const advancedSearchLearners = async (req, res, next) => {
  try {
    const {
      q: searchQuery,
      minRating,
      maxRating,
      minCoins,
      maxCoins,
      interests,
      category,
      sortBy = "relevance",
      page = 1,
      pageSize = 20,
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    const limit = parseInt(pageSize);

    // Build user query
    const userQuery = { role: "student" };
    const profileQuery = {};

    // Text search
    if (searchQuery && searchQuery.trim()) {
      const query = searchQuery.trim();
      const userQueryConditions = [{ fullName: { $regex: query, $options: "i" } }];
      if (mongoose.isValidObjectId(query)) {
        userQueryConditions.push({ _id: new mongoose.Types.ObjectId(query) });
      }
      userQuery.$or = userQueryConditions;

      profileQuery.$or = [
        { headline: { $regex: query, $options: "i" } },
        { bio: { $regex: query, $options: "i" } },
        { interests: { $in: [new RegExp(query, "i")] } },
      ];
    }

    // Get all student user IDs
    const allStudents = await User.find(userQuery).select("_id").lean();
    const studentIds = allStudents.map((u) => u._id);

    // Get profiles matching profile query
    const matchingProfiles = await StudentProfile.find({
      user: { $in: studentIds },
      ...profileQuery,
    }).select("user interests").lean();

    let filteredUserIds = matchingProfiles.map((p) => p.user);

    // Filter by interests
    if (interests) {
      const interestArray = Array.isArray(interests) ? interests : interests.split(",");
      const interestProfiles = await StudentProfile.find({
        user: { $in: filteredUserIds },
        interests: { $in: interestArray },
      }).select("user").lean();
      filteredUserIds = interestProfiles.map((p) => p.user);
    }

    // Get user points and ratings for filtering
    const userPointsData = await StudentPoints.find({
      student: { $in: filteredUserIds },
    }).lean();

    const userRatingsData = await UserRating.aggregate([
      { $match: { ratedUser: { $in: filteredUserIds } } },
      {
        $group: {
          _id: "$ratedUser",
          avgRating: { $avg: "$rating" },
          count: { $sum: 1 },
        },
      },
    ]);

    const ratingsMap = {};
    userRatingsData.forEach((r) => {
      ratingsMap[r._id.toString()] = r.avgRating;
    });

    // Filter by rating
    if (minRating || maxRating) {
      filteredUserIds = filteredUserIds.filter((id) => {
        const rating = ratingsMap[id.toString()] || 0;
        if (minRating && rating < parseFloat(minRating)) return false;
        if (maxRating && rating > parseFloat(maxRating)) return false;
        return true;
      });
    }

    // Filter by coins
    if (minCoins || maxCoins) {
      const pointsMap = {};
      userPointsData.forEach((p) => {
        pointsMap[p.student.toString()] = p.totalCoins || 0;
      });

      filteredUserIds = filteredUserIds.filter((id) => {
        const coins = pointsMap[id.toString()] || 0;
        if (minCoins && coins < parseFloat(minCoins)) return false;
        if (maxCoins && coins > parseFloat(maxCoins)) return false;
        return true;
      });
    }

    // Get quiz attempts for category filter
    if (category) {
      const categoryAttempts = await QuizAttempt.find({
        student: { $in: filteredUserIds },
        category,
      }).select("student").lean();

      const categoryUserIds = [...new Set(categoryAttempts.map((a) => a.student.toString()))];
      filteredUserIds = filteredUserIds.filter((id) => categoryUserIds.includes(id.toString()));
    }

    // Sort
    let sortedUserIds = [...filteredUserIds];
    if (sortBy === "rating") {
      sortedUserIds.sort((a, b) => {
        const ratingA = ratingsMap[a.toString()] || 0;
        const ratingB = ratingsMap[b.toString()] || 0;
        return ratingB - ratingA;
      });
    } else if (sortBy === "coins") {
      const pointsMap = {};
      userPointsData.forEach((p) => {
        pointsMap[p.student.toString()] = p.totalCoins || 0;
      });
      sortedUserIds.sort((a, b) => {
        const coinsA = pointsMap[a.toString()] || 0;
        const coinsB = pointsMap[b.toString()] || 0;
        return coinsB - coinsA;
      });
    } else if (sortBy === "activity") {
      const recentAttempts = await QuizAttempt.aggregate([
        { $match: { student: { $in: filteredUserIds } } },
        {
          $group: {
            _id: "$student",
            lastActivity: { $max: "$completedAt" },
          },
        },
      ]);

      const activityMap = {};
      recentAttempts.forEach((a) => {
        activityMap[a._id.toString()] = a.lastActivity || new Date(0);
      });

      sortedUserIds.sort((a, b) => {
        const dateA = activityMap[a.toString()] || new Date(0);
        const dateB = activityMap[b.toString()] || new Date(0);
        return dateB - dateA;
      });
    }

    // Paginate
    const paginatedIds = sortedUserIds.slice(skip, skip + limit);

    // Fetch complete data
    const learnersData = await Promise.all(
      paginatedIds.map(async (userId) => {
        const user = await User.findById(userId).select("fullName email role metadata _id").lean();
        if (!user) return null;

        const profile = await StudentProfile.findOne({ user: userId }).lean();
        const points = userPointsData.find((p) => p.student.toString() === userId.toString());
        const rating = ratingsMap[userId.toString()] || 0;

        // Get recent activity
        const recentAttempts = await QuizAttempt.find({ student: userId })
          .sort({ completedAt: -1 })
          .limit(5)
          .lean();

        return {
          id: user._id.toString(),
          userId: user._id.toString(),
          name: user.fullName,
          fullName: user.fullName,
          email: user.email,
          avatar: profile?.avatarUrl || user.metadata?.avatarUrl || `https://i.pravatar.cc/150?img=${user._id.toString().slice(-2)}`,
          avatarUrl: profile?.avatarUrl || user.metadata?.avatarUrl,
          title: profile?.headline || null,
          headline: profile?.headline || null,
          bio: profile?.bio || null,
          interests: profile?.interests || [],
          totalCoins: points?.totalCoins || 0,
          streak: points?.streak || 0,
          rating: Math.round(rating * 10) / 10,
          recentActivity: recentAttempts.length,
        };
      })
    );

    const learners = learnersData.filter(Boolean);

    return res.json({
      learners,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total: sortedUserIds.length,
        totalPages: Math.ceil(sortedUserIds.length / parseInt(pageSize)),
      },
      filters: {
        searchQuery: searchQuery || null,
        minRating: minRating ? parseFloat(minRating) : null,
        maxRating: maxRating ? parseFloat(maxRating) : null,
        minCoins: minCoins ? parseFloat(minCoins) : null,
        maxCoins: maxCoins ? parseFloat(maxCoins) : null,
        interests: interests ? (Array.isArray(interests) ? interests : interests.split(",")) : null,
        category: category || null,
        sortBy,
      },
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get enhanced leaderboard
 * GET /api/v1/learn-earn/leaderboard
 */
export const getEnhancedLeaderboard = async (req, res, next) => {
  try {
    const {
      type = "coins", // coins, rating, streak, activity
      period = "all", // all, week, month, year
      category,
      limit = 100,
    } = req.query;

    const now = new Date();
    let startDate = null;

    if (period === "week") {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === "month") {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (period === "year") {
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    }

    let leaderboard = [];

    if (type === "coins") {
      const query = {};
      if (startDate) {
        // For coins, we'd need to track when coins were earned
        // For now, use total coins
      }

      const pointsData = await StudentPoints.find(query)
        .sort({ totalCoins: -1 })
        .limit(parseInt(limit))
        .populate("student", "fullName email")
        .select("student totalCoins streak transactions") // Include transactions
        .lean();

      if (pointsData.length > 0) {
        // Extract user IDs for batch queries
        const userIds = pointsData
          .map((points) => points.student?._id)
          .filter(Boolean);

        // Batch fetch all profiles in one query
        const profiles = await StudentProfile.find({ user: { $in: userIds } })
          .select("user avatarUrl")
          .lean();
        const profilesMap = new Map(profiles.map((p) => [p.user.toString(), p]));

        // Batch calculate ratings using aggregation (much faster)
        const ratingsData = await UserRating.aggregate([
          { $match: { ratedUser: { $in: userIds } } },
          {
            $group: {
              _id: "$ratedUser",
              avgRating: { $avg: "$rating" },
            },
          },
        ]);
        const ratingsMap = new Map(
          ratingsData.map((r) => [
            r._id.toString(),
            Math.round(r.avgRating * 10) / 10,
          ])
        );

        // Build leaderboard response
        leaderboard = pointsData.map((points, index) => {
          const user = points.student;
          if (!user) return null;

          const userId = user._id.toString();
          const profile = profilesMap.get(userId);

          // Calculate totalEarned from transactions
          let totalEarned = 0;
          if (points.transactions && Array.isArray(points.transactions)) {
            totalEarned = points.transactions
              .filter((txn) => txn.type === "earned" || txn.type === "bonus")
              .reduce((sum, txn) => sum + (txn.amount || 0), 0);
          }
          // Use totalEarned if available, otherwise fallback to totalCoins
          const displayCoins = totalEarned > 0 ? totalEarned : (points.totalCoins || 0);

          return {
            rank: index + 1,
            userId,
            name: user.fullName || "User",
            avatar:
              profile?.avatarUrl ||
              `https://i.pravatar.cc/150?img=${userId.slice(-2)}`,
            totalCoins: displayCoins,
            totalEarned: displayCoins, // Add for frontend compatibility
            streak: points.streak || 0,
            rating: ratingsMap.get(userId) || 0,
            change: 0, // Would need historical data
          };
        });
      }
    } else if (type === "rating") {
      const ratingsData = await UserRating.aggregate([
        {
          $group: {
            _id: "$ratedUser",
            avgRating: { $avg: "$rating" },
            count: { $sum: 1 },
          },
        },
        { $sort: { avgRating: -1, count: -1 } },
        { $limit: parseInt(limit) },
      ]);

      if (ratingsData.length > 0) {
        // Extract user IDs for batch queries
        const userIds = ratingsData.map((item) => item._id).filter(Boolean);

        // Batch fetch all users, profiles, and points in parallel
        const [users, profiles, pointsData] = await Promise.all([
          User.find({ _id: { $in: userIds } })
            .select("fullName email _id")
            .lean(),
          StudentProfile.find({ user: { $in: userIds } })
            .select("user avatarUrl")
            .lean(),
          StudentPoints.find({ student: { $in: userIds } })
            .select("student totalCoins")
            .lean(),
        ]);

        // Create maps for quick lookup
        const usersMap = new Map(users.map((u) => [u._id.toString(), u]));
        const profilesMap = new Map(profiles.map((p) => [p.user.toString(), p]));
        const pointsMap = new Map(
          pointsData.map((p) => [p.student.toString(), p])
        );

        // Build leaderboard response
        leaderboard = ratingsData.map((item, index) => {
          const userId = item._id.toString();
          const user = usersMap.get(userId);
          if (!user) return null;

          const profile = profilesMap.get(userId);
          const points = pointsMap.get(userId);

          return {
            rank: index + 1,
            userId,
            name: user.fullName || "User",
            avatar:
              profile?.avatarUrl ||
              `https://i.pravatar.cc/150?img=${userId.slice(-2)}`,
            rating: Math.round(item.avgRating * 10) / 10,
            ratingCount: item.count,
            totalCoins: points?.totalCoins || 0,
            change: 0,
          };
        });
      }
    } else if (type === "streak") {
      const pointsData = await StudentPoints.find({})
        .sort({ streak: -1 })
        .limit(parseInt(limit))
        .populate("student", "fullName email")
        .lean();

      if (pointsData.length > 0) {
        // Extract user IDs for batch query
        const userIds = pointsData
          .map((points) => points.student?._id)
          .filter(Boolean);

        // Batch fetch all profiles in one query
        const profiles = await StudentProfile.find({ user: { $in: userIds } })
          .select("user avatarUrl")
          .lean();
        const profilesMap = new Map(profiles.map((p) => [p.user.toString(), p]));

        // Build leaderboard response
        leaderboard = pointsData.map((points, index) => {
          const user = points.student;
          if (!user) return null;

          const userId = user._id.toString();
          const profile = profilesMap.get(userId);

          return {
            rank: index + 1,
            userId,
            name: user.fullName || "User",
            avatar:
              profile?.avatarUrl ||
              `https://i.pravatar.cc/150?img=${userId.slice(-2)}`,
            streak: points.streak || 0,
            totalCoins: points.totalCoins || 0,
            change: 0,
          };
        });
      }
    } else if (type === "activity") {
      const activityData = await QuizAttempt.aggregate([
        ...(startDate ? [{ $match: { completedAt: { $gte: startDate } } }] : []),
        ...(category ? [{ $match: { category } }] : []),
        {
          $group: {
            _id: "$student",
            attempts: { $sum: 1 },
            totalCoins: { $sum: "$coinsEarned" },
            avgScore: { $avg: "$score" },
            lastActivity: { $max: "$completedAt" },
          },
        },
        { $sort: { attempts: -1, lastActivity: -1 } },
        { $limit: parseInt(limit) },
      ]);

      if (activityData.length > 0) {
        // Extract user IDs for batch queries
        const userIds = activityData.map((item) => item._id).filter(Boolean);

        // Batch fetch all users and profiles in parallel
        const [users, profiles] = await Promise.all([
          User.find({ _id: { $in: userIds } })
            .select("fullName email _id")
            .lean(),
          StudentProfile.find({ user: { $in: userIds } })
            .select("user avatarUrl")
            .lean(),
        ]);

        // Create maps for quick lookup
        const usersMap = new Map(users.map((u) => [u._id.toString(), u]));
        const profilesMap = new Map(profiles.map((p) => [p.user.toString(), p]));

        // Build leaderboard response
        leaderboard = activityData.map((item, index) => {
          const userId = item._id.toString();
          const user = usersMap.get(userId);
          if (!user) return null;

          const profile = profilesMap.get(userId);

          return {
            rank: index + 1,
            userId,
            name: user.fullName || "User",
            avatar:
              profile?.avatarUrl ||
              `https://i.pravatar.cc/150?img=${userId.slice(-2)}`,
            attempts: item.attempts,
            totalCoins: item.totalCoins || 0,
            avgScore: Math.round(item.avgScore * 10) / 10,
            lastActivity: item.lastActivity,
            change: 0,
          };
        });
      }
    }

    return res.json({
      type,
      period,
      category: category || null,
      leaderboard: leaderboard.filter(Boolean),
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get reward system statistics and improvements
 * GET /api/v1/learn-earn/rewards/stats
 */
export const getRewardSystemStats = async (req, res, next) => {
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

    const userObjectId = mongoose.isValidObjectId(userId)
      ? new mongoose.Types.ObjectId(userId)
      : null;

    if (!userObjectId) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid user ID",
        },
      });
    }

    // Get user points
    const userPoints = await StudentPoints.findOne({ student: userObjectId });

    // Get all quiz attempts
    const allAttempts = await QuizAttempt.find({ student: userObjectId }).lean();

    // Calculate reward statistics
    const totalCoinsEarned = allAttempts.reduce((sum, a) => sum + (a.coinsEarned || 0), 0);
    const totalCoinsSpent = 0; // Would need transaction tracking
    const totalCoinsShared = 0; // Would need sharing tracking

    // Get coins by category
    const coinsByCategory = {};
    allAttempts.forEach((attempt) => {
      const cat = attempt.category || "quiz";
      if (!coinsByCategory[cat]) {
        coinsByCategory[cat] = 0;
      }
      coinsByCategory[cat] += attempt.coinsEarned || 0;
    });

    // Get coins by quiz
    const coinsByQuiz = {};
    allAttempts.forEach((attempt) => {
      const quizId = attempt.quizId || attempt.quiz?.toString() || "unknown";
      if (!coinsByQuiz[quizId]) {
        coinsByQuiz[quizId] = { quizName: attempt.quizName || "Unknown Quiz", coins: 0, attempts: 0 };
      }
      coinsByQuiz[quizId].coins += attempt.coinsEarned || 0;
      coinsByQuiz[quizId].attempts += 1;
    });

    // Get top earning quizzes
    const topQuizzes = Object.values(coinsByQuiz)
      .sort((a, b) => b.coins - a.coins)
      .slice(0, 10);

    // Calculate earning rate (coins per attempt)
    const earningRate = allAttempts.length > 0 ? totalCoinsEarned / allAttempts.length : 0;

    // Get milestone achievements
    const milestones = [
      { name: "First Quiz", threshold: 1, achieved: allAttempts.length >= 1 },
      { name: "10 Quizzes", threshold: 10, achieved: allAttempts.length >= 10 },
      { name: "50 Quizzes", threshold: 50, achieved: allAttempts.length >= 50 },
      { name: "100 Quizzes", threshold: 100, achieved: allAttempts.length >= 100 },
      { name: "100 Coins", threshold: 100, achieved: (userPoints?.totalCoins || 0) >= 100 },
      { name: "500 Coins", threshold: 500, achieved: (userPoints?.totalCoins || 0) >= 500 },
      { name: "1000 Coins", threshold: 1000, achieved: (userPoints?.totalCoins || 0) >= 1000 },
      { name: "7 Day Streak", threshold: 7, achieved: (userPoints?.streak || 0) >= 7 },
      { name: "30 Day Streak", threshold: 30, achieved: (userPoints?.streak || 0) >= 30 },
    ];

    return res.json({
      summary: {
        totalCoins: userPoints?.totalCoins || 0,
        totalCoinsEarned,
        totalCoinsSpent,
        totalCoinsShared,
        currentStreak: userPoints?.streak || 0,
        longestStreak: userPoints?.streak || 0, // Use current streak as longest if not tracked separately
        totalQuizAttempts: allAttempts.length,
        earningRate: Math.round(earningRate * 100) / 100,
      },
      coinsByCategory,
      topQuizzes,
      milestones: milestones.map((m) => ({
        ...m,
        progress: m.name.includes("Quiz")
          ? Math.min(100, (allAttempts.length / m.threshold) * 100)
          : m.name.includes("Coins")
          ? Math.min(100, ((userPoints?.totalCoins || 0) / m.threshold) * 100)
          : m.name.includes("Streak")
          ? Math.min(100, ((userPoints?.streak || 0) / m.threshold) * 100)
          : 0,
      })),
    });
  } catch (error) {
    return next(error);
  }
};

function formatTimeAgo(date) {
  if (!date) return "Just now";
  const now = new Date();
  const diffMs = now - new Date(date);
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(date).toLocaleDateString();
}

