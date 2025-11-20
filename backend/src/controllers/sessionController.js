import mongoose from "mongoose";
import Session from "../models/Session.js";
import User from "../models/User.js";

/**
 * Get All Active Sessions (Admin only)
 * GET /api/v1/sessions/active
 */
export const getActiveSessions = async (req, res, next) => {
  try {
    const { userRole } = req.auth || {};

    if (userRole !== "super-admin" && userRole !== "admin") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only admins can view active sessions",
        },
      });
    }

    const {
      page = 1,
      pageSize = 50,
      userId,
      device,
      search,
      sortBy = "lastActivity",
      sortOrder = "desc",
    } = req.query;

    const query = {
      isActive: true,
    };

    if (userId && mongoose.isValidObjectId(userId)) {
      query.user = new mongoose.Types.ObjectId(userId);
    }

    if (device) {
      query.device = device;
    }

    if (search) {
      // Search by user name or email
      const users = await User.find({
        $or: [
          { fullName: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      }).select("_id").lean();

      query.user = { $in: users.map((u) => u._id) };
    }

    const skip = (Number(page) - 1) * Number(pageSize);
    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    const [sessions, total] = await Promise.all([
      Session.find(query)
        .populate("user", "fullName email role profilePicture")
        .sort(sort)
        .skip(skip)
        .limit(Number(pageSize))
        .lean(),
      Session.countDocuments(query),
    ]);

    // Calculate current duration for each session
    const sessionsWithDuration = sessions.map((session) => {
      const currentDuration = session.loginAt
        ? Math.floor((new Date() - new Date(session.loginAt)) / (1000 * 60))
        : 0;
      return {
        ...session,
        currentDuration,
      };
    });

    return res.json({
      sessions: sessionsWithDuration,
      pagination: {
        page: Number(page),
        pageSize: Number(pageSize),
        total,
        totalPages: Math.ceil(total / Number(pageSize)),
      },
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get All Sessions (Admin only) - including inactive
 * GET /api/v1/sessions
 */
export const getAllSessions = async (req, res, next) => {
  try {
    const { userRole } = req.auth || {};

    if (userRole !== "super-admin" && userRole !== "admin") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only admins can view sessions",
        },
      });
    }

    const {
      page = 1,
      pageSize = 50,
      userId,
      isActive,
      device,
      startDate,
      endDate,
      search,
      sortBy = "lastActivity",
      sortOrder = "desc",
    } = req.query;

    const query = {};

    if (userId && mongoose.isValidObjectId(userId)) {
      query.user = new mongoose.Types.ObjectId(userId);
    }

    if (isActive !== undefined) {
      query.isActive = isActive === "true";
    }

    if (device) {
      query.device = device;
    }

    if (startDate || endDate) {
      query.loginAt = {};
      if (startDate) {
        query.loginAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.loginAt.$lte = new Date(endDate);
      }
    }

    if (search) {
      const users = await User.find({
        $or: [
          { fullName: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      }).select("_id").lean();

      query.user = { $in: users.map((u) => u._id) };
    }

    const skip = (Number(page) - 1) * Number(pageSize);
    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    const [sessions, total] = await Promise.all([
      Session.find(query)
        .populate("user", "fullName email role profilePicture")
        .sort(sort)
        .skip(skip)
        .limit(Number(pageSize))
        .lean(),
      Session.countDocuments(query),
    ]);

    return res.json({
      sessions,
      pagination: {
        page: Number(page),
        pageSize: Number(pageSize),
        total,
        totalPages: Math.ceil(total / Number(pageSize)),
      },
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get Session Details
 * GET /api/v1/sessions/:sessionId
 */
export const getSessionDetails = async (req, res, next) => {
  try {
    const { userRole } = req.auth || {};
    const { sessionId } = req.params;

    if (userRole !== "super-admin" && userRole !== "admin") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only admins can view session details",
        },
      });
    }

    if (!mongoose.isValidObjectId(sessionId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid session ID",
        },
      });
    }

    const session = await Session.findById(sessionId)
      .populate("user", "fullName email role profilePicture")
      .lean();

    if (!session) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Session not found",
        },
      });
    }

    // Calculate current duration if active
    if (session.isActive && session.loginAt) {
      session.currentDuration = Math.floor(
        (new Date() - new Date(session.loginAt)) / (1000 * 60)
      );
    }

    return res.json({
      session,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Terminate Session (Admin only)
 * POST /api/v1/sessions/:sessionId/terminate
 */
export const terminateSession = async (req, res, next) => {
  try {
    const { userRole } = req.auth || {};
    const { sessionId } = req.params;

    if (userRole !== "super-admin" && userRole !== "admin") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only admins can terminate sessions",
        },
      });
    }

    if (!mongoose.isValidObjectId(sessionId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid session ID",
        },
      });
    }

    const session = await Session.findById(sessionId);

    if (!session) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Session not found",
        },
      });
    }

    await session.endSession();

    // Emit socket event to notify user
    const { getSocketIO } = await import("../utils/socketEmitter.js");
    const io = getSocketIO();
    if (io && session.user) {
      io.to(`user:${session.user.toString()}`).emit("session_terminated", {
        message: "Your session has been terminated by an administrator",
      });
    }

    return res.json({
      message: "Session terminated successfully",
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get Session Statistics (Admin only)
 * GET /api/v1/sessions/stats
 */
export const getSessionStats = async (req, res, next) => {
  try {
    const { userRole } = req.auth || {};

    if (userRole !== "super-admin" && userRole !== "admin") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only admins can view session statistics",
        },
      });
    }

    const [activeCount, totalToday, totalThisWeek, totalThisMonth, deviceStats, roleStats] = await Promise.all([
      Session.countDocuments({ isActive: true }),
      Session.countDocuments({
        loginAt: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      }),
      Session.countDocuments({
        loginAt: {
          $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      }),
      Session.countDocuments({
        loginAt: {
          $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      }),
      Session.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: "$device",
            count: { $sum: 1 },
          },
        },
      ]),
      Session.aggregate([
        { $match: { isActive: true } },
        {
          $lookup: {
            from: "users",
            localField: "user",
            foreignField: "_id",
            as: "userData",
          },
        },
        { $unwind: "$userData" },
        {
          $group: {
            _id: "$userData.role",
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const deviceBreakdown = deviceStats.reduce((acc, stat) => {
      acc[stat._id || "unknown"] = stat.count;
      return acc;
    }, {});

    const roleBreakdown = roleStats.reduce((acc, stat) => {
      acc[stat._id || "unknown"] = stat.count;
      return acc;
    }, {});

    return res.json({
      stats: {
        active: activeCount,
        today: totalToday,
        thisWeek: totalThisWeek,
        thisMonth: totalThisMonth,
        deviceBreakdown,
        roleBreakdown,
      },
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get User Sessions
 * GET /api/v1/sessions/user/:userId
 */
export const getUserSessions = async (req, res, next) => {
  try {
    const { userRole, userId: currentUserId } = req.auth || {};
    const { userId } = req.params;

    // Users can only view their own sessions, admins can view any user's sessions
    if (userRole !== "super-admin" && userRole !== "admin" && userId !== currentUserId) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "You can only view your own sessions",
        },
      });
    }

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid user ID",
        },
      });
    }

    const { page = 1, pageSize = 20, isActive } = req.query;

    const query = {
      user: new mongoose.Types.ObjectId(userId),
    };

    if (isActive !== undefined) {
      query.isActive = isActive === "true";
    }

    const skip = (Number(page) - 1) * Number(pageSize);

    const [sessions, total] = await Promise.all([
      Session.find(query)
        .sort({ lastActivity: -1 })
        .skip(skip)
        .limit(Number(pageSize))
        .lean(),
      Session.countDocuments(query),
    ]);

    return res.json({
      sessions,
      pagination: {
        page: Number(page),
        pageSize: Number(pageSize),
        total,
        totalPages: Math.ceil(total / Number(pageSize)),
      },
    });
  } catch (error) {
    return next(error);
  }
};

