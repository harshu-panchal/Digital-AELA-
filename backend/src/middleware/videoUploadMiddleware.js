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

