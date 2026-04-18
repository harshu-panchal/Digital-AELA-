import multer from "multer";
import { saveImageToLocal, savePdfToLocal } from "../services/fileStorageService.js";

// Memory storage for multer (we'll save to local storage manually)
const storage = multer.memoryStorage();

// File filter for images
const fileFilter = (req, file, cb) => {
  // Accept only image files
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(
      new Error("Invalid file type. Only image files are allowed."),
      false
    );
  }
};

// File filter for PDFs
const pdfFileFilter = (req, file, cb) => {
  // Accept only PDF files
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(
      new Error("Invalid file type. Only PDF files are allowed."),
      false
    );
  }
};

// File filter for Videos
const videoFileFilter = (req, file, cb) => {
  // Accept common video formats
  if (file.mimetype.startsWith("video/")) {
    cb(null, true);
  } else {
    cb(
      new Error("Invalid file type. Only video files are allowed."),
      false
    );
  }
};

// File filter for gallery media
const mediaFileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/")) {
    cb(null, true);
  } else {
    cb(
      new Error("Invalid file type. Only image and video files are allowed."),
      false
    );
  }
};

// Configure multer with memory storage
export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 1024 * 1024 * 1024, // 1GB limit
  },
});

// Helper function to save image to local storage
export const uploadToCloudinary = async (buffer, folder = "digital-aela", originalName = null) => {
  return await saveImageToLocal(buffer, folder, originalName);
};

// Configure multer for PDF uploads
export const pdfUpload = multer({
  storage: storage,
  fileFilter: pdfFileFilter,
  limits: {
    fileSize: 1024 * 1024 * 1024, // 1GB limit for PDFs
  },
});

// Helper function to save PDF to local storage
export const uploadPdfToCloudinary = async (buffer, folder = "digital-aela/course-brochures", originalName = null) => {
  return await savePdfToLocal(buffer, folder, originalName);
};

// Configure multer for Video uploads
export const videoUpload = multer({
  storage: storage,
  fileFilter: videoFileFilter,
  limits: {
    fileSize: 1024 * 1024 * 1024, // 1GB limit for Videos
  },
});

export const mediaUpload = multer({
  storage: storage,
  fileFilter: mediaFileFilter,
  limits: {
    fileSize: 1024 * 1024 * 1024,
  },
});

// Helper function to save Video to local storage
const { saveVideoToLocal } = await import("../services/fileStorageService.js");
export const uploadVideoToCloudinary = async (buffer, folder = "digital-aela/course-videos", originalName = null) => {
  return await saveVideoToLocal(buffer, folder, originalName);
};

// Single PDF upload middleware
export const uploadSinglePdf = (fieldName = "brochure") => {
  return pdfUpload.single(fieldName);
};

// Single file upload middleware
export const uploadSingle = (fieldName = "image") => {
  return upload.single(fieldName);
};

// Single video upload middleware
export const uploadSingleVideo = (fieldName = "video") => {
  return videoUpload.single(fieldName);
};

export const uploadSingleMedia = (fieldName = "media") => {
  return mediaUpload.single(fieldName);
};

export const uploadMultipleMedia = (fieldName = "media", maxCount = 20) => {
  return mediaUpload.array(fieldName, maxCount);
};

// Multiple files upload middleware
export const uploadMultiple = (fieldName = "images", maxCount = 5) => {
  return upload.array(fieldName, maxCount);
};

// Handle upload errors
export const handleUploadError = (err, req, res, next) => {
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

  if (err.message === "Invalid file type. Only image files are allowed.") {
    return res.status(400).json({
      error: {
        code: "INVALID_FILE_TYPE",
        message: err.message,
      },
    });
  }

  if (err.message === "Invalid file type. Only PDF files are allowed.") {
    return res.status(400).json({
      error: {
        code: "INVALID_FILE_TYPE",
        message: err.message,
      },
    });
  }

  if (err.message === "Invalid file type. Only image and video files are allowed.") {
    return res.status(400).json({
      error: {
        code: "INVALID_FILE_TYPE",
        message: err.message,
      },
    });
  }

  if (err.message === "Invalid file type. Only video files are allowed.") {
    return res.status(400).json({
      error: {
        code: "INVALID_FILE_TYPE",
        message: err.message,
      },
    });
  }

  return next(err);
};
