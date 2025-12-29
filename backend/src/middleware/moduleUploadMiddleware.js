import multer from "multer";
import { saveFileToLocal } from "../services/fileStorageService.js";

// Memory storage for multer
const storage = multer.memoryStorage();

// File filter for module files (PDF, images, audio, Word, Excel, PowerPoint, video)
const moduleFileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    // Images
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    // Documents
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    // Audio
    "audio/mpeg",
    "audio/mp3",
    "audio/wav",
    "audio/wave",
    "audio/x-wav",
    "audio/ogg",
    "audio/mp4",
    "audio/x-m4a",
    // Video
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
        "Invalid file type. Only PDF, images, audio (MP3, WAV, OGG), documents (Word, Excel, PowerPoint), and videos (MP4, MOV, AVI, WebM) are allowed."
      ),
      false
    );
  }
};

// Configure multer for module files (1GB limit per file)
export const moduleFileUpload = multer({
  storage: storage,
  fileFilter: moduleFileFilter,
  limits: {
    fileSize: 1024 * 1024 * 1024, // 1GB limit per file
  },
});

// Helper function to save file to local storage
export const uploadModuleFileToLocal = async (
  buffer,
  folder = "digital-aela/courses/modules",
  originalName = null,
  mimetype = null
) => {
  return await saveFileToLocal(buffer, folder, originalName, mimetype);
};

// Multiple files upload middleware for modules
export const uploadModuleFiles = (fieldName = "files", maxCount = 20) => {
  return moduleFileUpload.array(fieldName, maxCount);
};

// Handle module file upload errors
export const handleModuleUploadError = (err, req, res, next) => {
  // Set CORS headers for all error responses
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, X-CSRF-Token, CSRF-Token");
  }

  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        error: {
          code: "FILE_TOO_LARGE",
          message: "File size exceeds the limit of 1GB",
        },
      });
    }
    if (err.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        error: {
          code: "TOO_MANY_FILES",
          message: "Too many files uploaded",
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

