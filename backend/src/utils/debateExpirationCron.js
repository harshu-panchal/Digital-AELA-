import cron from "node-cron";
import LiveRoom from "../models/LiveRoom.js";
import { cleanupRoom as cleanupMediasoup } from "../services/mediasoupService.js";
import { cleanupRoom as cleanupWebRTC } from "../services/webrtcService.js";
import { getSocketIO } from "../utils/socketEmitter.js";

/**
 * Delete expired debate rooms
 * This function can be called directly or by the cron job
 */
export const deleteExpiredDebates = async () => {
  try {
    const now = new Date();
    
    // Find all debate rooms where scheduledEnd has passed and status is "live" or "scheduled"
    const expiredRooms = await LiveRoom.find({
      type: "debate",
      scheduledEnd: { $lte: now },
      status: { $in: ["live", "scheduled"] },
    }).lean();

    if (expiredRooms.length === 0) {
      return { deleted: 0 };
    }

    const io = getSocketIO();
    let deletedCount = 0;

    for (const room of expiredRooms) {
      try {
        const roomId = room._id.toString();

        // Cleanup mediasoup resources
        try {
          await cleanupMediasoup(roomId);
        } catch (cleanupError) {
          // eslint-disable-next-line no-console
          console.error(`[DebateExpiration] Error cleaning up mediasoup for room ${roomId}:`, cleanupError);
        }

        // Cleanup WebRTC resources
        try {
          cleanupWebRTC(roomId);
        } catch (cleanupError) {
          // eslint-disable-next-line no-console
          console.error(`[DebateExpiration] Error cleaning up WebRTC for room ${roomId}:`, cleanupError);
        }

        // Delete the room
        await LiveRoom.findByIdAndDelete(room._id);

        // Emit socket event to notify all clients
        if (io) {
          io.emit("room_deleted", {
            roomId,
            reason: "expired",
          });
          // Also emit to specific room rooms in case they're listening
          io.to(`room:${roomId}`).emit("room_deleted", {
            roomId,
            reason: "expired",
          });
          io.to(`voice-room:${roomId}`).emit("room_deleted", {
            roomId,
            reason: "expired",
          });
        }

        deletedCount++;
        // eslint-disable-next-line no-console
        console.log(`[DebateExpiration] Deleted expired debate room: ${roomId} (${room.title})`);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(`[DebateExpiration] Error deleting room ${room._id}:`, error);
        // Continue with other rooms even if one fails
      }
    }

    return { deleted: deletedCount };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[DebateExpiration] Error in deleteExpiredDebates:", error);
    throw error;
  }
};

/**
 * Setup cron job to delete expired debates
 * Runs every minute
 */
export const setupDebateExpirationCron = () => {
  // Run every minute: "* * * * *"
  cron.schedule("* * * * *", async () => {
    // eslint-disable-next-line no-console
    console.log("[Cron] Running debate expiration task...");
    try {
      const result = await deleteExpiredDebates();
      if (result.deleted > 0) {
        // eslint-disable-next-line no-console
        console.log(`[Cron] Debate expiration task completed: ${result.deleted} room(s) deleted`);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("[Cron] Error in debate expiration task:", error);
    }
  });

  // eslint-disable-next-line no-console
  console.log("[Cron] Debate expiration cron job scheduled (every minute)");
};

