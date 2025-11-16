import mongoose from "mongoose";
import Message from "../models/Message.js";
import Notification from "../models/Notification.js";
import LiveRoom from "../models/LiveRoom.js";
import StudentPoints from "../models/StudentPoints.js";
import User from "../models/User.js";
import StudentProfile from "../models/StudentProfile.js";
import Follow from "../models/Follow.js";
import UserRating from "../models/UserRating.js";

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

    // Get leaderboard (top users by coins shared/earned)
    let topUsers = [];
    try {
      topUsers = await StudentPoints.find()
        .sort({ totalCoins: -1 })
        .limit(10)
        .populate("student", "fullName email");
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error fetching leaderboard:", error);
      topUsers = [];
    }

    const leaderboard = await Promise.all(
      topUsers.map(async (points) => {
        const user = points.student;
        if (!user) return null;

        const profile = await StudentProfile.findOne({ user: user._id });
        const ratings = await UserRating.find({ ratedUser: user._id });
        const rating =
          ratings.length > 0
            ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
            : 0;

        // Get coins shared (would come from coin sharing transactions)
        const coinsShared = 0; // TODO: Implement when coin sharing is tracked

        return {
          id: user._id.toString(),
          name: user.fullName || "User",
          avatar: profile?.avatarUrl || `https://i.pravatar.cc/150?img=${user._id.toString().slice(-2)}`,
          coinsShared,
          rating: Math.round(rating * 10) / 10,
        };
      })
    );

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

