# 🎥 Course Video Upload & Access Control - Implementation Plan

## Overview

This document outlines the complete implementation plan for allowing teachers/super-admins to upload course videos during course creation, and restricting video access to only enrolled students.

---

## 📋 Table of Contents

1. [Database Schema](#database-schema)
2. [Backend Implementation](#backend-implementation)
3. [Frontend Implementation](#frontend-implementation)
4. [Access Control Flow](#access-control-flow)
5. [File Structure](#file-structure)
6. [Implementation Steps](#implementation-steps)

---

## 🗄️ Database Schema

### 1. Create Video Model (`backend/src/models/CourseVideo.js`)

```javascript
import mongoose from "mongoose";

const courseVideoSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    videoUrl: {
      type: String,
      required: true,
    },
    thumbnailUrl: {
      type: String,
    },
    duration: {
      type: Number, // in seconds
      default: 0,
    },
    order: {
      type: Number,
      default: 0, // For ordering videos within a course
    },
    isPreview: {
      type: Boolean,
      default: false, // If true, can be viewed without enrollment
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
courseVideoSchema.index({ course: 1, order: 1 });

const CourseVideo = mongoose.model("CourseVideo", courseVideoSchema);

export default CourseVideo;
```

### 2. Create Video Progress Model (`backend/src/models/VideoProgress.js`)

```javascript
import mongoose from "mongoose";

const videoProgressSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    video: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CourseVideo",
      required: true,
      index: true,
    },
    watchedDuration: {
      type: Number, // in seconds
      default: 0,
    },
    totalDuration: {
      type: Number, // in seconds (from video)
      default: 0,
    },
    progressPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    completedAt: Date,
    lastWatchedAt: {
      type: Date,
      default: Date.now,
    },
    watchCount: {
      type: Number,
      default: 0,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate progress records
videoProgressSchema.index(
  { student: 1, course: 1, video: 1 },
  { unique: true }
);

// Index for efficient queries
videoProgressSchema.index({ student: 1, course: 1 });
videoProgressSchema.index({ student: 1, lastWatchedAt: -1 });

const VideoProgress = mongoose.model("VideoProgress", videoProgressSchema);

export default VideoProgress;
```

### 3. Update Course Model (Optional - Add videos reference)

You can add a virtual or keep videos separate. The current Course model is fine as-is since we'll query videos by courseId.

---

## 🔧 Backend Implementation

### 1. Video Upload Middleware (`backend/src/middleware/videoUploadMiddleware.js`)

```javascript
import multer from "multer";
import cloudinary from "../config/cloudinary.js";
import { Readable } from "stream";

// Memory storage for multer
const storage = multer.memoryStorage();

// File filter for videos
const videoFileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "video/mp4",
    "video/mpeg",
    "video/quicktime",
    "video/x-msvideo",
    "video/webm",
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only video files (MP4, MOV, AVI, WebM) are allowed."
      ),
      false
    );
  }
};

// Configure multer for videos (larger file size limit)
export const videoUpload = multer({
  storage: storage,
  fileFilter: videoFileFilter,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB limit for videos
  },
});

// Helper function to upload video to Cloudinary
export const uploadVideoToCloudinary = (
  buffer,
  folder = "digital-aela/course-videos"
) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: "video",
        allowed_formats: ["mp4", "mov", "avi", "webm"],
        public_id: `video-${Date.now()}-${Math.round(Math.random() * 1e9)}`,
        chunk_size: 6000000, // 6MB chunks for large files
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve({
          public_id: result.public_id,
          url: result.secure_url,
          duration: result.duration, // Video duration in seconds
          format: result.format,
          width: result.width,
          height: result.height,
          bytes: result.bytes,
        });
      }
    );

    const readableStream = Readable.from(buffer);
    readableStream.pipe(uploadStream);
  });
};

// Single video upload middleware
export const uploadSingleVideo = (fieldName = "video") => {
  return videoUpload.single(fieldName);
};

// Multiple videos upload middleware
export const uploadMultipleVideos = (fieldName = "videos", maxCount = 10) => {
  return videoUpload.array(fieldName, maxCount);
};

// Handle video upload errors
export const handleVideoUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        error: {
          code: "FILE_TOO_LARGE",
          message: "Video file size exceeds the limit of 500MB",
        },
      });
    }
    if (err.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        error: {
          code: "TOO_MANY_FILES",
          message: "Too many video files uploaded",
        },
      });
    }
  }

  if (err.message && err.message.includes("Invalid file type")) {
    return res.status(400).json({
      error: {
        code: "INVALID_FILE_TYPE",
        message: err.message,
      },
    });
  }

  return next(err);
};
```

### 2. Video Controller (`backend/src/controllers/courseVideoController.js`)

```javascript
import CourseVideo from "../models/CourseVideo.js";
import Course from "../models/Course.js";
import Enrollment from "../models/Enrollment.js";
import VideoProgress from "../models/VideoProgress.js";
import mongoose from "mongoose";
import { uploadVideoToCloudinary } from "../middleware/videoUploadMiddleware.js";

/**
 * Upload a video for a course (Teacher/Super Admin only)
 * POST /api/v1/courses/:courseId/videos
 */
export const uploadCourseVideo = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { userId, userRole } = req.auth;

    if (!["teacher", "super-admin"].includes(userRole)) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only teachers and super admins can upload course videos",
        },
      });
    }

    if (!mongoose.isValidObjectId(courseId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid course ID",
        },
      });
    }

    // Check if course exists and user has permission
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Course not found",
        },
      });
    }

    // Verify ownership (teacher can only upload to their own courses)
    if (userRole === "teacher" && course.instructor.toString() !== userId) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "You can only upload videos to your own courses",
        },
      });
    }

    if (!req.file) {
      return res.status(400).json({
        error: {
          code: "FILE_REQUIRED",
          message: "No video file uploaded",
        },
      });
    }

    const { title, description, order, isPreview } = req.body;

    // Upload video to Cloudinary
    const uploadResult = await uploadVideoToCloudinary(
      req.file.buffer,
      `digital-aela/courses/${courseId}/videos`
    );

    // Create video record
    const video = await CourseVideo.create({
      course: courseId,
      title: title || `Video ${Date.now()}`,
      description: description || "",
      videoUrl: uploadResult.url,
      thumbnailUrl: uploadResult.url.replace(/\.(mp4|mov|avi|webm)$/i, ".jpg"), // Cloudinary auto-generates thumbnails
      duration: Math.round(uploadResult.duration || 0),
      order: order ? Number(order) : 0,
      isPreview: isPreview === "true" || isPreview === true,
      metadata: {
        publicId: uploadResult.public_id,
        format: uploadResult.format,
        size: uploadResult.bytes,
      },
    });

    const populatedVideo = await CourseVideo.findById(video._id)
      .populate("course", "title instructor")
      .lean();

    return res.status(201).json({
      message: "Video uploaded successfully",
      video: populatedVideo,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get all videos for a course (with access control)
 * GET /api/v1/courses/:courseId/videos
 */
export const getCourseVideos = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { userId, userRole } = req.auth || {};

    if (!mongoose.isValidObjectId(courseId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid course ID",
        },
      });
    }

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Course not found",
        },
      });
    }

    // Check access permissions
    let hasAccess = false;

    // Teachers and super-admins can always see videos for their courses
    if (userRole === "teacher" && course.instructor.toString() === userId) {
      hasAccess = true;
    } else if (userRole === "super-admin") {
      hasAccess = true;
    } else if (userId) {
      // Check if student is enrolled
      const enrollment = await Enrollment.findOne({
        student: userId,
        course: courseId,
        status: "active",
      });
      hasAccess = !!enrollment;
    }

    // Get videos
    const videos = await CourseVideo.find({ course: courseId })
      .sort({ order: 1, createdAt: 1 })
      .lean();

    // Filter videos based on access
    const accessibleVideos = videos.map((video) => {
      if (hasAccess || video.isPreview) {
        return video; // Full access
      }
      // Return limited info for non-enrolled users
      return {
        _id: video._id,
        title: video.title,
        description: video.description,
        duration: video.duration,
        order: video.order,
        isPreview: video.isPreview,
        isLocked: true, // Indicate locked status
      };
    });

    return res.status(200).json({
      videos: accessibleVideos,
      hasAccess,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get a single video with access control
 * GET /api/v1/videos/:videoId
 */
export const getVideo = async (req, res, next) => {
  try {
    const { videoId } = req.params;
    const { userId, userRole } = req.auth || {};

    if (!mongoose.isValidObjectId(videoId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid video ID",
        },
      });
    }

    const video = await CourseVideo.findById(videoId)
      .populate("course", "title instructor")
      .lean();
    if (!video) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Video not found",
        },
      });
    }

    // Check access permissions
    let hasAccess = false;

    // Preview videos are accessible to everyone
    if (video.isPreview) {
      hasAccess = true;
    } else if (
      userRole === "teacher" &&
      video.course.instructor.toString() === userId
    ) {
      hasAccess = true;
    } else if (userRole === "super-admin") {
      hasAccess = true;
    } else if (userId) {
      // Check if student is enrolled
      const enrollment = await Enrollment.findOne({
        student: userId,
        course: video.course._id,
        status: "active",
      });
      hasAccess = !!enrollment;
    }

    if (!hasAccess) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "You must be enrolled in this course to access this video",
        },
      });
    }

    return res.status(200).json({
      video,
      hasAccess: true,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Update video details
 * PATCH /api/v1/videos/:videoId
 */
export const updateVideo = async (req, res, next) => {
  try {
    const { videoId } = req.params;
    const { userId, userRole } = req.auth;

    if (!["teacher", "super-admin"].includes(userRole)) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only teachers and super admins can update videos",
        },
      });
    }

    const video = await CourseVideo.findById(videoId).populate(
      "course",
      "instructor"
    );
    if (!video) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Video not found",
        },
      });
    }

    // Verify ownership
    if (
      userRole === "teacher" &&
      video.course.instructor.toString() !== userId
    ) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "You can only update videos in your own courses",
        },
      });
    }

    const { title, description, order, isPreview } = req.body;

    if (title !== undefined) video.title = title;
    if (description !== undefined) video.description = description;
    if (order !== undefined) video.order = Number(order);
    if (isPreview !== undefined)
      video.isPreview = isPreview === true || isPreview === "true";

    await video.save();

    return res.status(200).json({
      message: "Video updated successfully",
      video,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Delete a video
 * DELETE /api/v1/videos/:videoId
 */
export const deleteVideo = async (req, res, next) => {
  try {
    const { videoId } = req.params;
    const { userId, userRole } = req.auth;

    if (!["teacher", "super-admin"].includes(userRole)) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only teachers and super admins can delete videos",
        },
      });
    }

    const video = await CourseVideo.findById(videoId).populate(
      "course",
      "instructor"
    );
    if (!video) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Video not found",
        },
      });
    }

    // Verify ownership
    if (
      userRole === "teacher" &&
      video.course.instructor.toString() !== userId
    ) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "You can only delete videos in your own courses",
        },
      });
    }

    // TODO: Delete from Cloudinary if needed
    // await cloudinary.uploader.destroy(video.metadata.publicId, { resource_type: "video" });

    // Delete associated progress records
    await VideoProgress.deleteMany({ video: videoId });

    await CourseVideo.findByIdAndDelete(videoId);

    return res.status(200).json({
      message: "Video deleted successfully",
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Update video watch progress
 * POST /api/v1/videos/:videoId/progress
 */
export const updateVideoProgress = async (req, res, next) => {
  try {
    const { videoId } = req.params;
    const { userId } = req.auth;
    const { watchedDuration } = req.body;

    if (!mongoose.isValidObjectId(videoId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid video ID",
        },
      });
    }

    const video = await CourseVideo.findById(videoId).populate(
      "course",
      "instructor"
    );
    if (!video) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Video not found",
        },
      });
    }

    // Check if student is enrolled
    const enrollment = await Enrollment.findOne({
      student: userId,
      course: video.course._id,
      status: "active",
    });

    if (!enrollment && !video.isPreview) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "You must be enrolled in this course to track progress",
        },
      });
    }

    const watchedSeconds = Math.max(
      0,
      Math.min(Number(watchedDuration) || 0, video.duration || 0)
    );
    const progressPercentage =
      video.duration > 0
        ? Math.round((watchedSeconds / video.duration) * 100)
        : 0;
    const isCompleted = progressPercentage >= 90; // Consider 90% as completed

    const progress = await VideoProgress.findOneAndUpdate(
      { student: userId, course: video.course._id, video: videoId },
      {
        student: userId,
        course: video.course._id,
        video: videoId,
        watchedDuration: watchedSeconds,
        totalDuration: video.duration || 0,
        progressPercentage,
        isCompleted,
        lastWatchedAt: new Date(),
        ...(isCompleted && { completedAt: new Date() }),
        $inc: { watchCount: 1 },
      },
      { upsert: true, new: true }
    )
      .populate("video", "title duration")
      .lean();

    return res.status(200).json({
      progress: {
        _id: progress._id,
        watchedDuration: progress.watchedDuration,
        totalDuration: progress.totalDuration,
        progressPercentage: progress.progressPercentage,
        isCompleted: progress.isCompleted,
        lastWatchedAt: progress.lastWatchedAt,
        watchCount: progress.watchCount,
      },
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get video progress for a student
 * GET /api/v1/videos/:videoId/progress
 */
export const getVideoProgress = async (req, res, next) => {
  try {
    const { videoId } = req.params;
    const { userId } = req.auth;

    if (!mongoose.isValidObjectId(videoId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid video ID",
        },
      });
    }

    const progress = await VideoProgress.findOne({
      student: userId,
      video: videoId,
    }).lean();

    if (!progress) {
      return res.status(200).json({
        progress: {
          watchedDuration: 0,
          totalDuration: 0,
          progressPercentage: 0,
          isCompleted: false,
          watchCount: 0,
        },
      });
    }

    return res.status(200).json({
      progress: {
        _id: progress._id,
        watchedDuration: progress.watchedDuration,
        totalDuration: progress.totalDuration,
        progressPercentage: progress.progressPercentage,
        isCompleted: progress.isCompleted,
        lastWatchedAt: progress.lastWatchedAt,
        watchCount: progress.watchCount,
      },
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get course progress (all videos in a course)
 * GET /api/v1/courses/:courseId/progress
 */
export const getCourseProgress = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { userId } = req.auth;

    if (!mongoose.isValidObjectId(courseId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid course ID",
        },
      });
    }

    // Check enrollment
    const enrollment = await Enrollment.findOne({
      student: userId,
      course: courseId,
      status: "active",
    });

    if (!enrollment) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "You must be enrolled in this course to view progress",
        },
      });
    }

    // Get all videos for the course
    const videos = await CourseVideo.find({ course: courseId })
      .sort({ order: 1, createdAt: 1 })
      .lean();

    // Get progress for all videos
    const progressRecords = await VideoProgress.find({
      student: userId,
      course: courseId,
    }).lean();

    // Create a map of video progress
    const progressMap = {};
    progressRecords.forEach((p) => {
      progressMap[p.video.toString()] = p;
    });

    // Calculate overall course progress
    let totalVideos = videos.length;
    let completedVideos = 0;
    let totalWatchedDuration = 0;
    let totalVideoDuration = 0;

    const videosWithProgress = videos.map((video) => {
      const progress = progressMap[video._id.toString()] || {
        watchedDuration: 0,
        progressPercentage: 0,
        isCompleted: false,
        watchCount: 0,
      };

      if (progress.isCompleted) {
        completedVideos++;
      }

      totalWatchedDuration += progress.watchedDuration || 0;
      totalVideoDuration += video.duration || 0;

      return {
        video: {
          _id: video._id,
          title: video.title,
          duration: video.duration,
          order: video.order,
        },
        progress: {
          watchedDuration: progress.watchedDuration || 0,
          progressPercentage: progress.progressPercentage || 0,
          isCompleted: progress.isCompleted || false,
          lastWatchedAt: progress.lastWatchedAt || null,
          watchCount: progress.watchCount || 0,
        },
      };
    });

    const courseProgressPercentage =
      totalVideos > 0 ? Math.round((completedVideos / totalVideos) * 100) : 0;

    return res.status(200).json({
      course: {
        _id: courseId,
        totalVideos,
        completedVideos,
        courseProgressPercentage,
        totalWatchedDuration,
        totalVideoDuration,
      },
      videos: videosWithProgress,
    });
  } catch (error) {
    return next(error);
  }
};
```

### 3. Video Routes (`backend/src/routes/courseVideoRoutes.js`)

```javascript
import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
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

// Get all videos for a course
router.get("/courses/:courseId/videos", requireAuth(), getCourseVideos);

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
```

### 4. Register Routes in `backend/src/app.js`

Add to your existing routes:

```javascript
import courseVideoRoutes from "./routes/courseVideoRoutes.js";
// ...
app.use("/api/v1", courseVideoRoutes);
```

---

## 🎨 Frontend Implementation

### 1. Video Upload Service (`frontend/src/services/courseVideos.js`)

```javascript
import { apiRequest } from "./api/baseClient";

/**
 * Upload a video for a course
 */
export const uploadCourseVideo = async (courseId, videoFile, videoData) => {
  const formData = new FormData();
  formData.append("video", videoFile);
  formData.append("title", videoData.title || "");
  formData.append("description", videoData.description || "");
  formData.append("order", videoData.order || 0);
  formData.append("isPreview", videoData.isPreview || false);

  const response = await apiRequest(`/courses/${courseId}/videos`, {
    method: "POST",
    body: formData,
    // Note: Don't set Content-Type header - browser will set it with boundary
    headers: {}, // apiRequest should handle this
  });

  return response;
};

/**
 * Get all videos for a course
 */
export const getCourseVideos = async (courseId) => {
  const response = await apiRequest(`/courses/${courseId}/videos`, {
    method: "GET",
  });
  return response;
};

/**
 * Get a single video
 */
export const getVideo = async (videoId) => {
  const response = await apiRequest(`/videos/${videoId}`, {
    method: "GET",
  });
  return response;
};

/**
 * Update video details
 */
export const updateVideo = async (videoId, videoData) => {
  const response = await apiRequest(`/videos/${videoId}`, {
    method: "PATCH",
    body: videoData,
  });
  return response;
};

/**
 * Delete a video
 */
export const deleteVideo = async (videoId) => {
  const response = await apiRequest(`/videos/${videoId}`, {
    method: "DELETE",
  });
  return response;
};

/**
 * Update video watch progress
 */
export const updateVideoProgress = async (videoId, watchedDuration) => {
  const response = await apiRequest(`/videos/${videoId}/progress`, {
    method: "POST",
    body: { watchedDuration },
  });
  return response;
};

/**
 * Get video progress
 */
export const getVideoProgress = async (videoId) => {
  const response = await apiRequest(`/videos/${videoId}/progress`, {
    method: "GET",
  });
  return response;
};

/**
 * Get course progress (all videos)
 */
export const getCourseProgress = async (courseId) => {
  const response = await apiRequest(`/courses/${courseId}/progress`, {
    method: "GET",
  });
  return response;
};
```

**Note:** You may need to update `apiRequest` in `baseClient.js` to handle FormData properly:

```javascript
// In baseClient.js, update the apiRequest function to handle FormData
const body =
  payload.body instanceof FormData
    ? payload.body
    : JSON.stringify(payload.body);

const headers = {
  ...(payload.headers || {}),
  ...(payload.body instanceof FormData
    ? {}
    : { "Content-Type": "application/json" }),
};
```

### 2. Video Upload Component (`frontend/modules/teacher/VideoUpload.jsx`)

```javascript
import { useState, useRef } from "react";
import { toast } from "react-toastify";
import { uploadCourseVideo } from "../../../src/services/courseVideos";
import { FaUpload, FaTimes, FaSpinner } from "react-icons/fa";

const VideoUpload = ({
  courseId,
  onVideoUploaded,
  existingVideosCount = 0,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    order: existingVideosCount,
    isPreview: false,
  });
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (500MB)
      if (file.size > 500 * 1024 * 1024) {
        toast.error("Video file size must be less than 500MB");
        return;
      }
      // Validate file type
      const allowedTypes = [
        "video/mp4",
        "video/mpeg",
        "video/quicktime",
        "video/x-msvideo",
        "video/webm",
      ];
      if (!allowedTypes.includes(file.type)) {
        toast.error(
          "Please upload a valid video file (MP4, MOV, AVI, or WebM)"
        );
        return;
      }
      setSelectedFile(file);
      if (!formData.title) {
        setFormData((prev) => ({
          ...prev,
          title: file.name.replace(/\.[^/.]+$/, ""),
        }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error("Please select a video file");
      return;
    }
    if (!formData.title.trim()) {
      toast.error("Please enter a video title");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate progress (actual progress would require XMLHttpRequest)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 500);

      await uploadCourseVideo(courseId, selectedFile, formData);

      clearInterval(progressInterval);
      setUploadProgress(100);

      toast.success("Video uploaded successfully!");
      setSelectedFile(null);
      setFormData({
        title: "",
        description: "",
        order: existingVideosCount + 1,
        isPreview: false,
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      if (onVideoUploaded) {
        onVideoUploaded();
      }
    } catch (error) {
      toast.error(error.message || "Failed to upload video");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="rounded-xl border border-white/10 bg-[#090D19]/95 p-6">
      <h3 className="mb-4 text-lg font-semibold">Upload Course Video</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium">Video File *</label>
          <div className="flex items-center gap-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/mpeg,video/quicktime,video/x-msvideo,video/webm"
              onChange={handleFileChange}
              disabled={isUploading}
              className="block w-full text-sm text-slate-300 file:mr-4 file:rounded-lg file:border-0 file:bg-[#D4AF37] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-black hover:file:bg-[#E5C158]"
            />
            {selectedFile && (
              <button
                type="button"
                onClick={() => {
                  setSelectedFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="text-red-400 hover:text-red-300">
                <FaTimes />
              </button>
            )}
          </div>
          {selectedFile && (
            <p className="mt-2 text-xs text-slate-400">
              Selected: {selectedFile.name} (
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          )}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Video Title *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, title: e.target.value }))
            }
            placeholder="Enter video title"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white placeholder:text-slate-500 focus:border-[#D4AF37] focus:outline-none"
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, description: e.target.value }))
            }
            placeholder="Enter video description (optional)"
            rows={3}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white placeholder:text-slate-500 focus:border-[#D4AF37] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-4">
          <div>
            <label className="mb-2 block text-sm font-medium">Order</label>
            <input
              type="number"
              value={formData.order}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  order: Number(e.target.value),
                }))
              }
              min={0}
              className="w-24 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white focus:border-[#D4AF37] focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 pt-6">
            <input
              type="checkbox"
              id="isPreview"
              checked={formData.isPreview}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  isPreview: e.target.checked,
                }))
              }
              className="h-4 w-4 rounded border-white/20 bg-white/5 text-[#D4AF37] focus:ring-[#D4AF37]"
            />
            <label htmlFor="isPreview" className="text-sm">
              Make this a preview video (accessible without enrollment)
            </label>
          </div>
        </div>

        {isUploading && (
          <div className="space-y-2">
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full bg-[#D4AF37] transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-xs text-slate-400">
              Uploading... {uploadProgress}%
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={isUploading || !selectedFile}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#D4AF37] px-6 py-3 font-semibold text-black transition hover:bg-[#E5C158] disabled:cursor-not-allowed disabled:opacity-50">
          {isUploading ? (
            <>
              <FaSpinner className="animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <FaUpload />
              Upload Video
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default VideoUpload;
```

### 3. Video Player Page with Progress Tracking (`frontend/modules/student/CourseVideoPlayer.jsx`)

```javascript
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import SEO from "../../../src/components/SEO";
import {
  getVideo,
  updateVideoProgress,
  getVideoProgress,
} from "../../../src/services/courseVideos";
import {
  FaPlay,
  FaLock,
  FaArrowLeft,
  FaSpinner,
  FaCheckCircle,
} from "react-icons/fa";

const CourseVideoPlayer = () => {
  const { videoId } = useParams();
  const navigate = useNavigate();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [progress, setProgress] = useState({
    watchedDuration: 0,
    progressPercentage: 0,
    isCompleted: false,
  });
  const videoRef = useRef(null);
  const progressUpdateInterval = useRef(null);

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        setLoading(true);
        const [videoResponse, progressResponse] = await Promise.all([
          getVideo(videoId),
          getVideoProgress(videoId).catch(() => ({ progress: null })),
        ]);

        setVideo(videoResponse.video);
        setHasAccess(videoResponse.hasAccess);

        if (progressResponse.progress) {
          setProgress({
            watchedDuration: progressResponse.progress.watchedDuration || 0,
            progressPercentage:
              progressResponse.progress.progressPercentage || 0,
            isCompleted: progressResponse.progress.isCompleted || false,
          });
        }
      } catch (err) {
        setError(err.message || "Failed to load video");
        if (err.code === "FORBIDDEN") {
          toast.error(
            "You must be enrolled in this course to access this video"
          );
        }
      } finally {
        setLoading(false);
      }
    };

    if (videoId) {
      fetchVideo();
    }

    return () => {
      if (progressUpdateInterval.current) {
        clearInterval(progressUpdateInterval.current);
      }
    };
  }, [videoId]);

  // Handle video time update and progress tracking
  const handleTimeUpdate = async () => {
    if (!videoRef.current || !hasAccess) return;

    const currentTime = Math.floor(videoRef.current.currentTime);
    const totalDuration = Math.floor(
      videoRef.current.duration || video?.duration || 0
    );

    if (currentTime > 0 && totalDuration > 0) {
      // Update progress every 5 seconds
      if (currentTime % 5 === 0 || currentTime === totalDuration) {
        try {
          await updateVideoProgress(videoId, currentTime);
          const progressPercentage = Math.round(
            (currentTime / totalDuration) * 100
          );
          const isCompleted = progressPercentage >= 90;

          setProgress({
            watchedDuration: currentTime,
            progressPercentage,
            isCompleted,
          });

          if (isCompleted && !progress.isCompleted) {
            toast.success("Video completed! 🎉");
          }
        } catch (error) {
          console.error("Failed to update progress:", error);
        }
      }
    }
  };

  // Resume video from last watched position
  const handleVideoLoaded = () => {
    if (
      videoRef.current &&
      progress.watchedDuration > 0 &&
      !progress.isCompleted
    ) {
      videoRef.current.currentTime = progress.watchedDuration;
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#05060D] text-white">
        <FaSpinner className="h-8 w-8 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="min-h-screen bg-[#05060D] text-white">
        <div className="layout-container pt-24 pb-20">
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-6 text-center">
            <p className="text-red-400">{error || "Video not found"}</p>
            <button
              onClick={() => navigate(-1)}
              className="mt-4 rounded-lg bg-[#D4AF37] px-6 py-2 font-semibold text-black">
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!hasAccess && !video.isPreview) {
    return (
      <div className="min-h-screen bg-[#05060D] text-white">
        <SEO
          title={`${video.title} | Digital AELA`}
          description={video.description}
        />
        <div className="layout-container pt-24 pb-20">
          <button
            onClick={() => navigate(-1)}
            className="mb-6 flex items-center gap-2 text-slate-400 hover:text-white">
            <FaArrowLeft />
            Go Back
          </button>

          <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-black/80 to-black">
              <FaLock className="mb-4 h-16 w-16 text-[#D4AF37]" />
              <h2 className="mb-2 text-2xl font-bold">{video.title}</h2>
              <p className="mb-6 text-slate-400">
                You must be enrolled in this course to access this video
              </p>
              <button
                onClick={() =>
                  navigate(`/courses/${video.course._id || video.course}`)
                }
                className="rounded-lg bg-[#D4AF37] px-6 py-3 font-semibold text-black hover:bg-[#E5C158]">
                Enroll Now
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#05060D] text-white">
      <SEO
        title={`${video.title} | Digital AELA`}
        description={video.description}
      />

      <div className="layout-container pt-24 pb-20">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 text-slate-400 hover:text-white">
          <FaArrowLeft />
          Go Back
        </button>

        <div className="space-y-6">
          {/* Video Player */}
          <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
            <video
              ref={videoRef}
              src={video.videoUrl}
              controls
              className="h-full w-full"
              poster={video.thumbnailUrl}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleVideoLoaded}>
              Your browser does not support the video tag.
            </video>

            {/* Progress Indicator */}
            {progress.progressPercentage > 0 && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                <div
                  className="h-full bg-[#D4AF37] transition-all duration-300"
                  style={{ width: `${progress.progressPercentage}%` }}
                />
              </div>
            )}
          </div>

          {/* Video Info */}
          <div className="space-y-4">
            <div>
              <h1 className="text-2xl font-bold md:text-3xl">{video.title}</h1>
              {video.description && (
                <p className="mt-2 text-slate-300">{video.description}</p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
              {video.duration > 0 && (
                <span>Duration: {formatDuration(video.duration)}</span>
              )}
              {progress.progressPercentage > 0 && (
                <span className="flex items-center gap-2">
                  <span>Progress: {progress.progressPercentage}%</span>
                  {progress.isCompleted && (
                    <FaCheckCircle className="h-4 w-4 text-green-400" />
                  )}
                </span>
              )}
              {video.isPreview && (
                <span className="rounded-full bg-[#D4AF37]/20 px-3 py-1 text-[#D4AF37]">
                  Preview
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const formatDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
};

export default CourseVideoPlayer;
```

### 4. Course Videos List Component with Progress (`frontend/modules/student/CourseVideosList.jsx`)

```javascript
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import {
  getCourseVideos,
  getCourseProgress,
} from "../../../src/services/courseVideos";
import { FaPlay, FaLock, FaSpinner, FaCheckCircle } from "react-icons/fa";

const CourseVideosList = ({ courseId }) => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [courseProgress, setCourseProgress] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [videosResponse, progressResponse] = await Promise.all([
          getCourseVideos(courseId),
          getCourseProgress(courseId).catch(() => null),
        ]);

        setVideos(videosResponse.videos || []);
        setHasAccess(videosResponse.hasAccess || false);
        setCourseProgress(progressResponse);
      } catch (error) {
        toast.error("Failed to load course videos");
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      fetchData();
    }
  }, [courseId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <FaSpinner className="h-6 w-6 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-[#090D19]/95 p-6 text-center text-slate-400">
        No videos available for this course yet.
      </div>
    );
  }

  // Get progress for a specific video
  const getVideoProgress = (videoId) => {
    if (!courseProgress || !courseProgress.videos) return null;
    const videoProgress = courseProgress.videos.find(
      (v) => v.video._id === videoId
    );
    return videoProgress?.progress || null;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Course Videos</h2>
        {courseProgress && (
          <div className="text-sm text-slate-400">
            <span className="font-semibold text-[#D4AF37]">
              {courseProgress.course.courseProgressPercentage}%
            </span>{" "}
            Complete ({courseProgress.course.completedVideos}/
            {courseProgress.course.totalVideos} videos)
          </div>
        )}
      </div>

      {/* Overall Progress Bar */}
      {courseProgress && (
        <div className="rounded-lg border border-white/10 bg-[#090D19]/95 p-4">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-slate-300">Course Progress</span>
            <span className="font-semibold text-[#D4AF37]">
              {courseProgress.course.courseProgressPercentage}%
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full bg-[#D4AF37] transition-all duration-300"
              style={{
                width: `${courseProgress.course.courseProgressPercentage}%`,
              }}
            />
          </div>
        </div>
      )}

      <div className="space-y-2">
        {videos.map((video) => {
          const videoProgress = getVideoProgress(video._id);
          const isCompleted = videoProgress?.isCompleted || false;

          return (
            <Link
              key={video._id}
              to={`/courses/videos/${video._id}`}
              className="flex items-center gap-4 rounded-lg border border-white/10 bg-[#090D19]/95 p-4 transition hover:border-[#D4AF37]/50 hover:bg-[#090D19]">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-[#D4AF37]/20">
                {video.isLocked && !hasAccess ? (
                  <FaLock className="h-5 w-5 text-slate-400" />
                ) : isCompleted ? (
                  <FaCheckCircle className="h-5 w-5 text-green-400" />
                ) : (
                  <FaPlay className="h-5 w-5 text-[#D4AF37]" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{video.title}</h3>
                  {isCompleted && (
                    <FaCheckCircle className="h-4 w-4 text-green-400" />
                  )}
                </div>
                {video.description && (
                  <p className="mt-1 text-sm text-slate-400 line-clamp-1">
                    {video.description}
                  </p>
                )}
                <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
                  {video.duration > 0 && (
                    <span>{formatDuration(video.duration)}</span>
                  )}
                  {videoProgress && videoProgress.progressPercentage > 0 && (
                    <span className="text-[#D4AF37]">
                      {videoProgress.progressPercentage}% watched
                    </span>
                  )}
                  {video.isPreview && (
                    <span className="text-[#D4AF37]">Preview</span>
                  )}
                  {video.isLocked && !hasAccess && (
                    <span className="text-red-400">Locked</span>
                  )}
                </div>
                {/* Video Progress Bar */}
                {videoProgress && videoProgress.progressPercentage > 0 && (
                  <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full bg-[#D4AF37] transition-all duration-300"
                      style={{
                        width: `${videoProgress.progressPercentage}%`,
                      }}
                    />
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

const formatDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
};

export default CourseVideosList;
```

### 5. Update Course Create/Edit Page

Add the `VideoUpload` component to your course creation/edit page:

```javascript
// In CourseCreate.jsx or CourseDetail.jsx
import VideoUpload from "./VideoUpload";
import CourseVideosList from "../student/CourseVideosList";

// Add after course creation/update:
{
  videoUploadSection && (
    <section>
      <VideoUpload
        courseId={courseId}
        onVideoUploaded={handleVideoUploaded}
        existingVideosCount={videos.length}
      />
    </section>
  );
}

// Show videos list:
<CourseVideosList courseId={courseId} />;
```

---

## 🔐 Access Control Flow

### Enrollment-Based Access:

1. **Student requests video** → Check if enrolled in course
2. **If enrolled** → Grant access to all videos
3. **If not enrolled** → Only show preview videos (if `isPreview: true`)
4. **Teacher/Super Admin** → Full access to their own courses

### Access Check Logic:

```
IF user is teacher AND course.instructor === user.id:
  → Full access
ELSE IF user is super-admin:
  → Full access
ELSE IF user is enrolled (status: "active"):
  → Full access
ELSE IF video.isPreview === true:
  → Access granted (preview only)
ELSE:
  → Access denied
```

---

## 📊 Progress Tracking Flow

### Video Progress Tracking:

1. **Student watches video** → Track current time every 5 seconds
2. **Update progress** → Save watched duration and calculate percentage
3. **Mark as completed** → When 90% of video is watched
4. **Auto-resume** → Resume from last watched position on next visit
5. **Course progress** → Calculate overall course completion based on all videos

### Progress Calculation:

```
Video Progress = (watchedDuration / totalDuration) × 100
Course Progress = (completedVideos / totalVideos) × 100

Completion Criteria:
- Video: 90% watched = Completed
- Course: All videos completed = Course completed
```

### Progress Update Strategy:

- **Real-time updates**: Every 5 seconds during playback
- **On video end**: Final progress update
- **On page load**: Fetch and resume from last position
- **Debouncing**: Prevent excessive API calls

---

## 📁 File Structure

```
backend/
├── src/
│   ├── models/
│   │   ├── CourseVideo.js (NEW)
│   │   └── VideoProgress.js (NEW)
│   ├── controllers/
│   │   └── courseVideoController.js (NEW)
│   ├── middleware/
│   │   └── videoUploadMiddleware.js (NEW)
│   └── routes/
│       └── courseVideoRoutes.js (NEW)

frontend/
├── src/
│   └── services/
│       └── courseVideos.js (NEW)
└── modules/
    ├── teacher/
    │   └── VideoUpload.jsx (NEW)
    └── student/
        ├── CourseVideoPlayer.jsx (NEW)
        └── CourseVideosList.jsx (NEW)
```

---

## ✅ Implementation Steps

### Phase 1: Backend Setup

1. ✅ Create `CourseVideo` model
2. ✅ Create `VideoProgress` model
3. ✅ Create video upload middleware
4. ✅ Create video controller with all CRUD operations
5. ✅ Add progress tracking endpoints
6. ✅ Create video routes
7. ✅ Register routes in `app.js`
8. ✅ Test video upload endpoint
9. ✅ Test progress tracking endpoints

### Phase 2: Frontend Services

1. ✅ Create `courseVideos.js` service
2. ✅ Update `baseClient.js` to handle FormData (if needed)

### Phase 3: Teacher Interface

1. ✅ Create `VideoUpload` component
2. ✅ Integrate into course creation/edit pages
3. ✅ Add video management UI

### Phase 4: Student Interface

1. ✅ Create `CourseVideoPlayer` page with progress tracking
2. ✅ Create `CourseVideosList` component with progress indicators
3. ✅ Add route for video player (`/courses/videos/:videoId`)
4. ✅ Integrate videos list into course detail page
5. ✅ Add progress bars and completion indicators
6. ✅ Implement auto-resume from last watched position

### Phase 5: Testing & Polish

1. ✅ Test video upload (various file sizes)
2. ✅ Test access control (enrolled vs non-enrolled)
3. ✅ Test preview videos
4. ✅ Test progress tracking (watch time, completion)
5. ✅ Test course progress calculation
6. ✅ Test auto-resume functionality
7. ✅ Add loading states and error handling
8. ✅ Optimize video player UI for mobile

---

## 🚀 Additional Enhancements (Optional)

1. ~~**Video Progress Tracking**: Track which videos students have watched~~ ✅ **IMPLEMENTED**
2. **Video Analytics Dashboard**: Track video views, completion rates, popular videos
3. **Video Subtitles**: Support for subtitle files (SRT, VTT)
4. **Video Quality Selection**: Multiple quality options (HD, SD, etc.)
5. **Download Option**: Allow students to download videos (if permitted)
6. **Video Comments**: Allow students to comment on videos
7. **Video Bookmarks**: Allow students to bookmark specific timestamps
8. **Watch History**: Show recently watched videos
9. **Learning Path**: Suggest next video based on progress
10. **Achievement Badges**: Award badges for completing videos/courses

---

## 📝 Notes

- **Cloudinary Configuration**: Ensure your Cloudinary account supports video uploads and has sufficient storage/bandwidth
- **File Size Limits**: Adjust the 500MB limit based on your needs and Cloudinary plan
- **Video Processing**: Cloudinary automatically processes videos and generates thumbnails
- **Security**: Always verify user permissions on the backend, never trust frontend-only checks
- **Performance**: Consider implementing video streaming for large files
- **Mobile Optimization**: Ensure video player is responsive and works well on mobile devices

---

## 🔗 Integration Points

1. **Course Creation Flow**: Add video upload section
2. **Course Detail Page**: Show videos list with access control
3. **Student Dashboard**: Show enrolled courses with video access
4. **Enrollment Flow**: After enrollment, grant immediate video access

---

This implementation plan provides a complete solution for course video uploads and access control. Start with Phase 1 and work through each phase systematically.
