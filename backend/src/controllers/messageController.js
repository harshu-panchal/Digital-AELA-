import mongoose from "mongoose";
import Message from "../models/Message.js";
import User from "../models/User.js";

/**
 * Get all conversations for the authenticated user
 */
export const getConversations = async (req, res, next) => {
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

    // Get all unique conversation partners
    const conversations = await Message.aggregate([
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
        $lookup: {
          from: "users",
          let: { userId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$_id", "$$userId"] },
              },
            },
            {
              $project: {
                fullName: 1,
                email: 1,
                metadata: 1,
              },
            },
          ],
          as: "user",
        },
      },
      {
        $unwind: {
          path: "$user",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "studentprofiles",
          localField: "_id",
          foreignField: "user",
          as: "studentProfile",
        },
      },
      {
        $lookup: {
          from: "recruiterprofiles",
          localField: "_id",
          foreignField: "user",
          as: "recruiterProfile",
        },
      },
      {
        $project: {
          _id: 0,
          userId: { $toString: "$_id" },
          name: "$user.fullName",
          avatar: {
            $ifNull: [
              { $arrayElemAt: ["$studentProfile.avatarUrl", 0] },
              { $arrayElemAt: ["$recruiterProfile.avatarUrl", 0] },
              "$user.metadata.avatarUrl",
              null, // Return null instead of random avatar - frontend will handle fallback
            ],
          },
          preview: "$lastMessage.content",
          timestamp: "$lastMessage.createdAt",
          unread: "$unreadCount",
        },
      },
      {
        $sort: { timestamp: -1 },
      },
    ]);

    return res.json({ conversations });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get messages between authenticated user and another user
 */
export const getMessages = async (req, res, next) => {
  try {
    const { userId } = req.auth;
    const { recipientId } = req.params;

    if (!userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    if (!recipientId) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Recipient ID is required",
        },
      });
    }

    const userObjectId = mongoose.isValidObjectId(userId)
      ? new mongoose.Types.ObjectId(userId)
      : null;
    const recipientObjectId = mongoose.isValidObjectId(recipientId)
      ? new mongoose.Types.ObjectId(recipientId)
      : null;

    if (!userObjectId || !recipientObjectId) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid user ID or recipient ID",
        },
      });
    }

    const messages = await Message.find({
      $or: [
        { sender: userObjectId, recipient: recipientObjectId },
        { sender: recipientObjectId, recipient: userObjectId },
      ],
    })
      .sort({ createdAt: 1 })
      .populate("sender", "fullName metadata")
      .populate("recipient", "fullName metadata")
      .lean();

    // Mark messages as read
    await Message.updateMany(
      {
        sender: recipientObjectId,
        recipient: userObjectId,
        isRead: false,
      },
      {
        isRead: true,
        readAt: new Date(),
      }
    );

    const formattedMessages = messages.map((msg) => ({
      id: msg._id.toString(),
      from: msg.sender._id.toString() === userId ? "me" : "other",
      content: msg.content,
      type: msg.type || "text",
      time: new Date(msg.createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      timestamp: msg.createdAt,
      duration: msg.metadata?.duration,
    }));

    return res.json({ messages: formattedMessages });
  } catch (error) {
    return next(error);
  }
};

/**
 * Send a message (also used by Socket.io)
 */
export const sendMessage = async (req, res, next) => {
  try {
    const { userId } = req.auth || req.body; // Support both auth and body for Socket.io
    const { recipientId, content, type = "text", metadata = {} } = req.body;

    if (!userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    if (!recipientId || !content) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Recipient ID and content are required",
        },
      });
    }

    const senderObjectId = mongoose.isValidObjectId(userId)
      ? new mongoose.Types.ObjectId(userId)
      : null;
    const recipientObjectId = mongoose.isValidObjectId(recipientId)
      ? new mongoose.Types.ObjectId(recipientId)
      : null;

    if (!senderObjectId || !recipientObjectId) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid user ID or recipient ID",
        },
      });
    }

    const message = await Message.create({
      sender: senderObjectId,
      recipient: recipientObjectId,
      content: content.trim(),
      type,
      metadata,
    });

    const populatedMessage = await Message.findById(message._id)
      .populate("sender", "fullName avatarUrl")
      .populate("recipient", "fullName avatarUrl")
      .lean();

    const formattedMessage = {
      id: populatedMessage._id.toString(),
      from: "me",
      content: populatedMessage.content,
      type: populatedMessage.type,
      time: new Date(populatedMessage.createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      timestamp: populatedMessage.createdAt,
      duration: populatedMessage.metadata?.duration,
    };

    return res.status(201).json({
      message: formattedMessage,
      // Emit to Socket.io if available
      socketEvent: {
        event: "new_message",
        data: {
          ...formattedMessage,
          from: "other", // For recipient
          senderId: userId,
          recipientId,
        },
      },
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Mark messages as read
 */
export const markMessagesAsRead = async (req, res, next) => {
  try {
    const { userId } = req.auth;
    const { recipientId } = req.params;

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
    const recipientObjectId = mongoose.isValidObjectId(recipientId)
      ? new mongoose.Types.ObjectId(recipientId)
      : null;

    if (!userObjectId || !recipientObjectId) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid user ID or recipient ID",
        },
      });
    }

    const result = await Message.updateMany(
      {
        sender: recipientObjectId,
        recipient: userObjectId,
        isRead: false,
      },
      {
        isRead: true,
        readAt: new Date(),
      }
    );

    return res.json({
      success: true,
      updated: result.modifiedCount,
    });
  } catch (error) {
    return next(error);
  }
};

