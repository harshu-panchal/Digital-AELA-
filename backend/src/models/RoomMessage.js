import mongoose from "mongoose";

const roomMessageSchema = new mongoose.Schema(
  {
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LiveRoom",
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["text"],
      default: "text",
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
roomMessageSchema.index({ roomId: 1, createdAt: -1 });
roomMessageSchema.index({ roomId: 1, deletedAt: 1 });
roomMessageSchema.index({ sender: 1, createdAt: -1 });

const RoomMessage = mongoose.model("RoomMessage", roomMessageSchema);

export default RoomMessage;

