import express from "express";
import {
  submitApplication,
} from "../controllers/joinUsApplicationController.js";
import {
  uploadJoinUsFiles,
  handleJoinUsUploadError,
} from "../middleware/joinUsUploadMiddleware.js";

const router = express.Router();

// Public endpoint for form submission (no auth required)
router.post(
  "/submit",
  uploadJoinUsFiles,
  handleJoinUsUploadError,
  submitApplication
);

export default router;

