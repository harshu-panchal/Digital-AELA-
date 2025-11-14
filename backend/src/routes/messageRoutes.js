import { Router } from "express";
import {
  getConversations,
  getMessages,
  sendMessage,
  markMessagesAsRead,
} from "../controllers/messageController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

// Get all conversations for authenticated user
router.get("/conversations", requireAuth([]), getConversations);

// Get messages between authenticated user and another user
router.get("/:recipientId", requireAuth([]), getMessages);

// Send a message
router.post("/", requireAuth([]), sendMessage);

// Mark messages as read
router.patch("/:recipientId/read", requireAuth([]), markMessagesAsRead);

export default router;

