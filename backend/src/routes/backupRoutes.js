import express from "express";
import {
  createBackup,
  getAllBackups,
  getBackupDetails,
  downloadBackup,
  restoreBackup,
  deleteBackup,
  getBackupStats,
  cleanupBackups,
} from "../controllers/backupController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

// Stats
router.get("/stats", authenticate, getBackupStats);

// Cleanup
router.post("/cleanup", authenticate, cleanupBackups);

// CRUD operations
router.post("/", authenticate, createBackup);
router.get("/", authenticate, getAllBackups);
router.get("/:backupId", authenticate, getBackupDetails);
router.delete("/:backupId", authenticate, deleteBackup);

// Download and restore
router.get("/:backupId/download", authenticate, downloadBackup);
router.post("/:backupId/restore", authenticate, restoreBackup);

export default router;

