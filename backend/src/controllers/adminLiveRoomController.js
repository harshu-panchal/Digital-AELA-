import mongoose from "mongoose";
import LiveRoom from "../models/LiveRoom.js";
import User from "../models/User.js";

/**
 * Get all live rooms for moderation (super admin only)
 */
export const getLiveRoomsForModeration = async (req, res, next) => {
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

    const { status, moderationStatus, type, page = 1, pageSize = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    const limit = parseInt(pageSize);

    const query = {};
    if (status) {
      query.status = status;
    }
    if (moderationStatus) {
      query.moderationStatus = moderationStatus;
    } else {
      // Default: show pending and approved rooms
      query.moderationStatus = { $in: ["pending", "approved"] };
    }
    if (type) {
      query.type = type;
    }

    const [rooms, total] = await Promise.all([
      LiveRoom.find(query)
        .populate("host", "fullName email avatarUrl")
        .populate("speakers", "fullName email avatarUrl")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      LiveRoom.countDocuments(query),
    ]);

    const formattedRooms = rooms.map((room) => {
      const now = new Date();
      const scheduledStart = room.scheduledStart ? new Date(room.scheduledStart) : null;
      let startInMinutes = 0;

      if (scheduledStart && scheduledStart > now) {
        startInMinutes = Math.ceil((scheduledStart - now) / (1000 * 60));
      }

      return {
        _id: room._id.toString(),
        id: room._id.toString(),
        topic: room.topic || room.title,
        title: room.title,
        description: room.description,
        type: room.type,
        status: room.status,
        moderationStatus: room.moderationStatus || "pending",
        forVotes: room.forVotes || 0,
        againstVotes: room.againstVotes || 0,
        listeners: room.listeners || 0,
        startInMinutes,
        scheduledStart: room.scheduledStart,
        actualStart: room.actualStart,
        actualEnd: room.actualEnd,
        speakers: room.speakers
          ? room.speakers.map((s) => ({
              _id: typeof s === "object" ? s._id?.toString() : s.toString(),
              fullName: typeof s === "object" ? s.fullName : "Unknown",
              email: typeof s === "object" ? s.email : "",
              avatarUrl: typeof s === "object" ? s.avatarUrl : "",
            }))
          : [],
        host: room.host
          ? typeof room.host === "object"
            ? {
                _id: room.host._id?.toString(),
                fullName: room.host.fullName,
                email: room.host.email || "",
                avatarUrl: room.host.avatarUrl || "",
              }
            : { _id: room.host.toString(), fullName: "Unknown", email: "", avatarUrl: "" }
          : { _id: "", fullName: "Unknown", email: "", avatarUrl: "" },
        winners: room.winners || [],
        createdAt: room.createdAt,
        updatedAt: room.updatedAt,
      };
    });

    return res.json({
      rooms: formattedRooms,
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
 * Moderate a live room (approve, suspend, reject, end)
 */
export const moderateLiveRoom = async (req, res, next) => {
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

    const { roomId } = req.params;
    const { action, reason } = req.body; // action: "approve", "suspend", "reject", "end"

    if (!mongoose.isValidObjectId(roomId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid room ID",
        },
      });
    }

    const validActions = ["approve", "suspend", "reject", "end"];
    if (!action || !validActions.includes(action)) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: `Action must be one of: ${validActions.join(", ")}`,
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

    // Update room based on action
    if (action === "approve") {
      room.moderationStatus = "approved";
    } else if (action === "suspend") {
      room.moderationStatus = "suspended";
      // If room is live, end it
      if (room.status === "live") {
        room.status = "ended";
        room.actualEnd = new Date();
      }
    } else if (action === "reject") {
      room.moderationStatus = "rejected";
      // If room is live or scheduled, end it
      if (room.status === "live" || room.status === "scheduled") {
        room.status = "ended";
        if (!room.actualEnd) {
          room.actualEnd = new Date();
        }
      }
    } else if (action === "end") {
      // Force end a live room
      if (room.status === "live") {
        room.status = "ended";
        room.actualEnd = new Date();
      }
    }

    // Store moderation reason in metadata
    if (reason) {
      room.metadata = {
        ...room.metadata,
        moderationReason: reason,
        moderatedAt: new Date(),
        moderatedBy: req.auth.userId,
      };
    }

    await room.save();

    // Get populated room for response
    const populatedRoom = await LiveRoom.findById(roomId)
      .populate("host", "fullName email avatarUrl")
      .populate("speakers", "fullName email avatarUrl")
      .lean();

    return res.json({
      room: populatedRoom,
      message: `Room ${action}ed successfully`,
      socketEvent: {
        event: "room_moderated",
        data: {
          roomId: room._id.toString(),
          action,
          moderationStatus: room.moderationStatus,
          status: room.status,
        },
      },
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Delete a live room (super admin only)
 */
export const deleteLiveRoom = async (req, res, next) => {
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

    await room.deleteOne();

    return res.json({
      message: "Room deleted successfully",
      socketEvent: {
        event: "room_deleted",
        data: {
          roomId: room._id.toString(),
        },
      },
    });
  } catch (error) {
    return next(error);
  }
};

