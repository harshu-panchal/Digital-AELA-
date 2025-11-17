import { verifyAccessToken } from "../utils/token.js";
import User from "../models/User.js";
import Message from "../models/Message.js";
import LiveRoom from "../models/LiveRoom.js";
import Enrollment from "../models/Enrollment.js";
import QuizAttempt from "../models/QuizAttempt.js";
import Course from "../models/Course.js";
import mongoose from "mongoose";

export const setupSocketIO = (io) => {
  // Authentication middleware for Socket.io
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace("Bearer ", "");

      if (!token) {
        return next(new Error("Authentication error: Token missing"));
      }

      const payload = verifyAccessToken(token);
      const user = await User.findById(payload.sub);

      if (!user) {
        return next(new Error("Authentication error: User not found"));
      }

      socket.userId = user._id.toString();
      socket.userRole = user.role;
      socket.userFullName = user.fullName;

      return next();
    } catch (error) {
      return next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    // eslint-disable-next-line no-console
    console.log(`[Socket.IO] User connected: ${socket.userId} (${socket.userFullName})`);

    // Join user's personal room
    socket.join(`user:${socket.userId}`);

    // Handle sending a message
    socket.on("send_message", async (data) => {
      try {
        const { recipientId, content, type = "text", metadata = {} } = data;

        if (!recipientId || !content) {
          socket.emit("error", { message: "Recipient ID and content are required" });
          return;
        }

        const senderObjectId = mongoose.isValidObjectId(socket.userId)
          ? new mongoose.Types.ObjectId(socket.userId)
          : null;
        const recipientObjectId = mongoose.isValidObjectId(recipientId)
          ? new mongoose.Types.ObjectId(recipientId)
          : null;

        if (!senderObjectId || !recipientObjectId) {
          socket.emit("error", { message: "Invalid user ID or recipient ID" });
          return;
        }

        // Create message in database
        const message = await Message.create({
          sender: senderObjectId,
          recipient: recipientObjectId,
          content: content.trim(),
          type,
          metadata,
        });

        const populatedMessage = await Message.findById(message._id)
          .populate("sender", "fullName metadata")
          .populate("recipient", "fullName metadata")
          .lean();

        const formattedMessage = {
          id: populatedMessage._id.toString(),
          from: "other", // For recipient
          content: populatedMessage.content,
          type: populatedMessage.type,
          time: new Date(populatedMessage.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          timestamp: populatedMessage.createdAt,
          duration: populatedMessage.metadata?.duration,
          senderId: socket.userId,
          recipientId: recipientId,
          senderName: populatedMessage.sender?.fullName || socket.userFullName,
          senderAvatar: populatedMessage.sender?.avatarUrl || populatedMessage.sender?.metadata?.avatarUrl || null,
        };

        // Emit to sender (confirmation)
        socket.emit("message_sent", {
          ...formattedMessage,
          from: "me",
        });

        // Emit to recipient
        const recipientFormattedMessage = {
          ...formattedMessage,
          recipientId: socket.userId,
        };
        io.to(`user:${recipientId}`).emit("new_message", recipientFormattedMessage);
        
        // Notify both users that conversations list should be updated
        io.to(`user:${socket.userId}`).emit("conversation_updated");
        io.to(`user:${recipientId}`).emit("conversation_updated");

        // Update read status if recipient is online
        const recipientSocket = Array.from(io.sockets.sockets.values()).find(
          (s) => s.userId === recipientId
        );
        if (recipientSocket) {
          // Mark as read if recipient is viewing the conversation
          await Message.updateMany(
            {
              sender: senderObjectId,
              recipient: recipientObjectId,
              isRead: false,
            },
            {
              isRead: true,
              readAt: new Date(),
            }
          );
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("[Socket.IO] Error sending message:", error);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    // Handle typing indicator
    socket.on("typing", (data) => {
      const { recipientId, isTyping } = data;
      if (recipientId) {
        io.to(`user:${recipientId}`).emit("user_typing", {
          userId: socket.userId,
          userName: socket.userFullName,
          isTyping,
        });
      }
    });

    // Handle joining a live room
    socket.on("join_room", async (data) => {
      try {
        const { roomId } = data;
        if (!roomId || !mongoose.isValidObjectId(roomId)) {
          socket.emit("error", { message: "Invalid room ID" });
          return;
        }

        const roomObjectId = new mongoose.Types.ObjectId(roomId);
        socket.join(`room:${roomId}`);

        // Update listener count
        const room = await LiveRoom.findById(roomObjectId);
        if (room) {
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

          // Broadcast update to all room members
          io.to(`room:${roomId}`).emit("room_update", {
            roomId,
            listeners: room.listeners,
            status: room.status,
          });
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("[Socket.IO] Error joining room:", error);
        socket.emit("error", { message: "Failed to join room" });
      }
    });

    // Handle leaving a live room
    socket.on("leave_room", async (data) => {
      try {
        const { roomId } = data;
        if (!roomId || !mongoose.isValidObjectId(roomId)) {
          return;
        }

        socket.leave(`room:${roomId}`);

        // Update listener count
        const room = await LiveRoom.findById(roomId);
        if (room) {
          room.listeners = Math.max(0, (room.listeners || 0) - 1);
          await room.save();

          // Broadcast update to all room members
          io.to(`room:${roomId}`).emit("room_update", {
            roomId,
            listeners: room.listeners,
          });
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("[Socket.IO] Error leaving room:", error);
      }
    });

    // Handle voting on a debate
    socket.on("vote_debate", async (data) => {
      try {
        const { roomId, side } = data;

        if (!roomId || !side || !["for", "against"].includes(side)) {
          socket.emit("error", { message: "Room ID and side (for/against) are required" });
          return;
        }

        if (!mongoose.isValidObjectId(roomId)) {
          socket.emit("error", { message: "Invalid room ID" });
          return;
        }

        const room = await LiveRoom.findById(roomId);

        if (!room) {
          socket.emit("error", { message: "Room not found" });
          return;
        }

        if (room.type !== "debate") {
          socket.emit("error", { message: "Voting is only available for debates" });
          return;
        }

        // Increment vote count
        if (side === "for") {
          room.forVotes = (room.forVotes || 0) + 1;
        } else {
          room.againstVotes = (room.againstVotes || 0) + 1;
        }

        await room.save();

        // Broadcast vote update to all room members and all connected clients (for dashboard updates)
        const voteUpdateData = {
          roomId,
          forVotes: room.forVotes,
          againstVotes: room.againstVotes,
          votedBy: socket.userId,
          side,
        };
        io.to(`room:${roomId}`).emit("vote_update", voteUpdateData);
        // Also broadcast to all clients for dashboard updates (even if not in room)
        io.emit("vote_update", voteUpdateData);

        // Also emit to sender for confirmation
        socket.emit("vote_confirmed", {
          roomId,
          forVotes: room.forVotes,
          againstVotes: room.againstVotes,
          side,
        });
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("[Socket.IO] Error voting on debate:", error);
        socket.emit("error", { message: "Failed to vote" });
      }
    });

    // Handle real-time notifications
    socket.on("mark_notification_read", async (data) => {
      try {
        const { notificationId } = data;
        // This can be extended when notification model is created
        // For now, just acknowledge
        socket.emit("notification_read", { notificationId });
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("[Socket.IO] Error marking notification as read:", error);
      }
    });

    // Handle course enrollment updates (for teachers)
    socket.on("subscribe_course_updates", async (data) => {
      try {
        const { courseId } = data;
        if (!courseId || !mongoose.isValidObjectId(courseId)) {
          return;
        }

        // Verify teacher owns the course
        const course = await Course.findById(courseId);
        if (course && course.instructor.toString() === socket.userId) {
          socket.join(`course:${courseId}`);
          socket.emit("subscribed_course", { courseId });
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("[Socket.IO] Error subscribing to course updates:", error);
      }
    });

    socket.on("unsubscribe_course_updates", (data) => {
      const { courseId } = data;
      if (courseId) {
        socket.leave(`course:${courseId}`);
      }
    });

    // Handle quiz attempt updates (for teachers)
    socket.on("subscribe_quiz_updates", async (data) => {
      try {
        const { quizId } = data;
        if (quizId) {
          socket.join(`quiz:${quizId}`);
          socket.emit("subscribed_quiz", { quizId });
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("[Socket.IO] Error subscribing to quiz updates:", error);
      }
    });

    socket.on("unsubscribe_quiz_updates", (data) => {
      const { quizId } = data;
      if (quizId) {
        socket.leave(`quiz:${quizId}`);
      }
    });

    // Handle online status updates
    socket.on("update_online_status", () => {
      // Broadcast user is online to their connections
      io.emit("user_online", {
        userId: socket.userId,
        userName: socket.userFullName,
      });
    });

    // Handle activity feed subscription
    socket.on("subscribe_activity_feed", () => {
      socket.join("activity_feed");
    });

    socket.on("unsubscribe_activity_feed", () => {
      socket.leave("activity_feed");
    });

    // Handle disconnect
    socket.on("disconnect", async () => {
      // eslint-disable-next-line no-console
      console.log(`[Socket.IO] User disconnected: ${socket.userId}`);

      // Broadcast user is offline
      io.emit("user_offline", {
        userId: socket.userId,
        userName: socket.userFullName,
      });

      // Leave all rooms (decrement listener counts)
      const rooms = await LiveRoom.find({});
      for (const room of rooms) {
        const roomId = room._id.toString();
        const roomSockets = await io.in(`room:${roomId}`).fetchSockets();
        const wasInRoom = roomSockets.some((s) => s.id === socket.id);

        if (wasInRoom) {
          room.listeners = Math.max(0, (room.listeners || 0) - 1);
          await room.save();

          io.to(`room:${roomId}`).emit("room_update", {
            roomId,
            listeners: room.listeners,
          });
        }
      }
    });
  });

};

