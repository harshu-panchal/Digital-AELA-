import { verifyAccessToken } from "../utils/token.js";
import User from "../models/User.js";
import Message from "../models/Message.js";
import LiveRoom from "../models/LiveRoom.js";
import RoomMessage from "../models/RoomMessage.js";
import Enrollment from "../models/Enrollment.js";
import QuizAttempt from "../models/QuizAttempt.js";
import Course from "../models/Course.js";
import mongoose from "mongoose";
import {
  getOrCreateRouter,
  getRouterRtpCapabilities,
  createTransport,
  connectTransport,
  createProducer,
  createConsumer,
  pauseProducer,
  resumeProducer,
  closeTransport,
  getRoomProducers,
  isMediasoupAvailable,
} from "../services/mediasoupService.js";
import {
  addSpeaker,
  removeSpeaker,
  getRoomSpeakers,
  getWebRTCConfig,
  cleanupRoom as cleanupWebRTCRoom,
} from "../services/webrtcService.js";

export const setupSocketIO = (io) => {
  // Authentication middleware for Socket.io - optional for listeners
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace("Bearer ", "");

      if (!token) {
        // Allow connection without token for listeners (they can join voice rooms to listen)
        socket.userId = null;
        socket.userRole = null;
        socket.userFullName = null;
        socket.isAuthenticated = false;
        return next();
      }

      const payload = verifyAccessToken(token);
      const user = await User.findById(payload.sub);

      if (!user) {
        // Allow connection even if user not found (for listeners)
        socket.userId = null;
        socket.userRole = null;
        socket.userFullName = null;
        socket.isAuthenticated = false;
        return next();
      }

      socket.userId = user._id.toString();
      socket.userRole = user.role;
      socket.userFullName = user.fullName;
      socket.isAuthenticated = true;

      return next();
    } catch (error) {
      // Allow connection even with invalid token (for listeners)
      socket.userId = null;
      socket.userRole = null;
      socket.userFullName = null;
      socket.isAuthenticated = false;
      return next();
    }
  });

  io.on("connection", (socket) => {
    // eslint-disable-next-line no-console
    if (socket.isAuthenticated) {
      console.log(`[Socket.IO] User connected: ${socket.userId} (${socket.userFullName})`);
      // Join user's personal room only if authenticated
      socket.join(`user:${socket.userId}`);
    } else {
      console.log(`[Socket.IO] Guest listener connected: ${socket.id}`);
    }

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

    // ========== WebRTC Voice Room Signaling (mediasoup SFU) ==========
    
    // Join voice room with role
    socket.on("join-voice-room", async (data) => {
      try {
        let { roomId, role = "listener" } = data;
        
        // Log connection attempt
        if (socket.isAuthenticated) {
          // eslint-disable-next-line no-console
          console.log(`[VoiceRoom] User ${socket.userId} (${socket.userFullName}) attempting to join room ${roomId}`);
        } else {
          // eslint-disable-next-line no-console
          console.log(`[VoiceRoom] Guest listener (${socket.id}) attempting to join room ${roomId}`);
        }
        
        if (!roomId || !mongoose.isValidObjectId(roomId)) {
          // eslint-disable-next-line no-console
          console.error(`[VoiceRoom] Invalid room ID: ${roomId}`);
          socket.emit("error", { message: "Invalid room ID" });
          return;
        }

        const roomObjectId = new mongoose.Types.ObjectId(roomId);
        const room = await LiveRoom.findById(roomObjectId);
        
        if (!room) {
          // eslint-disable-next-line no-console
          console.error(`[VoiceRoom] Room not found: ${roomId}`);
          socket.emit("error", { message: "Room not found" });
          return;
        }

        // Validate room status
        if (room.status === "ended") {
          // eslint-disable-next-line no-console
          console.error(`[VoiceRoom] Room ${roomId} has ended`);
          socket.emit("error", { message: "This room has ended" });
          return;
        }

        if (room.status === "scheduled") {
          const now = new Date();
          const scheduledStart = new Date(room.scheduledStart);
          if (now < scheduledStart) {
            // eslint-disable-next-line no-console
            console.error(`[VoiceRoom] Room ${roomId} not yet started. Scheduled: ${scheduledStart}, Now: ${now}`);
            socket.emit("error", { message: "Room has not started yet" });
            return;
          }
          // Auto-start if it's time
          room.status = "live";
          room.actualStart = now;
        }

        if (room.status !== "live") {
          // eslint-disable-next-line no-console
          console.error(`[VoiceRoom] Room ${roomId} is not live. Status: ${room.status}`);
          socket.emit("error", { message: "Room is not live" });
          return;
        }

        // For unauthenticated users, force listener role (they can only listen)
        if (!socket.isAuthenticated) {
          role = "listener";
        } else {
          // Auto-detect role: if user is room host, set as host
          if (room.host && room.host.toString() === socket.userId) {
            role = "host";
          } else if (room.speakers && Array.isArray(room.speakers) && room.speakers.some((s) => {
            const speakerId = typeof s === "object" ? s._id?.toString() || s.toString() : s?.toString();
            return speakerId === socket.userId;
          })) {
            // User is an approved speaker - they can join as speaker without requesting
            role = "speaker";
          } else {
            // Default to listener
            role = "listener";
          }
        }

        // Join Socket.io room
        socket.join(`voice-room:${roomId}`);
        socket.data.voiceRoomId = roomId;
        socket.data.voiceRole = role;

        // Use native WebRTC if mediasoup is not available
        let webrtcConfig = null;
        let rtpCapabilities = null;
        const useNativeWebRTC = !isMediasoupAvailable();

        if (useNativeWebRTC) {
          // Use native WebRTC (works on Render)
          webrtcConfig = getWebRTCConfig();
          // eslint-disable-next-line no-console
          console.log(`[VoiceRoom] Using native WebRTC for room ${roomId} (mediasoup unavailable)`);
        } else {
          // Use mediasoup if available
          try {
            await getOrCreateRouter(roomId);
            rtpCapabilities = await getRouterRtpCapabilities(roomId);
            if (!rtpCapabilities) {
              // eslint-disable-next-line no-console
              console.error(`[VoiceRoom] No RTP capabilities returned for room ${roomId}`);
              socket.emit("error", { 
                message: "Failed to get media capabilities. Please try again.",
                code: "RTP_CAPABILITIES_MISSING"
              });
              return;
            }
          } catch (routerError) {
            // eslint-disable-next-line no-console
            console.error(`[VoiceRoom] Error creating/getting router for room ${roomId}:`, routerError);
            socket.emit("error", { 
              message: "Failed to initialize media server. Please try again later.",
              code: "ROUTER_CREATION_FAILED",
              details: process.env.NODE_ENV === "development" ? routerError.message : undefined
            });
            return;
          }
        }

        // Only update participants in database if user is authenticated
        if (socket.isAuthenticated && socket.userId) {
          // Update or add participant (always find by userId to fix stale socketId issue)
          const participantIndex = room.participants.findIndex(
            (p) => p.userId.toString() === socket.userId
          );

          if (participantIndex >= 0) {
            // Update existing participant - always update socketId (fixes stale socketId issue)
            room.participants[participantIndex].role = role;
            room.participants[participantIndex].socketId = socket.id; // Always update socketId
            room.participants[participantIndex].joinedAt = new Date();
            // eslint-disable-next-line no-console
            console.log(`[VoiceRoom] Updated existing participant ${socket.userId} with new socketId ${socket.id}`);
          } else {
            // Add new participant
            room.participants.push({
              userId: new mongoose.Types.ObjectId(socket.userId),
              role,
              socketId: socket.id,
              joinedAt: new Date(),
            });
            // eslint-disable-next-line no-console
            console.log(`[VoiceRoom] Added new participant ${socket.userId} with socketId ${socket.id}`);
          }

          // Update socketId in speakRequests if user has pending request
          const speakRequestIndex = room.speakRequests.findIndex(
            (r) => r.userId.toString() === socket.userId
          );
          if (speakRequestIndex >= 0) {
            room.speakRequests[speakRequestIndex].socketId = socket.id;
            // eslint-disable-next-line no-console
            console.log(`[VoiceRoom] Updated speak request socketId for user ${socket.userId}`);
          }
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

        // Get all participants for the room with user names
        const participants = await Promise.all(
          room.participants.map(async (p) => {
            const user = await User.findById(p.userId).select("fullName").lean();
            return {
              userId: p.userId.toString(),
              userName: user?.fullName || "Unknown User",
              role: p.role,
              socketId: p.socketId,
            };
          })
        );

        // Get existing speak requests and send to host/speaker if they just joined
        const existingSpeakRequests = room.speakRequests || [];
        if (role === "host" && existingSpeakRequests.length > 0) {
          // Populate user info for requests
          const requestsWithUserInfo = await Promise.all(
            existingSpeakRequests.map(async (req) => {
              const user = await User.findById(req.userId).select("fullName").lean();
              return {
                userId: req.userId.toString(),
                userName: user?.fullName || "Unknown User",
                socketId: req.socketId,
              };
            })
          );
          
          // eslint-disable-next-line no-console
          console.log(`[Join Voice Room] Host joined, sending ${requestsWithUserInfo.length} existing speak requests`);
          
          // Send existing requests to the host who just joined
          socket.emit("existing-speak-requests", {
            roomId,
            requests: requestsWithUserInfo,
          });
        }

        // Get participants with user names for the person who just joined
        const participantsWithNames = await Promise.all(
          participants.map(async (p) => {
            const user = await User.findById(p.userId).select("fullName").lean();
            return {
              ...p,
              userName: user?.fullName || "Unknown User",
            };
          })
        );

        // Notify the user who joined with RTP capabilities or WebRTC config
        socket.emit("voice-room-joined", {
          roomId,
          role,
          participants: participantsWithNames,
          rtpCapabilities: useNativeWebRTC ? null : rtpCapabilities,
          webrtcConfig: useNativeWebRTC ? webrtcConfig : null,
          useNativeWebRTC,
        });

        // Load and send chat history when joining room
        try {
          const chatMessages = await RoomMessage.find({
            roomId: new mongoose.Types.ObjectId(roomId),
            deletedAt: null,
          })
            .sort({ createdAt: -1 })
            .limit(50)
            .populate("sender", "fullName metadata")
            .lean();

          const formattedMessages = chatMessages.reverse().map((msg) => ({
            id: msg._id.toString(),
            senderId: msg.sender._id.toString(),
            senderName: msg.sender.fullName || "Unknown User",
            content: msg.content,
            type: msg.type,
            timestamp: msg.createdAt,
          }));

          const mutedChatUsers = room.metadata?.mutedChatUsers || [];

          socket.emit("room-chat-history", {
            roomId,
            messages: formattedMessages,
            mutedChatUsers,
          });
        } catch (chatError) {
          // eslint-disable-next-line no-console
          console.error(`[VoiceRoom] Error loading chat history for room ${roomId}:`, chatError);
          // Don't fail the join if chat history fails to load
        }

        // Broadcast updated participants list to all in room
        const updatedParticipants = await Promise.all(
          room.participants.map(async (p) => {
            const user = await User.findById(p.userId).select("fullName").lean();
            return {
              userId: p.userId.toString(),
              userName: user?.fullName || "Unknown User",
              role: p.role,
              socketId: p.socketId,
            };
          })
        );

        // Notify others in the room
        io.to(`voice-room:${roomId}`).emit("participant-joined", {
          userId: socket.userId || socket.id, // Use socket.id for unauthenticated users
          userName: socket.userFullName || "Guest Listener",
          role,
          socketId: socket.id,
        });

        // Broadcast updated participants list to all (including the person who just joined)
        io.in(`voice-room:${roomId}`).emit("participants-updated", {
          roomId,
          participants: updatedParticipants,
        });

        // Send list of existing producers (speakers) to the new participant
        if (useNativeWebRTC) {
          // For native WebRTC, send list of active speakers
          const speakers = getRoomSpeakers(roomId);
          if (speakers.length > 0) {
            // eslint-disable-next-line no-console
            console.log(`[VoiceRoom] Sending ${speakers.length} existing speakers to new participant`);
            socket.emit("existing-speakers", {
              roomId,
              speakers: speakers.map((socketId) => ({ socketId })),
            });
          }
        } else {
          // For mediasoup, send producers
          const producers = getRoomProducers(roomId);
          if (producers.length > 0) {
            // eslint-disable-next-line no-console
            console.log(`[VoiceRoom] Sending ${producers.length} existing producers to new participant`);
            socket.emit("existing-producers", {
              roomId,
              producers: producers.map((p) => ({
                socketId: p.socketId,
                producerId: p.producerId,
              })),
            });
          } else {
            // eslint-disable-next-line no-console
            console.log(`[VoiceRoom] No existing producers to send`);
          }
        }

        // eslint-disable-next-line no-console
        if (socket.isAuthenticated) {
          console.log(`[VoiceRoom] User ${socket.userId} successfully joined room ${roomId} as ${role}`);
        } else {
          console.log(`[VoiceRoom] Guest listener ${socket.id} successfully joined room ${roomId} as ${role}`);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("[Socket.IO] Error joining voice room:", error);
        // eslint-disable-next-line no-console
        console.error("[Socket.IO] Error stack:", error.stack);
        // eslint-disable-next-line no-console
        console.error("[Socket.IO] Error details:", {
          roomId: data?.roomId,
          role: data?.role,
          userId: socket.userId,
          socketId: socket.id,
        });
        socket.emit("error", { 
          message: "Failed to join voice room",
          details: error.message 
        });
      }
    });

    // Create WebRTC transport (send or recv)
    socket.on("create-transport", async (data, callback) => {
      try {
        const { roomId, direction } = data; // 'send' or 'recv'

        if (!roomId || !socket.data.voiceRoomId || socket.data.voiceRoomId !== roomId) {
          if (callback) callback("Not in this voice room");
          return;
        }

        const transport = await createTransport(roomId, socket.id, direction);

        if (callback) {
          callback(null, {
            roomId,
            direction,
            transport,
          });
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("[Socket.IO] Error creating transport:", error);
        if (callback) callback(error.message || "Failed to create transport");
      }
    });

    // Connect transport
    socket.on("connect-transport", async (data, callback) => {
      try {
        const { roomId, transportId, dtlsParameters } = data;

        if (!roomId || !socket.data.voiceRoomId || socket.data.voiceRoomId !== roomId) {
          if (callback) callback("Not in this voice room");
          return;
        }

        await connectTransport(roomId, socket.id, transportId, dtlsParameters);

        if (callback) {
          callback(null, {
            roomId,
            transportId,
          });
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("[Socket.IO] Error connecting transport:", error);
        if (callback) callback(error.message || "Failed to connect transport");
      }
    });

    // Create producer (for speakers)
    socket.on("create-producer", async (data, callback) => {
      try {
        const { roomId, transportId, rtpParameters } = data;

        if (!roomId || !socket.data.voiceRoomId || socket.data.voiceRoomId !== roomId) {
          if (callback) callback("Not in this voice room");
          return;
        }

        if (socket.data.voiceRole !== "speaker" && socket.data.voiceRole !== "host") {
          if (callback) callback("Only speakers can produce audio");
          return;
        }

        const producer = await createProducer(roomId, socket.id, transportId, rtpParameters);

        // Notify all listeners about new producer
        socket.to(`voice-room:${roomId}`).emit("new-producer", {
          roomId,
          socketId: socket.id,
          producerId: producer.id,
          userId: socket.userId || socket.id,
          userName: socket.userFullName || "Speaker",
        });

        if (callback) {
          callback(null, {
            roomId,
            producer,
          });
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("[Socket.IO] Error creating producer:", error);
        if (callback) callback(error.message || "Failed to create producer");
      }
    });

    // Create consumer (for listeners)
    socket.on("create-consumer", async (data, callback) => {
      try {
        const { roomId, transportId, producerId, rtpCapabilities } = data;

        if (!roomId || !socket.data.voiceRoomId || socket.data.voiceRoomId !== roomId) {
          if (callback) callback("Not in this voice room");
          return;
        }

        const consumer = await createConsumer(
          roomId,
          socket.id,
          transportId,
          producerId,
          rtpCapabilities
        );

        if (callback) {
          callback(null, {
            roomId,
            consumer,
          });
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("[Socket.IO] Error creating consumer:", error);
        if (callback) callback(error.message || "Failed to create consumer");
      }
    });

    // ========== Native WebRTC Signaling Handlers ==========
    
    // WebRTC Offer - when a peer creates an offer for another peer
    socket.on("webrtc-offer", async (data) => {
      try {
        const { roomId, targetSocketId, offer } = data;
        
        if (!roomId || !socket.data.voiceRoomId || socket.data.voiceRoomId !== roomId) {
          socket.emit("error", { message: "Not in this voice room" });
          return;
        }

        // Forward offer to target peer
        io.to(targetSocketId).emit("webrtc-offer", {
          roomId,
          fromSocketId: socket.id,
          fromUserId: socket.userId || socket.id,
          fromUserName: socket.userFullName || "Speaker",
          offer,
        });
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("[Socket.IO] Error handling WebRTC offer:", error);
      }
    });

    // WebRTC Answer - when a peer responds to an offer
    socket.on("webrtc-answer", async (data) => {
      try {
        const { roomId, targetSocketId, answer } = data;
        
        if (!roomId || !socket.data.voiceRoomId || socket.data.voiceRoomId !== roomId) {
          socket.emit("error", { message: "Not in this voice room" });
          return;
        }

        // Forward answer to target peer
        io.to(targetSocketId).emit("webrtc-answer", {
          roomId,
          fromSocketId: socket.id,
          fromUserId: socket.userId || socket.id,
          answer,
        });
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("[Socket.IO] Error handling WebRTC answer:", error);
      }
    });

    // WebRTC ICE Candidate - exchange ICE candidates between peers
    socket.on("webrtc-ice-candidate", async (data) => {
      try {
        const { roomId, targetSocketId, candidate } = data;
        
        if (!roomId || !socket.data.voiceRoomId || socket.data.voiceRoomId !== roomId) {
          return; // Silently ignore if not in room
        }

        // Forward ICE candidate to target peer
        io.to(targetSocketId).emit("webrtc-ice-candidate", {
          roomId,
          fromSocketId: socket.id,
          candidate,
        });
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("[Socket.IO] Error handling WebRTC ICE candidate:", error);
      }
    });

    // WebRTC Speaker Started - notify when a speaker starts streaming
    socket.on("webrtc-speaker-started", async (data) => {
      try {
        const { roomId } = data;
        
        if (!roomId || !socket.data.voiceRoomId || socket.data.voiceRoomId !== roomId) {
          return;
        }

        // Track speaker
        addSpeaker(roomId, socket.id);

        // Notify all participants in the room (both listeners and other speakers)
        // This allows bidirectional connections between speakers
        socket.to(`voice-room:${roomId}`).emit("webrtc-speaker-started", {
          roomId,
          socketId: socket.id,
          userId: socket.userId || socket.id,
          userName: socket.userFullName || "Speaker",
        });
        
        // Also send existing speakers to the new speaker so they can connect back
        const existingSpeakers = getRoomSpeakers(roomId).filter(sid => sid !== socket.id);
        if (existingSpeakers.length > 0) {
          // eslint-disable-next-line no-console
          console.log(`[VoiceRoom] Sending ${existingSpeakers.length} existing speakers to new speaker`);
          socket.emit("existing-speakers", {
            roomId,
            speakers: existingSpeakers.map((socketId) => ({ socketId })),
          });
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("[Socket.IO] Error handling speaker started:", error);
      }
    });

    // WebRTC Speaker Stopped - notify when a speaker stops streaming
    socket.on("webrtc-speaker-stopped", async (data) => {
      try {
        const { roomId } = data;
        
        if (!roomId || !socket.data.voiceRoomId || socket.data.voiceRoomId !== roomId) {
          return;
        }

        // Remove speaker tracking
        removeSpeaker(roomId, socket.id);

        // Notify all listeners in the room
        socket.to(`voice-room:${roomId}`).emit("webrtc-speaker-stopped", {
          roomId,
          socketId: socket.id,
          userId: socket.userId || socket.id,
        });
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("[Socket.IO] Error handling speaker stopped:", error);
      }
    });

    // ========== End Native WebRTC Signaling Handlers ==========

    // Request to speak
    socket.on("request-to-speak", async (data) => {
      try {
        const { roomId } = data;
        
        // Require authentication for requesting to speak
        if (!socket.isAuthenticated || !socket.userId) {
          socket.emit("error", { message: "You must be logged in to request to speak" });
          return;
        }
        
        if (!roomId || !socket.data.voiceRoomId || socket.data.voiceRoomId !== roomId) {
          socket.emit("error", { message: "Not in this voice room" });
          return;
        }

        // Fetch room first
        const room = await LiveRoom.findById(roomId);
        if (!room) {
          socket.emit("error", { message: "Room not found" });
          return;
        }

        // Check if user is already a speaker in the room
        const isAlreadySpeaker = room.speakers && room.speakers.some((s) => {
          const speakerId = typeof s === "object" ? s._id?.toString() || s.toString() : s?.toString();
          return speakerId === socket.userId;
        });
        if (socket.data.voiceRole === "speaker" || socket.data.voiceRole === "host" || isAlreadySpeaker) {
          socket.emit("error", { message: "You are already a speaker" });
          return;
        }

        // Check if request already exists
        const existingRequestIndex = room.speakRequests.findIndex(
          (r) => r.userId.toString() === socket.userId
        );

        const isNewRequest = existingRequestIndex < 0;
        
        if (existingRequestIndex >= 0) {
          // Update existing request with new socketId (in case user rejoined)
          room.speakRequests[existingRequestIndex].socketId = socket.id;
          room.speakRequests[existingRequestIndex].requestedAt = new Date();
        } else {
          // Add new request
          room.speakRequests.push({
            userId: new mongoose.Types.ObjectId(socket.userId),
            socketId: socket.id,
            requestedAt: new Date(),
          });
        }
        await room.save();
        
        // eslint-disable-next-line no-console
        console.log(`[Request to Speak] Request ${isNewRequest ? 'created' : 'updated'} for user ${socket.userId}`);

        // Update participant role to "requested"
        const participant = room.participants.find(
          (p) => p.userId.toString() === socket.userId
        );
        if (participant) {
          participant.role = "requested";
          await room.save();
        }

        // Notify hosts and speakers
        // Get all sockets in the voice room and check their roles (most reliable method)
        const voiceRoomSockets = await io.in(`voice-room:${roomId}`).fetchSockets();
        const hostAndSpeakerSockets = voiceRoomSockets.filter((s) => {
          return s.data.voiceRole === "host" || s.data.voiceRole === "speaker";
        });

        // Also get from participants array as backup
        const hostsAndSpeakers = room.participants.filter(
          (p) => {
            const isHost = p.role === "host" || p.userId.toString() === room.host.toString();
            const isSpeaker = p.role === "speaker" || room.speakers.some(s => s.toString() === p.userId.toString());
            return (isHost || isSpeaker) && p.socketId;
          }
        );

        // Also find host directly by userId (most reliable for host)
        const hostSockets = voiceRoomSockets.filter((s) => {
          return s.userId === room.host.toString() || s.data.voiceRole === "host";
        });

        // Combine socket IDs from all sources (prioritize live sockets)
        const socketIdsToNotify = new Set();
        
        // First, add all host sockets (most important)
        hostSockets.forEach((s) => {
          socketIdsToNotify.add(s.id);
        });
        
        // Then, add all live sockets (most reliable)
        hostAndSpeakerSockets.forEach((s) => {
          socketIdsToNotify.add(s.id);
        });
        
        // Finally, add from participants array (backup for any missed)
        hostsAndSpeakers.forEach((p) => {
          if (p.socketId) socketIdsToNotify.add(p.socketId);
        });

        // eslint-disable-next-line no-console
        console.log(`[Request to Speak] Found ${hostSockets.length} host socket(s) directly`);
        // eslint-disable-next-line no-console
        console.log(`[Request to Speak] Found ${hostAndSpeakerSockets.length} host(s)/speaker(s) in voice room`);
        // eslint-disable-next-line no-console
        console.log(`[Request to Speak] Found ${hostsAndSpeakers.length} host(s)/speaker(s) in participants array`);
        // eslint-disable-next-line no-console
        console.log(`[Request to Speak] Host socket IDs:`, hostSockets.map(s => s.id));

        // Notify all hosts and speakers
        // eslint-disable-next-line no-console
        console.log(`[Request to Speak] User ${socket.userId} (${socket.userFullName}) requested. Notifying ${socketIdsToNotify.size} host(s)/speaker(s)`);
        // eslint-disable-next-line no-console
        console.log(`[Request to Speak] Socket IDs to notify:`, Array.from(socketIdsToNotify));
        
        // Always send the request notification, even if updating existing request
        socketIdsToNotify.forEach((socketId) => {
          // eslint-disable-next-line no-console
          console.log(`[Request to Speak] Sending to socket ${socketId}`);
          io.to(socketId).emit("speak-requested", {
            roomId,
            userId: socket.userId,
            userName: socket.userFullName,
            socketId: socket.id,
          });
        });

        // If no hosts/speakers found via socket lookup, try broadcasting to all in room as fallback
        if (socketIdsToNotify.size === 0) {
          // eslint-disable-next-line no-console
          console.warn(`[Request to Speak] No hosts/speakers found via socket lookup. Broadcasting to all in room as fallback.`);
          // eslint-disable-next-line no-console
          console.warn(`[Request to Speak] Room participants:`, room.participants.map(p => ({ userId: p.userId.toString(), role: p.role, socketId: p.socketId })));
          // eslint-disable-next-line no-console
          console.warn(`[Request to Speak] Room host:`, room.host.toString());
          // eslint-disable-next-line no-console
          console.warn(`[Request to Speak] Room speakers:`, room.speakers.map(s => s.toString()));
          
          // Fallback: broadcast to all sockets in room, let frontend filter by role
          io.in(`voice-room:${roomId}`).emit("speak-requested", {
            roomId,
            userId: socket.userId,
            userName: socket.userFullName,
            socketId: socket.id,
          });
        }

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

        // Only host can approve requests
        if (socket.data.voiceRole !== "host") {
          socket.emit("error", { message: "Only the host can approve requests" });
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

        // Get updated participants list
        const updatedParticipants = await Promise.all(
          room.participants.map(async (p) => {
            const user = await User.findById(p.userId).select("fullName").lean();
            return {
              userId: p.userId.toString(),
              userName: user?.fullName || "Unknown User",
              role: p.role,
              socketId: p.socketId,
            };
          })
        );

        // Notify all room participants
        io.to(`voice-room:${roomId}`).emit("speaker-promoted", {
          userId: requesterUserId,
          userName: socket.userFullName,
          socketId: requesterSocketId,
        });

        // Broadcast updated participants list to all
        io.in(`voice-room:${roomId}`).emit("participants-updated", {
          roomId,
          participants: updatedParticipants,
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

        // Only host can reject requests
        if (socket.data.voiceRole !== "host") {
          socket.emit("error", { message: "Only the host can reject requests" });
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

    // Host mute/unmute participant
    socket.on("mute-participant", async (data) => {
      try {
        const { roomId, targetSocketId, targetUserId } = data;

        if (!roomId || socket.data.voiceRoomId !== roomId) {
          socket.emit("error", { message: "Not in this voice room" });
          return;
        }

        // Only host can mute participants
        if (socket.data.voiceRole !== "host") {
          socket.emit("error", { message: "Only host can mute participants" });
          return;
        }

        const room = await LiveRoom.findById(roomId);
        if (!room) {
          socket.emit("error", { message: "Room not found" });
          return;
        }

        // Verify target is in the room
        const targetParticipant = room.participants.find(
          (p) => p.userId.toString() === targetUserId
        );
        if (!targetParticipant) {
          socket.emit("error", { message: "Participant not found in room" });
          return;
        }

        // Pause producer (mute)
        await pauseProducer(targetSocketId);

        // Notify target user
        io.to(targetSocketId).emit("muted-by-host", {
          roomId,
          mutedBy: socket.userId,
          mutedByName: socket.userFullName,
        });

        // Notify all room participants
        io.to(`voice-room:${roomId}`).emit("participant-muted", {
          roomId,
          userId: targetUserId,
          socketId: targetSocketId,
          mutedBy: socket.userId,
        });

        socket.emit("participant-muted-success", {
          roomId,
          userId: targetUserId,
        });
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("[Socket.IO] Error muting participant:", error);
        socket.emit("error", { message: "Failed to mute participant" });
      }
    });

    socket.on("unmute-participant", async (data) => {
      try {
        const { roomId, targetSocketId, targetUserId } = data;

        if (!roomId || socket.data.voiceRoomId !== roomId) {
          socket.emit("error", { message: "Not in this voice room" });
          return;
        }

        // Only host can unmute participants
        if (socket.data.voiceRole !== "host") {
          socket.emit("error", { message: "Only host can unmute participants" });
          return;
        }

        const room = await LiveRoom.findById(roomId);
        if (!room) {
          socket.emit("error", { message: "Room not found" });
          return;
        }

        // Verify target is in the room
        const targetParticipant = room.participants.find(
          (p) => p.userId.toString() === targetUserId
        );
        if (!targetParticipant) {
          socket.emit("error", { message: "Participant not found in room" });
          return;
        }

        // Resume producer (unmute)
        await resumeProducer(targetSocketId);

        // Notify target user
        io.to(targetSocketId).emit("unmuted-by-host", {
          roomId,
          unmutedBy: socket.userId,
          unmutedByName: socket.userFullName,
        });

        // Notify all room participants
        io.to(`voice-room:${roomId}`).emit("participant-unmuted", {
          roomId,
          userId: targetUserId,
          socketId: targetSocketId,
          unmutedBy: socket.userId,
        });

        socket.emit("participant-unmuted-success", {
          roomId,
          userId: targetUserId,
        });
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("[Socket.IO] Error unmuting participant:", error);
        socket.emit("error", { message: "Failed to unmute participant" });
      }
    });

    // Leave voice room
    socket.on("leave-voice-room", async (data) => {
      try {
        const { roomId } = data;
        
        // eslint-disable-next-line no-console
        if (socket.isAuthenticated) {
          console.log(`[VoiceRoom] User ${socket.userId} leaving room ${roomId}`);
        } else {
          console.log(`[VoiceRoom] Guest listener ${socket.id} leaving room ${roomId}`);
        }
        
        if (!roomId) {
          return;
        }

        // Close mediasoup transports (complete cleanup)
        closeTransport(socket.id);

        socket.leave(`voice-room:${roomId}`);
        
        const room = await LiveRoom.findById(roomId);
        if (room) {
          // Only remove from database if authenticated
          if (socket.isAuthenticated && socket.userId) {
            // Remove participant
            room.participants = room.participants.filter(
              (p) => p.userId.toString() !== socket.userId
            );

            // Remove from speak requests
            room.speakRequests = room.speakRequests.filter(
              (r) => r.userId.toString() !== socket.userId
            );
          }

          // Decrement listener count if was listener
          if (socket.data.voiceRole === "listener") {
            room.listeners = Math.max(0, (room.listeners || 0) - 1);
          }

          await room.save();

          // Notify others about producer leaving (if was a speaker)
          if (socket.data.voiceRole === "speaker" || socket.data.voiceRole === "host") {
            socket.to(`voice-room:${roomId}`).emit("producer-closed", {
              roomId,
              socketId: socket.id,
              userId: socket.userId || socket.id,
            });
          }

          // Get updated participants list
          const updatedParticipants = await Promise.all(
            room.participants.map(async (p) => {
              const user = await User.findById(p.userId).select("fullName").lean();
              return {
                userId: p.userId.toString(),
                userName: user?.fullName || "Unknown User",
                role: p.role,
                socketId: p.socketId,
              };
            })
          );

          // Notify others
          socket.to(`voice-room:${roomId}`).emit("participant-left", {
            userId: socket.userId || socket.id,
            userName: socket.userFullName || "Guest Listener",
          });

          // Broadcast updated participants list
          io.to(`voice-room:${roomId}`).emit("participants-updated", {
            roomId,
            participants: updatedParticipants,
          });
        }

        socket.data.voiceRoomId = null;
        socket.data.voiceRole = null;
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("[Socket.IO] Error leaving voice room:", error);
      }
    });

    // ========== Room Chat Handlers ==========

    // Join room chat (load chat history when joining voice room)
    socket.on("join-room-chat", async (data) => {
      try {
        const { roomId } = data;

        if (!roomId || !mongoose.isValidObjectId(roomId)) {
          socket.emit("error", { message: "Invalid room ID" });
          return;
        }

        const room = await LiveRoom.findById(roomId);
        if (!room) {
          socket.emit("error", { message: "Room not found" });
          return;
        }

        // Check if user is in the room
        const isParticipant = room.participants.some(
          (p) => p.userId.toString() === socket.userId
        );

        if (!isParticipant) {
          socket.emit("error", { message: "You are not a participant in this room" });
          return;
        }

        // Load recent chat history (last 50 non-deleted messages)
        const messages = await RoomMessage.find({
          roomId: new mongoose.Types.ObjectId(roomId),
          deletedAt: null,
        })
          .sort({ createdAt: -1 })
          .limit(50)
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

        socket.emit("room-chat-history", {
          roomId,
          messages: formattedMessages,
          mutedChatUsers,
        });
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("[Socket.IO] Error joining room chat:", error);
        socket.emit("error", { message: "Failed to load chat history" });
      }
    });

    // Send room message
    socket.on("send-room-message", async (data) => {
      try {
        const { roomId, content } = data;

        // Validate user is authenticated
        if (!socket.userId) {
          socket.emit("error", { message: "You must be logged in to send messages" });
          return;
        }

        if (!roomId || !content || !content.trim()) {
          socket.emit("error", { message: "Room ID and message content are required" });
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

        // Validate room is live
        if (room.status !== "live") {
          socket.emit("error", { message: "Room is not live" });
          return;
        }

        // Check if user is a participant
        const isParticipant = room.participants.some(
          (p) => p.userId.toString() === socket.userId
        );

        if (!isParticipant) {
          socket.emit("error", { message: "You are not a participant in this room" });
          return;
        }

        // Check if user is muted
        const mutedChatUsers = room.metadata?.mutedChatUsers || [];
        if (mutedChatUsers.includes(socket.userId)) {
          socket.emit("error", { message: "You are muted and cannot send messages" });
          return;
        }

        // Create message
        const message = await RoomMessage.create({
          roomId: new mongoose.Types.ObjectId(roomId),
          sender: new mongoose.Types.ObjectId(socket.userId),
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

        // Broadcast to all participants in the room
        io.to(`voice-room:${roomId}`).emit("room-message", formattedMessage);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("[Socket.IO] Error sending room message:", error);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    // Delete room message (host only)
    socket.on("delete-room-message", async (data) => {
      try {
        const { roomId, messageId } = data;

        if (!roomId || !messageId) {
          socket.emit("error", { message: "Room ID and message ID are required" });
          return;
        }

        if (!socket.userId) {
          socket.emit("error", { message: "Authentication required" });
          return;
        }

        const room = await LiveRoom.findById(roomId);
        if (!room) {
          socket.emit("error", { message: "Room not found" });
          return;
        }

        // Check if user is host
        if (room.host.toString() !== socket.userId) {
          socket.emit("error", { message: "Only the host can delete messages" });
          return;
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
          socket.emit("error", { message: "Message not found" });
          return;
        }

        // Broadcast deletion to all participants
        io.to(`voice-room:${roomId}`).emit("room-message-deleted", {
          roomId,
          messageId,
        });
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("[Socket.IO] Error deleting room message:", error);
        socket.emit("error", { message: "Failed to delete message" });
      }
    });

    // Mute user from chat (host only)
    socket.on("mute-user-chat", async (data) => {
      try {
        const { roomId, userId } = data;

        if (!roomId || !userId) {
          socket.emit("error", { message: "Room ID and user ID are required" });
          return;
        }

        if (!socket.userId) {
          socket.emit("error", { message: "Authentication required" });
          return;
        }

        const room = await LiveRoom.findById(roomId);
        if (!room) {
          socket.emit("error", { message: "Room not found" });
          return;
        }

        // Check if user is host
        if (room.host.toString() !== socket.userId) {
          socket.emit("error", { message: "Only the host can mute users" });
          return;
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

        // Broadcast to all participants
        io.to(`voice-room:${roomId}`).emit("user-chat-muted", {
          roomId,
          userId,
        });
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("[Socket.IO] Error muting user chat:", error);
        socket.emit("error", { message: "Failed to mute user" });
      }
    });

    // Unmute user from chat (host only)
    socket.on("unmute-user-chat", async (data) => {
      try {
        const { roomId, userId } = data;

        if (!roomId || !userId) {
          socket.emit("error", { message: "Room ID and user ID are required" });
          return;
        }

        if (!socket.userId) {
          socket.emit("error", { message: "Authentication required" });
          return;
        }

        const room = await LiveRoom.findById(roomId);
        if (!room) {
          socket.emit("error", { message: "Room not found" });
          return;
        }

        // Check if user is host
        if (room.host.toString() !== socket.userId) {
          socket.emit("error", { message: "Only the host can unmute users" });
          return;
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

        // Broadcast to all participants
        io.to(`voice-room:${roomId}`).emit("user-chat-unmuted", {
          roomId,
          userId,
        });
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("[Socket.IO] Error unmuting user chat:", error);
        socket.emit("error", { message: "Failed to unmute user" });
      }
    });

    // Handle disconnect
    socket.on("disconnect", async () => {
      // eslint-disable-next-line no-console
      if (socket.isAuthenticated) {
        console.log(`[Socket.IO] User disconnected: ${socket.userId}`);
        // Broadcast user is offline only if authenticated
        io.emit("user_offline", {
          userId: socket.userId,
          userName: socket.userFullName,
        });
      } else {
        console.log(`[Socket.IO] Guest listener disconnected: ${socket.id}`);
      }

      // Clean up voice room participation
      if (socket.data.voiceRoomId) {
        const roomId = socket.data.voiceRoomId;
        
        // Clean up native WebRTC
        removeSpeaker(roomId, socket.id);
        
        // Close mediasoup transports (if using mediasoup)
        if (isMediasoupAvailable()) {
          closeTransport(socket.id);
        }

        const room = await LiveRoom.findById(socket.data.voiceRoomId);
        if (room) {
          // Only remove from database if authenticated
          if (socket.isAuthenticated && socket.userId) {
            room.participants = room.participants.filter(
              (p) => p.userId.toString() !== socket.userId
            );
            room.speakRequests = room.speakRequests.filter(
              (r) => r.userId.toString() !== socket.userId
            );
          }
          if (socket.data.voiceRole === "listener") {
            room.listeners = Math.max(0, (room.listeners || 0) - 1);
          }
          await room.save();

          // Notify others about producer leaving (if was a speaker)
          if (socket.data.voiceRole === "speaker" || socket.data.voiceRole === "host") {
            socket.to(`voice-room:${socket.data.voiceRoomId}`).emit("producer-closed", {
              roomId: socket.data.voiceRoomId,
              socketId: socket.id,
              userId: socket.userId || socket.id,
            });
          }

          socket.to(`voice-room:${socket.data.voiceRoomId}`).emit("participant-left", {
            userId: socket.userId || socket.id,
            userName: socket.userFullName || "Guest Listener",
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

