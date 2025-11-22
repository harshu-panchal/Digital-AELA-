import { Router } from "express";
import {
  getLiveRooms,
  getLiveRoom,
  createLiveRoom,
  voteOnDebate,
  joinRoom,
  leaveRoom,
  deleteRoom,
} from "../controllers/liveRoomController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import roomMessageRoutes from "./roomMessageRoutes.js";

const router = Router();

// Get all live rooms (public)
router.get("/", getLiveRooms);

// Get a single live room (public)
router.get("/:roomId", getLiveRoom);

// Create a new live room (authenticated)
router.post("/", requireAuth([]), createLiveRoom);

// Vote on a debate (authenticated)
router.post("/:roomId/vote", requireAuth([]), voteOnDebate);

// Join a room (public, but can be authenticated)
router.post("/:roomId/join", joinRoom);

// Leave a room (public, but can be authenticated)
router.post("/:roomId/leave", leaveRoom);

// Delete a room (host only, authenticated)
router.delete("/:roomId", requireAuth([]), deleteRoom);

// Nested routes for room messages
router.use("/:roomId/messages", roomMessageRoutes);

export default router;

