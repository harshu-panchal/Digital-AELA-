import express from "express";
import {
  getAllBatches,
  getMyBatch,
  getBatchDetails,
  createBatch,
  updateBatch,
  addStudentToBatch,
  removeStudentFromBatch,
  getBatchStats,
} from "../controllers/batchController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

// Stats (Admin only)
router.get("/stats", authenticate, getBatchStats);

// Student's batch
router.get("/my-batch", authenticate, getMyBatch);

// CRUD operations
router.post("/", authenticate, createBatch);
router.get("/", authenticate, getAllBatches);
router.get("/:batchId", authenticate, getBatchDetails);
router.put("/:batchId", authenticate, updateBatch);

// Student management
router.post("/:batchId/students/:studentId", authenticate, addStudentToBatch);
router.delete("/:batchId/students/:studentId", authenticate, removeStudentFromBatch);

export default router;

