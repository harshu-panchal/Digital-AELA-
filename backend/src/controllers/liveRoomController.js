import mongoose from "mongoose";
import LiveRoom from "../models/LiveRoom.js";
import User from "../models/User.js";

/**
 * Get all live rooms (debates and open rooms)
 */
export const getLiveRooms = async (req, res, next) => {
  try {
    const { type, status } = req.query;

    const query = {};
    if (type) {
      query.type = type;
    }
    if (status) {
      query.status = status;
    } else {
      // Default: get scheduled and live rooms
      query.status = { $in: ["scheduled", "live"] };
    }

    const rooms = await LiveRoom.find(query)
      .populate("host", "fullName avatarUrl")
      .populate("speakers", "fullName avatarUrl")
      .sort({ scheduledStart: 1, createdAt: -1 })
      .lean();

    const formattedRooms = rooms.map((room) => {
      const now = new Date();
      const scheduledStart = room.scheduledStart ? new Date(room.scheduledStart) : null;
      let startInMinutes = 0;

      if (scheduledStart && scheduledStart > now) {
        startInMinutes = Math.ceil((scheduledStart - now) / (1000 * 60));
      }

      return {
        id: room._id.toString(),
        topic: room.topic || room.title,
        title: room.title,
        description: room.description,
        type: room.type,
        status: room.status,
        forVotes: room.forVotes || 0,
        againstVotes: room.againstVotes || 0,
        listeners: room.listeners || 0,
        startInMinutes,
        scheduledStart: room.scheduledStart,
        actualStart: room.actualStart,
        speakers: room.speakers
          ? room.speakers.map((s) => (typeof s === "object" ? s.fullName : s))
          : [],
        host: room.host
          ? typeof room.host === "object"
            ? room.host._id.toString()
            : room.host.toString()
          : null,
        hostName: room.host
          ? typeof room.host === "object"
            ? room.host.fullName
            : "Unknown"
          : "Unknown",
        winners: room.winners || [],
        createdAt: room.createdAt,
      };
    });

    return res.json({ rooms: formattedRooms });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get a single live room by ID
 */
export const getLiveRoom = async (req, res, next) => {
  try {
    const { roomId } = req.params;

    if (!mongoose.isValidObjectId(roomId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid room ID",
        },
      });
    }

    const room = await LiveRoom.findById(roomId)
      .populate("host", "fullName avatarUrl")
      .populate("speakers", "fullName avatarUrl")
      .lean();

    if (!room) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Room not found",
        },
      });
    }

    const now = new Date();
    const scheduledStart = room.scheduledStart ? new Date(room.scheduledStart) : null;
    let startInMinutes = 0;

    if (scheduledStart && scheduledStart > now) {
      startInMinutes = Math.ceil((scheduledStart - now) / (1000 * 60));
    }

    const formattedRoom = {
      id: room._id.toString(),
      topic: room.topic || room.title,
      title: room.title,
      description: room.description,
      type: room.type,
      status: room.status,
      forVotes: room.forVotes || 0,
      againstVotes: room.againstVotes || 0,
      listeners: room.listeners || 0,
      startInMinutes,
      scheduledStart: room.scheduledStart,
      actualStart: room.actualStart,
      speakers: room.speakers
        ? room.speakers.map((s) => (typeof s === "object" ? s.fullName : s))
        : [],
      host: room.host
        ? typeof room.host === "object"
          ? room.host._id.toString()
          : room.host.toString()
        : null,
      hostName: room.host
        ? typeof room.host === "object"
          ? room.host.fullName
          : "Unknown"
        : "Unknown",
      winners: room.winners || [],
      createdAt: room.createdAt,
    };

    return res.json({ room: formattedRoom });
  } catch (error) {
    return next(error);
  }
};

/**
 * Create a new live room
 */
export const createLiveRoom = async (req, res, next) => {
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

    const {
      title,
      type = "open-room",
      topic,
      description,
      scheduledStart,
      speakers = [],
      startImmediately = false,
    } = req.body;

    if (!title) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Title is required",
        },
      });
    }

    const hostObjectId = mongoose.isValidObjectId(userId)
      ? new mongoose.Types.ObjectId(userId)
      : null;

    if (!hostObjectId) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid user ID",
        },
      });
    }

    const speakerObjectIds = speakers
      .filter((s) => mongoose.isValidObjectId(s))
      .map((s) => new mongoose.Types.ObjectId(s));

    // Determine start time and status
    const now = new Date();
    let roomScheduledStart = scheduledStart ? new Date(scheduledStart) : now;
    let roomStatus = "scheduled";

    if (startImmediately) {
      // Start immediately
      roomScheduledStart = now;
      roomStatus = "live";
    } else if (scheduledStart) {
      // Check if scheduled time has passed
      const scheduled = new Date(scheduledStart);
      if (scheduled <= now) {
        roomStatus = "live";
      }
    } else {
      // Default: 15 minutes from now
      roomScheduledStart = new Date(now.getTime() + 15 * 60 * 1000);
    }

    const room = await LiveRoom.create({
      title,
      host: hostObjectId,
      type,
      topic: topic || title,
      description,
      speakers: speakerObjectIds,
      scheduledStart: roomScheduledStart,
      status: roomStatus,
      actualStart: roomStatus === "live" ? now : undefined,
    });

    const populatedRoom = await LiveRoom.findById(room._id)
      .populate("host", "fullName avatarUrl")
      .populate("speakers", "fullName avatarUrl")
      .lean();

    // Format room response to match getLiveRooms format
    const scheduledStartDate = populatedRoom.scheduledStart ? new Date(populatedRoom.scheduledStart) : null;
    let startInMinutes = 0;

    if (scheduledStartDate && scheduledStartDate > now) {
      startInMinutes = Math.ceil((scheduledStartDate - now) / (1000 * 60));
    }

    const formattedRoom = {
      id: populatedRoom._id.toString(),
      topic: populatedRoom.topic || populatedRoom.title,
      title: populatedRoom.title,
      description: populatedRoom.description,
      type: populatedRoom.type,
      status: populatedRoom.status,
      forVotes: populatedRoom.forVotes || 0,
      againstVotes: populatedRoom.againstVotes || 0,
      listeners: populatedRoom.listeners || 0,
      startInMinutes,
      scheduledStart: populatedRoom.scheduledStart,
      actualStart: populatedRoom.actualStart,
      speakers: populatedRoom.speakers
        ? populatedRoom.speakers.map((s) => (typeof s === "object" ? s.fullName : s))
        : [],
      host: populatedRoom.host
        ? typeof populatedRoom.host === "object"
          ? populatedRoom.host.fullName
          : populatedRoom.host
        : "Unknown",
      winners: populatedRoom.winners || [],
      createdAt: populatedRoom.createdAt,
    };

    // Create notifications for all students when a new live room is created
    try {
      const User = (await import("../models/User.js")).default;
      const { createBulkNotifications } = await import("../utils/notificationHelper.js");
      
      // Get all active students
      const students = await User.find({ role: "student", isActive: true })
        .select("_id")
        .lean();
      
      if (students.length > 0) {
        const studentIds = students.map((s) => s._id);
        const roomTitle = populatedRoom.title || populatedRoom.topic;
        const roomType = type === "debate" ? "debate" : "live room";
        
        await createBulkNotifications(
          studentIds,
          `New ${roomType.charAt(0).toUpperCase() + roomType.slice(1)} Created`,
          `${populatedRoom.host?.fullName || "A user"} has created a new ${roomType}: "${roomTitle}"`,
          "live_room",
          {
            roomId: room._id.toString(),
            roomType: type,
            hostId: userId,
          },
          `/learn-earn/live-debate-room?roomId=${room._id}`
        );
      }
    } catch (notifError) {
      // eslint-disable-next-line no-console
      console.error("[LiveRoom] Error creating notifications:", notifError);
      // Don't fail room creation if notification fails
    }

    return res.status(201).json({ room: formattedRoom });
  } catch (error) {
    return next(error);
  }
};

/**
 * Vote on a debate (for or against)
 */
export const voteOnDebate = async (req, res, next) => {
  try {
    const { userId } = req.auth;
    const { roomId } = req.params;
    const { side } = req.body; // "for" or "against"

    if (!userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    if (!side || !["for", "against"].includes(side)) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Side must be 'for' or 'against'",
        },
      });
    }

    if (!mongoose.isValidObjectId(roomId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid room ID",
        },
      });
    }

    const room = await LiveRoom.findById(roomId);

    if (!room) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Room not found",
        },
      });
    }

    if (room.type !== "debate") {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Voting is only available for debates",
        },
      });
    }

    // Increment vote count
    if (side === "for") {
      room.forVotes = (room.forVotes || 0) + 1;
    } else {
      room.againstVotes = (room.againstVotes || 0) + 1;
    }

    await room.save();

    // Return updated vote counts for real-time updates
    return res.json({
      success: true,
      roomId: room._id.toString(),
      forVotes: room.forVotes,
      againstVotes: room.againstVotes,
      socketEvent: {
        event: "vote_update",
        data: {
          roomId: room._id.toString(),
          forVotes: room.forVotes,
          againstVotes: room.againstVotes,
          votedBy: userId,
          side,
        },
      },
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Join a room (increment listener count)
 */
export const joinRoom = async (req, res, next) => {
  try {
    const { roomId } = req.params;

    if (!mongoose.isValidObjectId(roomId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid room ID",
        },
      });
    }

    const room = await LiveRoom.findById(roomId);

    if (!room) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Room not found",
        },
      });
    }

    room.listeners = (room.listeners || 0) + 1;

    // If room is scheduled and it's time, mark as live
    if (room.status === "scheduled" && room.scheduledStart) {
      const now = new Date();
      if (now >= new Date(room.scheduledStart)) {
        room.status = "live";
        room.actualStart = now;
      }
    }

    await room.save();

    return res.json({
      success: true,
      listeners: room.listeners,
      status: room.status,
      socketEvent: {
        event: "room_update",
        data: {
          roomId: room._id.toString(),
          listeners: room.listeners,
          status: room.status,
        },
      },
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Leave a room (decrement listener count)
 */
export const leaveRoom = async (req, res, next) => {
  try {
    const { roomId } = req.params;

    if (!mongoose.isValidObjectId(roomId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid room ID",
        },
      });
    }

    const room = await LiveRoom.findById(roomId);

    if (!room) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Room not found",
        },
      });
    }

    room.listeners = Math.max(0, (room.listeners || 0) - 1);
    await room.save();

    return res.json({
      success: true,
      listeners: room.listeners,
      socketEvent: {
        event: "room_update",
        data: {
          roomId: room._id.toString(),
          listeners: room.listeners,
        },
      },
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Delete a live room (host only)
 */
export const deleteRoom = async (req, res, next) => {
  try {
    if (!req.auth || !req.auth.userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    const { roomId } = req.params;
    const userId = req.auth.userId.toString();

    if (!mongoose.isValidObjectId(roomId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid room ID",
        },
      });
    }

    const room = await LiveRoom.findById(roomId);
    if (!room) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Room not found",
        },
      });
    }

    // Check if user is the host
    const roomHostId = room.host
      ? typeof room.host === "object"
        ? room.host._id.toString()
        : room.host.toString()
      : null;

    if (!roomHostId || roomHostId !== userId) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only the host can delete this room",
        },
      });
    }

    // Import cleanup functions
    const { cleanupRoom: cleanupMediasoup } = await import("../services/mediasoupService.js");
    const { cleanupRoom: cleanupWebRTC } = await import("../services/webrtcService.js");

    // Cleanup mediasoup resources
    try {
      await cleanupMediasoup(roomId);
    } catch (cleanupError) {
      // eslint-disable-next-line no-console
      console.error("Error cleaning up mediasoup resources:", cleanupError);
      // Continue with deletion even if cleanup fails
    }

    // Cleanup WebRTC resources
    try {
      cleanupWebRTC(roomId);
    } catch (cleanupError) {
      // eslint-disable-next-line no-console
      console.error("Error cleaning up WebRTC resources:", cleanupError);
      // Continue with deletion even if cleanup fails
    }

    // Delete the room
    const deletedRoomId = room._id.toString();
    await room.deleteOne();

    // Emit socket event to notify all clients
    const { getSocketIO } = await import("../utils/socketEmitter.js");
    const io = getSocketIO();
    if (io) {
      // Emit to all users (broadcast)
      io.emit("room_deleted", {
        roomId: deletedRoomId,
      });
      // Also emit to specific room rooms in case they're listening
      io.to(`room:${deletedRoomId}`).emit("room_deleted", {
        roomId: deletedRoomId,
      });
      io.to(`voice-room:${deletedRoomId}`).emit("room_deleted", {
        roomId: deletedRoomId,
      });
    }

    return res.json({
      message: "Room deleted successfully",
      socketEvent: {
        event: "room_deleted",
        data: {
          roomId: deletedRoomId,
        },
      },
    });
  } catch (error) {
    return next(error);
  }
};

