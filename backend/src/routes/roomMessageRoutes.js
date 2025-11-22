import { Router } from "express";
import {
  getRoomMessages,
  sendRoomMessage,
  deleteRoomMessage,
  muteUserChat,
  unmuteUserChat,
} from "../controllers/roomMessageController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router({ mergeParams: true }); // mergeParams to access roomId from parent route

// Get room messages (chat history) - public
router.get("/", getRoomMessages);

// Send room message - authenticated
router.post("/", requireAuth([]), sendRoomMessage);

// Delete room message - authenticated, host only
router.delete("/:messageId", requireAuth([]), deleteRoomMessage);

// Mute user from chat - authenticated, host only
router.post("/mute/:userId", requireAuth([]), muteUserChat);

// Unmute user from chat - authenticated, host only
router.post("/unmute/:userId", requireAuth([]), unmuteUserChat);

export default router;

