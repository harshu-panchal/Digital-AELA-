import express from "express";
import { requireAuth, optionalAuth } from "../middleware/authMiddleware.js";
import {
  uploadSingleVideo,
  handleVideoUploadError,
} from "../middleware/videoUploadMiddleware.js";
import {
  uploadCourseVideo,
  getCourseVideos,
  getVideo,
  updateVideo,
  deleteVideo,
  updateVideoProgress,
  getVideoProgress,
  getCourseProgress,
} from "../controllers/courseVideoController.js";

const router = express.Router();

// Upload video to course (Teacher/Super Admin)
router.post(
  "/courses/:courseId/videos",
  requireAuth(),
  uploadSingleVideo("video"),
  handleVideoUploadError,
  uploadCourseVideo
);

// Get all videos for a course (public endpoint - optional auth)
router.get("/courses/:courseId/videos", optionalAuth, getCourseVideos);

// Get single video
router.get("/videos/:videoId", requireAuth(), getVideo);

// Update video
router.patch("/videos/:videoId", requireAuth(), updateVideo);

// Delete video
router.delete("/videos/:videoId", requireAuth(), deleteVideo);

// Update video progress
router.post("/videos/:videoId/progress", requireAuth(), updateVideoProgress);

// Get video progress
router.get("/videos/:videoId/progress", requireAuth(), getVideoProgress);

// Get course progress
router.get("/courses/:courseId/progress", requireAuth(), getCourseProgress);

export default router;

