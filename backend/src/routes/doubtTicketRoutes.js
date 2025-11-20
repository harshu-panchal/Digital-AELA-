import express from "express";
import {
  createDoubtTicket,
  getAllDoubtTickets,
  getDoubtTicketDetails,
  replyToDoubtTicket,
  updateDoubtTicketStatus,
  assignDoubtTicket,
  getDoubtTicketStats,
} from "../controllers/doubtTicketController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

// Stats
router.get("/stats", authenticate, getDoubtTicketStats);

// CRUD operations
router.post("/", authenticate, createDoubtTicket);
router.get("/", authenticate, getAllDoubtTickets);
router.get("/:ticketId", authenticate, getDoubtTicketDetails);

// Reply and status updates
router.post("/:ticketId/reply", authenticate, replyToDoubtTicket);
router.put("/:ticketId/status", authenticate, updateDoubtTicketStatus);
router.put("/:ticketId/assign", authenticate, assignDoubtTicket);

export default router;

