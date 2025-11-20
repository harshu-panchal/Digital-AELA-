import express from "express";
import {
  getActiveSessions,
  getAllSessions,
  getSessionDetails,
  terminateSession,
  getSessionStats,
  getUserSessions,
} from "../controllers/sessionController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

// Stats
router.get("/stats", authenticate, getSessionStats);

// Active sessions
router.get("/active", authenticate, getActiveSessions);

// All sessions
router.get("/", authenticate, getAllSessions);

// User sessions
router.get("/user/:userId", authenticate, getUserSessions);

// Session details and actions
router.get("/:sessionId", authenticate, getSessionDetails);
router.post("/:sessionId/terminate", authenticate, terminateSession);

export default router;

