import mongoose from "mongoose";
import Notification from "../models/Notification.js";
import { getSocketIO } from "../utils/socketEmitter.js";

/**
 * Get user's notifications
 * GET /api/v1/notifications
 */
export const getNotifications = async (req, res, next) => {
  try {
    const { userId } = req.auth || {};

    if (!userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    const {
      page = 1,
      pageSize = 20,
      type,
      isRead,
      unreadOnly = false,
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    const limit = parseInt(pageSize);

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

    // Build query
    const query = { user: userObjectId };

    if (unreadOnly === "true" || unreadOnly === true) {
      query.isRead = false;
    } else if (isRead !== undefined) {
      query.isRead = isRead === "true" || isRead === true;
    }

    if (type) {
      query.type = type;
    }

    const [notifications, total] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments(query),
    ]);

    return res.json({
      notifications,
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
 * Get unread notification count
 * GET /api/v1/notifications/unread-count
 */
export const getUnreadCount = async (req, res, next) => {
  try {
    const { userId } = req.auth || {};

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

    const unreadCount = await Notification.countDocuments({
      user: userObjectId,
      isRead: false,
    });

    return res.json({
      unreadCount,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Mark notification as read
 * PATCH /api/v1/notifications/:notificationId/read
 */
export const markAsRead = async (req, res, next) => {
  try {
    const { userId } = req.auth || {};
    const { notificationId } = req.params;

    if (!userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    if (!mongoose.isValidObjectId(notificationId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid notification ID",
        },
      });
    }

    const userObjectId = mongoose.isValidObjectId(userId)
      ? new mongoose.Types.ObjectId(userId)
      : null;

    const notification = await Notification.findOne({
      _id: notificationId,
      user: userObjectId,
    });

    if (!notification) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Notification not found",
        },
      });
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    // Emit socket event to update client
    const io = getSocketIO();
    if (io) {
      io.to(`user:${userId}`).emit("notification_read", {
        notificationId: notification._id.toString(),
      });
    }

    return res.json({
      notification: notification.toObject(),
      message: "Notification marked as read",
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Mark all notifications as read
 * PATCH /api/v1/notifications/read-all
 */
export const markAllAsRead = async (req, res, next) => {
  try {
    const { userId } = req.auth || {};

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

    const result = await Notification.updateMany(
      {
        user: userObjectId,
        isRead: false,
      },
      {
        $set: {
          isRead: true,
          readAt: new Date(),
        },
      }
    );

    // Emit socket event to update client
    const io = getSocketIO();
    if (io) {
      io.to(`user:${userId}`).emit("all_notifications_read", {
        count: result.modifiedCount,
      });
    }

    return res.json({
      message: "All notifications marked as read",
      count: result.modifiedCount,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Delete notification
 * DELETE /api/v1/notifications/:notificationId
 */
export const deleteNotification = async (req, res, next) => {
  try {
    const { userId } = req.auth || {};
    const { notificationId } = req.params;

    if (!userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    if (!mongoose.isValidObjectId(notificationId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid notification ID",
        },
      });
    }

    const userObjectId = mongoose.isValidObjectId(userId)
      ? new mongoose.Types.ObjectId(userId)
      : null;

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      user: userObjectId,
    });

    if (!notification) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Notification not found",
        },
      });
    }

    // Emit socket event to update client
    const io = getSocketIO();
    if (io) {
      io.to(`user:${userId}`).emit("notification_deleted", {
        notificationId: notification._id.toString(),
      });
    }

    return res.json({
      message: "Notification deleted successfully",
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Clear all read notifications
 * DELETE /api/v1/notifications/clear-all
 */
export const clearAllRead = async (req, res, next) => {
  try {
    const { userId } = req.auth || {};

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

    const result = await Notification.deleteMany({
      user: userObjectId,
      isRead: true,
    });

    // Emit socket event to update client
    const io = getSocketIO();
    if (io) {
      io.to(`user:${userId}`).emit("notifications_cleared", {
        count: result.deletedCount,
      });
    }

    return res.json({
      message: "All read notifications cleared",
      count: result.deletedCount,
    });
  } catch (error) {
    return next(error);
  }
};

