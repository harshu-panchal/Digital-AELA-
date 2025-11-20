import express from "express";
import {
  createAnnouncement,
  getAllAnnouncements,
  getAnnouncementDetails,
  updateAnnouncement,
  deleteAnnouncement,
  publishAnnouncement,
  markAnnouncementAsRead,
  getAnnouncementStats,
  getStudentAnnouncements,
} from "../controllers/announcementController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

// Stats
router.get("/stats", authenticate, getAnnouncementStats);

// Student announcements
router.get("/student", authenticate, getStudentAnnouncements);

// CRUD operations
router.post("/", authenticate, createAnnouncement);
router.get("/", authenticate, getAllAnnouncements);
router.get("/:announcementId", authenticate, getAnnouncementDetails);
router.put("/:announcementId", authenticate, updateAnnouncement);
router.delete("/:announcementId", authenticate, deleteAnnouncement);

// Publish and read
router.post("/:announcementId/publish", authenticate, publishAnnouncement);
router.post("/:announcementId/read", authenticate, markAnnouncementAsRead);

export default router;

