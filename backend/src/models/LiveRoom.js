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

