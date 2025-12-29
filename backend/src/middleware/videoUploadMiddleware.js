import multer from "multer";
import { saveVideoToLocal } from "../services/fileStorageService.js";

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
    fileSize: 1024 * 1024 * 1024, // 1GB limit for videos
  },
});

// Helper function to save video to local storage
export const uploadVideoToCloudinary = async (
  buffer,
  folder = "digital-aela/course-videos",
  originalName = null
) => {
  return await saveVideoToLocal(buffer, folder, originalName);
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
          message: "Video file size exceeds the limit of 1GB",
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

