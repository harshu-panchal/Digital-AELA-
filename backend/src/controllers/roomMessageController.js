import mongoose from "mongoose";
import RoomMessage from "../models/RoomMessage.js";
import LiveRoom from "../models/LiveRoom.js";

/**
 * Get room messages (chat history)
 */
export const getRoomMessages = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const { limit = 50 } = req.query;

    if (!roomId || !mongoose.isValidObjectId(roomId)) {
      return res.status(400).json({
        error: { code: "INVALID_ROOM_ID", message: "Invalid room ID" },
      });
    }

    const room = await LiveRoom.findById(roomId);
    if (!room) {
      return res.status(404).json({
        error: { code: "ROOM_NOT_FOUND", message: "Room not found" },
      });
    }

    // Get non-deleted messages, sorted by creation date (newest first, then reverse)
    const messages = await RoomMessage.find({
      roomId: new mongoose.Types.ObjectId(roomId),
      deletedAt: null,
    })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit, 10))
      .populate("sender", "fullName metadata")
      .lean();

    // Reverse to show oldest first
    const formattedMessages = messages.reverse().map((msg) => ({
      id: msg._id.toString(),
      senderId: msg.sender._id.toString(),
      senderName: msg.sender.fullName || "Unknown User",
      content: msg.content,
      type: msg.type,
      timestamp: msg.createdAt,
    }));

    // Get muted users from room metadata
    const mutedChatUsers = room.metadata?.mutedChatUsers || [];

    return res.json({
      messages: formattedMessages,
      mutedChatUsers,
      roomId,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Send room message
 */
export const sendRoomMessage = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const { content } = req.body;

    if (!req.auth?.userId) {
      return res.status(401).json({
        error: { code: "UNAUTHORIZED", message: "Authentication required" },
      });
    }

    if (!roomId || !mongoose.isValidObjectId(roomId)) {
      return res.status(400).json({
        error: { code: "INVALID_ROOM_ID", message: "Invalid room ID" },
      });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({
        error: { code: "INVALID_CONTENT", message: "Message content is required" },
      });
    }

    const room = await LiveRoom.findById(roomId);
    if (!room) {
      return res.status(404).json({
        error: { code: "ROOM_NOT_FOUND", message: "Room not found" },
      });
    }

    // Validate room is live
    if (room.status !== "live") {
      return res.status(400).json({
        error: { code: "ROOM_NOT_LIVE", message: "Room is not live" },
      });
    }

    // Check if user is a participant
    const isParticipant = room.participants.some(
      (p) => p.userId.toString() === req.auth.userId
    );

    if (!isParticipant) {
      return res.status(403).json({
        error: { code: "NOT_PARTICIPANT", message: "You are not a participant in this room" },
      });
    }

    // Check if user is muted
    const mutedChatUsers = room.metadata?.mutedChatUsers || [];
    if (mutedChatUsers.includes(req.auth.userId)) {
      return res.status(403).json({
        error: { code: "USER_MUTED", message: "You are muted and cannot send messages" },
      });
    }

    // Create message
    const message = await RoomMessage.create({
      roomId: new mongoose.Types.ObjectId(roomId),
      sender: new mongoose.Types.ObjectId(req.auth.userId),
      content: content.trim(),
      type: "text",
    });

    // Populate sender info
    const populatedMessage = await RoomMessage.findById(message._id)
      .populate("sender", "fullName metadata")
      .lean();

    const formattedMessage = {
      id: populatedMessage._id.toString(),
      senderId: populatedMessage.sender._id.toString(),
      senderName: populatedMessage.sender.fullName || "Unknown User",
      content: populatedMessage.content,
      type: populatedMessage.type,
      timestamp: populatedMessage.createdAt,
    };

    return res.json({ message: formattedMessage });
  } catch (error) {
    return next(error);
  }
};

/**
 * Delete room message (host only)
 */
export const deleteRoomMessage = async (req, res, next) => {
  try {
    const { roomId, messageId } = req.params;

    if (!req.auth?.userId) {
      return res.status(401).json({
        error: { code: "UNAUTHORIZED", message: "Authentication required" },
      });
    }

    if (!roomId || !messageId || !mongoose.isValidObjectId(roomId) || !mongoose.isValidObjectId(messageId)) {
      return res.status(400).json({
        error: { code: "INVALID_ID", message: "Invalid room ID or message ID" },
      });
    }

    const room = await LiveRoom.findById(roomId);
    if (!room) {
      return res.status(404).json({
        error: { code: "ROOM_NOT_FOUND", message: "Room not found" },
      });
    }

    // Check if user is host
    if (room.host.toString() !== req.auth.userId) {
      return res.status(403).json({
        error: { code: "FORBIDDEN", message: "Only the host can delete messages" },
      });
    }

    // Soft delete message
    const message = await RoomMessage.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(messageId),
        roomId: new mongoose.Types.ObjectId(roomId),
      },
      { deletedAt: new Date() },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({
        error: { code: "MESSAGE_NOT_FOUND", message: "Message not found" },
      });
    }

    return res.json({ success: true, messageId });
  } catch (error) {
    return next(error);
  }
};

/**
 * Mute user from chat (host only)
 */
export const muteUserChat = async (req, res, next) => {
  try {
    const { roomId, userId } = req.params;

    if (!req.auth?.userId) {
      return res.status(401).json({
        error: { code: "UNAUTHORIZED", message: "Authentication required" },
      });
    }

    if (!roomId || !userId || !mongoose.isValidObjectId(roomId) || !mongoose.isValidObjectId(userId)) {
      return res.status(400).json({
        error: { code: "INVALID_ID", message: "Invalid room ID or user ID" },
      });
    }

    const room = await LiveRoom.findById(roomId);
    if (!room) {
      return res.status(404).json({
        error: { code: "ROOM_NOT_FOUND", message: "Room not found" },
      });
    }

    // Check if user is host
    if (room.host.toString() !== req.auth.userId) {
      return res.status(403).json({
        error: { code: "FORBIDDEN", message: "Only the host can mute users" },
      });
    }

    // Initialize metadata if needed
    if (!room.metadata) {
      room.metadata = {};
    }
    if (!room.metadata.mutedChatUsers) {
      room.metadata.mutedChatUsers = [];
    }

    // Add user to muted list if not already muted
    if (!room.metadata.mutedChatUsers.includes(userId)) {
      room.metadata.mutedChatUsers.push(userId);
      await room.save();
    }

    return res.json({ success: true, userId, muted: true });
  } catch (error) {
    return next(error);
  }
};

/**
 * Unmute user from chat (host only)
 */
export const unmuteUserChat = async (req, res, next) => {
  try {
    const { roomId, userId } = req.params;

    if (!req.auth?.userId) {
      return res.status(401).json({
        error: { code: "UNAUTHORIZED", message: "Authentication required" },
      });
    }

    if (!roomId || !userId || !mongoose.isValidObjectId(roomId) || !mongoose.isValidObjectId(userId)) {
      return res.status(400).json({
        error: { code: "INVALID_ID", message: "Invalid room ID or user ID" },
      });
    }

    const room = await LiveRoom.findById(roomId);
    if (!room) {
      return res.status(404).json({
        error: { code: "ROOM_NOT_FOUND", message: "Room not found" },
      });
    }

    // Check if user is host
    if (room.host.toString() !== req.auth.userId) {
      return res.status(403).json({
        error: { code: "FORBIDDEN", message: "Only the host can unmute users" },
      });
    }

    // Initialize metadata if needed
    if (!room.metadata) {
      room.metadata = {};
    }
    if (!room.metadata.mutedChatUsers) {
      room.metadata.mutedChatUsers = [];
    }

    // Remove user from muted list
    room.metadata.mutedChatUsers = room.metadata.mutedChatUsers.filter(
      (id) => id !== userId
    );
    await room.save();

    return res.json({ success: true, userId, muted: false });
  } catch (error) {
    return next(error);
  }
};

