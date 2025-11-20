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

    // ========== WebRTC Voice Room Signaling ==========
    
    // Join voice room with role
    socket.on("join-voice-room", async (data) => {
      try {
        const { roomId, role = "listener" } = data;
        
        if (!roomId || !mongoose.isValidObjectId(roomId)) {
          socket.emit("error", { message: "Invalid room ID" });
          return;
        }

        const roomObjectId = new mongoose.Types.ObjectId(roomId);
        const room = await LiveRoom.findById(roomObjectId);
        
        if (!room) {
          socket.emit("error", { message: "Room not found" });
          return;
        }

        // Join Socket.io room
        socket.join(`voice-room:${roomId}`);
        socket.data.voiceRoomId = roomId;
        socket.data.voiceRole = role;

        // Update or add participant
        const participantIndex = room.participants.findIndex(
          (p) => p.userId.toString() === socket.userId
        );

        if (participantIndex >= 0) {
          // Update existing participant
          room.participants[participantIndex].role = role;
          room.participants[participantIndex].socketId = socket.id;
          room.participants[participantIndex].joinedAt = new Date();
        } else {
          // Add new participant
          room.participants.push({
            userId: new mongoose.Types.ObjectId(socket.userId),
            role,
            socketId: socket.id,
            joinedAt: new Date(),
          });
        }

        // Update listener count if joining as listener
        if (role === "listener") {
          room.listeners = (room.listeners || 0) + 1;
        }

        // If room is scheduled and it's time, mark as live
        if (room.status === "scheduled" && room.scheduledStart) {
          const now = new Date();
          if (now >= new Date(room.scheduledStart)) {
            room.status = "live";
            room.actualStart = now;
          }
        }

        await room.save();

        // Get all participants for the room
        const participants = room.participants.map((p) => ({
          userId: p.userId.toString(),
          role: p.role,
          socketId: p.socketId,
        }));

        // Notify the user who joined
        socket.emit("voice-room-joined", {
          roomId,
          role,
          participants,
        });

        // Notify others in the room
        socket.to(`voice-room:${roomId}`).emit("participant-joined", {
          userId: socket.userId,
          userName: socket.userFullName,
          role,
          socketId: socket.id,
        });

        // Send list of existing speakers to the new participant
        const speakers = participants.filter((p) => p.role === "speaker" || p.role === "host");
        if (speakers.length > 0) {
          socket.emit("existing-speakers", {
            roomId,
            speakers: speakers.map((s) => ({
              userId: s.userId,
              socketId: s.socketId,
            })),
          });
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("[Socket.IO] Error joining voice room:", error);
        socket.emit("error", { message: "Failed to join voice room" });
      }
    });

    // Handle WebRTC signaling (offer, answer, ice-candidate)
    socket.on("signal", (data) => {
      try {
        const { toSocketId, type, payload } = data;
        
        if (!toSocketId || !type || !payload) {
          socket.emit("error", { message: "Invalid signal data" });
          return;
        }

        // Forward signal to target socket
        io.to(toSocketId).emit("signal", {
          from: socket.id,
          fromUserId: socket.userId,
          type, // 'offer', 'answer', 'ice-candidate'
          payload,
        });
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("[Socket.IO] Error forwarding signal:", error);
        socket.emit("error", { message: "Failed to forward signal" });
      }
    });

    // Request to speak
    socket.on("request-to-speak", async (data) => {
      try {
        const { roomId } = data;
        
        if (!roomId || !socket.data.voiceRoomId || socket.data.voiceRoomId !== roomId) {
          socket.emit("error", { message: "Not in this voice room" });
          return;
        }

        if (socket.data.voiceRole === "speaker" || socket.data.voiceRole === "host") {
          socket.emit("error", { message: "You are already a speaker" });
          return;
        }

        const room = await LiveRoom.findById(roomId);
        if (!room) {
          socket.emit("error", { message: "Room not found" });
          return;
        }

        // Check if request already exists
        const existingRequest = room.speakRequests.find(
          (r) => r.userId.toString() === socket.userId
        );

        if (!existingRequest) {
          room.speakRequests.push({
            userId: new mongoose.Types.ObjectId(socket.userId),
            socketId: socket.id,
            requestedAt: new Date(),
          });
          await room.save();
        }

        // Update participant role to "requested"
        const participant = room.participants.find(
          (p) => p.userId.toString() === socket.userId
        );
        if (participant) {
          participant.role = "requested";
          await room.save();
        }

        // Notify hosts and speakers
        const hostsAndSpeakers = room.participants.filter(
          (p) => (p.role === "host" || p.role === "speaker") && p.socketId
        );

        hostsAndSpeakers.forEach((p) => {
          io.to(p.socketId).emit("speak-requested", {
            roomId,
            userId: socket.userId,
            userName: socket.userFullName,
            socketId: socket.id,
          });
        });

        socket.emit("speak-request-sent", { roomId });
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("[Socket.IO] Error requesting to speak:", error);
        socket.emit("error", { message: "Failed to request to speak" });
      }
    });

    // Approve speak request
    socket.on("approve-speak", async (data) => {
      try {
        const { roomId, requesterSocketId, requesterUserId } = data;
        
        if (!roomId || socket.data.voiceRoomId !== roomId) {
          socket.emit("error", { message: "Not in this voice room" });
          return;
        }

        if (socket.data.voiceRole !== "host" && socket.data.voiceRole !== "speaker") {
          socket.emit("error", { message: "Only hosts and speakers can approve requests" });
          return;
        }

        const room = await LiveRoom.findById(roomId);
        if (!room) {
          socket.emit("error", { message: "Room not found" });
          return;
        }

        // Remove from speak requests
        room.speakRequests = room.speakRequests.filter(
          (r) => r.userId.toString() !== requesterUserId
        );

        // Update participant role to speaker
        const participant = room.participants.find(
          (p) => p.userId.toString() === requesterUserId
        );
        if (participant) {
          participant.role = "speaker";
        } else {
          // Add as speaker if not in participants
          room.participants.push({
            userId: new mongoose.Types.ObjectId(requesterUserId),
            role: "speaker",
            socketId: requesterSocketId,
            joinedAt: new Date(),
          });
        }

        // Add to speakers array if not already there
        const speakerObjectId = new mongoose.Types.ObjectId(requesterUserId);
        if (!room.speakers.some((s) => s.toString() === requesterUserId)) {
          room.speakers.push(speakerObjectId);
        }

        await room.save();

        // Notify requester
        io.to(requesterSocketId).emit("speak-approved", {
          roomId,
          approvedBy: socket.userId,
          approvedByName: socket.userFullName,
        });

        // Notify all room participants
        io.to(`voice-room:${roomId}`).emit("speaker-promoted", {
          userId: requesterUserId,
          userName: socket.userFullName, // We'd need to fetch this from DB for accuracy
          socketId: requesterSocketId,
        });
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("[Socket.IO] Error approving speak request:", error);
        socket.emit("error", { message: "Failed to approve speak request" });
      }
    });

    // Reject speak request
    socket.on("reject-speak", async (data) => {
      try {
        const { roomId, requesterSocketId, requesterUserId } = data;
        
        if (!roomId || socket.data.voiceRoomId !== roomId) {
          socket.emit("error", { message: "Not in this voice room" });
          return;
        }

        if (socket.data.voiceRole !== "host" && socket.data.voiceRole !== "speaker") {
          socket.emit("error", { message: "Only hosts and speakers can reject requests" });
          return;
        }

        const room = await LiveRoom.findById(roomId);
        if (!room) {
          socket.emit("error", { message: "Room not found" });
          return;
        }

        // Remove from speak requests
        room.speakRequests = room.speakRequests.filter(
          (r) => r.userId.toString() !== requesterUserId
        );

        // Revert participant role to listener
        const participant = room.participants.find(
          (p) => p.userId.toString() === requesterUserId
        );
        if (participant) {
          participant.role = "listener";
        }

        await room.save();

        // Notify requester
        io.to(requesterSocketId).emit("speak-rejected", {
          roomId,
          rejectedBy: socket.userId,
        });
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("[Socket.IO] Error rejecting speak request:", error);
        socket.emit("error", { message: "Failed to reject speak request" });
      }
    });

    // Leave voice room
    socket.on("leave-voice-room", async (data) => {
      try {
        const { roomId } = data;
        
        if (!roomId) {
          return;
        }

        socket.leave(`voice-room:${roomId}`);
        
        const room = await LiveRoom.findById(roomId);
        if (room) {
          // Remove participant
          room.participants = room.participants.filter(
            (p) => p.userId.toString() !== socket.userId
          );

          // Remove from speak requests
          room.speakRequests = room.speakRequests.filter(
            (r) => r.userId.toString() !== socket.userId
          );

          // Decrement listener count if was listener
          if (socket.data.voiceRole === "listener") {
            room.listeners = Math.max(0, (room.listeners || 0) - 1);
          }

          await room.save();

          // Notify others
          socket.to(`voice-room:${roomId}`).emit("participant-left", {
            userId: socket.userId,
            userName: socket.userFullName,
          });
        }

        socket.data.voiceRoomId = null;
        socket.data.voiceRole = null;
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("[Socket.IO] Error leaving voice room:", error);
      }
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

      // Clean up voice room participation
      if (socket.data.voiceRoomId) {
        const room = await LiveRoom.findById(socket.data.voiceRoomId);
        if (room) {
          room.participants = room.participants.filter(
            (p) => p.userId.toString() !== socket.userId
          );
          room.speakRequests = room.speakRequests.filter(
            (r) => r.userId.toString() !== socket.userId
          );
          if (socket.data.voiceRole === "listener") {
            room.listeners = Math.max(0, (room.listeners || 0) - 1);
          }
          await room.save();

          socket.to(`voice-room:${socket.data.voiceRoomId}`).emit("participant-left", {
            userId: socket.userId,
            userName: socket.userFullName,
          });
        }
      }

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

