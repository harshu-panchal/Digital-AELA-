import { Router } from "express";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllRead,
} from "../controllers/notificationController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

// All routes require authentication
// Note: Specific routes (like /clear-all) must come before parameterized routes (like /:notificationId)
router.get("/", requireAuth([]), getNotifications);
router.get("/unread-count", requireAuth([]), getUnreadCount);
router.patch("/read-all", requireAuth([]), markAllAsRead);
router.patch("/:notificationId/read", requireAuth([]), markAsRead);
router.delete("/clear-all", requireAuth([]), clearAllRead);
router.delete("/:notificationId", requireAuth([]), deleteNotification);

export default router;

