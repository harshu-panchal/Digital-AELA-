import mongoose from "mongoose";

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

const LiveRoom = mongoose.model("LiveRoom", liveRoomSchema);

export default LiveRoom;

