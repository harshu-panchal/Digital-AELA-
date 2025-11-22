import mongoose from "mongoose";
import RoomMessage from "./RoomMessage.js";

const liveRoomSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["debate", "open-room", "workshop"],
      default: "open-room",
    },
    topic: String,
    description: String,
    speakers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    // Track participants with their roles for voice rooms
    participants: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        role: {
          type: String,
          enum: ["host", "speaker", "listener", "requested"],
          default: "listener",
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
        socketId: String, // Track socket ID for WebRTC signaling
      },
    ],
    // Track pending speak requests
    speakRequests: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        requestedAt: {
          type: Date,
          default: Date.now,
        },
        socketId: String,
      },
    ],
    forVotes: {
      type: Number,
      default: 0,
    },
    againstVotes: {
      type: Number,
      default: 0,
    },
    listeners: {
      type: Number,
      default: 0,
    },
    scheduledStart: Date,
    actualStart: Date,
    actualEnd: Date,
    status: {
      type: String,
      enum: ["scheduled", "live", "ended"],
      default: "scheduled",
    },
    moderationStatus: {
      type: String,
      enum: ["pending", "approved", "suspended", "rejected"],
      default: "pending",
    },
    winners: [String],
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    suppressReservedKeysWarning: true,
  }
);

// Index for efficient queries
liveRoomSchema.index({ status: 1, scheduledStart: 1 });
liveRoomSchema.index({ host: 1, createdAt: -1 });

// Cleanup hook: Delete all room messages when room status changes to "ended"
liveRoomSchema.post("findOneAndUpdate", async function(doc) {
  if (!doc) return;
  try {
    // Check if status was updated to "ended"
    const update = this.getUpdate();
    if (update.$set && update.$set.status === "ended") {
      // Delete all messages for this room
      await RoomMessage.deleteMany({ roomId: doc._id });
      // Clean up mutedChatUsers array if it exists
      if (doc.metadata && doc.metadata.mutedChatUsers && doc.metadata.mutedChatUsers.length > 0) {
        // Use findOneAndUpdate to avoid recursion
        await LiveRoom.findByIdAndUpdate(doc._id, {
          "metadata.mutedChatUsers": [],
        }, { runValidators: false });
      }
      // eslint-disable-next-line no-console
      console.log(`[LiveRoom] Cleaned up messages for ended room ${doc._id}`);
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`[LiveRoom] Error cleaning up messages for room ${doc._id}:`, error);
  }
});

// Handle direct save operations
liveRoomSchema.post("save", async function(doc) {
  // Check if status is "ended" (cleanup will run even if called multiple times, which is fine)
  if (doc.status === "ended") {
    try {
      // Delete all messages for this room
      await RoomMessage.deleteMany({ roomId: doc._id });
      // Clean up mutedChatUsers array if it exists
      if (doc.metadata && doc.metadata.mutedChatUsers && doc.metadata.mutedChatUsers.length > 0) {
        // Use findOneAndUpdate to avoid recursion
        await LiveRoom.findByIdAndUpdate(doc._id, {
          "metadata.mutedChatUsers": [],
        }, { runValidators: false });
      }
      // eslint-disable-next-line no-console
      console.log(`[LiveRoom] Cleaned up messages for ended room ${doc._id}`);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`[LiveRoom] Error cleaning up messages for room ${doc._id}:`, error);
    }
  }
});

const LiveRoom = mongoose.model("LiveRoom", liveRoomSchema);

export default LiveRoom;

