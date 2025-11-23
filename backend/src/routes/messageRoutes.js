import { Router } from "express";
import {
  getConversations,
  getMessages,
  sendMessage,
  markMessagesAsRead,
} from "../controllers/messageController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { requireFeature } from "../middleware/featureFlagMiddleware.js";

const router = Router();

// Apply feature flag check for messaging
router.use(requireFeature("messaging"));

// Get all conversations for authenticated user
router.get("/conversations", requireAuth([]), getConversations);

// Get messages between authenticated user and another user
router.get("/:recipientId", requireAuth([]), getMessages);

// Send a message
router.post("/", requireAuth([]), sendMessage);

// Mark messages as read
router.patch("/:recipientId/read", requireAuth([]), markMessagesAsRead);

export default router;

