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

