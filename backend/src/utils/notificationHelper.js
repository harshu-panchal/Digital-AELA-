import Notification from "../models/Notification.js";
import { getSocketIO } from "./socketEmitter.js";

/**
 * Create a notification and emit socket event
 * @param {string|ObjectId} userId - User ID to notify
 * @param {string} title - Notification title
 * @param {string} description - Notification description
 * @param {string} type - Notification type (message, approval, payment, etc.)
 * @param {Object} metadata - Additional metadata
 * @param {string} actionUrl - URL to navigate when notification is clicked
 * @returns {Promise<Object>} Created notification
 */
export const createNotification = async (
  userId,
  title,
  description = "",
  type = "system",
  metadata = {},
  actionUrl = null
) => {
  try {
    const notification = await Notification.create({
      user: userId,
      title,
      description,
      type,
      metadata,
      actionUrl,
      isRead: false,
    });

    // Emit socket event to user's personal room
    const io = getSocketIO();
    if (io) {
      const notificationData = {
        id: notification._id.toString(),
        title: notification.title,
        description: notification.description,
        type: notification.type,
        isRead: notification.isRead,
        actionUrl: notification.actionUrl,
        metadata: notification.metadata,
        createdAt: notification.createdAt,
      };

      io.to(`user:${userId.toString()}`).emit("new_notification", notificationData);
    }

    return notification;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[NotificationHelper] Error creating notification:", error);
    throw error;
  }
};

/**
 * Create bulk notifications for multiple users
 * @param {Array<string|ObjectId>} userIds - Array of user IDs to notify
 * @param {string} title - Notification title
 * @param {string} description - Notification description
 * @param {string} type - Notification type
 * @param {Object} metadata - Additional metadata
 * @param {string} actionUrl - URL to navigate when notification is clicked
 * @returns {Promise<Array>} Array of created notifications
 */
export const createBulkNotifications = async (
  userIds,
  title,
  description = "",
  type = "system",
  metadata = {},
  actionUrl = null
) => {
  try {
    if (!userIds || userIds.length === 0) {
      return [];
    }

    const notifications = userIds.map((userId) => ({
      user: userId,
      title,
      description,
      type,
      metadata,
      actionUrl,
      isRead: false,
    }));

    const createdNotifications = await Notification.insertMany(notifications);

    // Emit socket events to all users
    const io = getSocketIO();
    if (io && createdNotifications.length > 0) {
      createdNotifications.forEach((notification) => {
        const notificationData = {
          id: notification._id.toString(),
          title: notification.title,
          description: notification.description,
          type: notification.type,
          isRead: notification.isRead,
          actionUrl: notification.actionUrl,
          metadata: notification.metadata,
          createdAt: notification.createdAt,
        };

        io.to(`user:${notification.user.toString()}`).emit("new_notification", notificationData);
      });
    }

    return createdNotifications;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[NotificationHelper] Error creating bulk notifications:", error);
    throw error;
  }
};

