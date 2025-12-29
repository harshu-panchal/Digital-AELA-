import multer from "multer";

// Memory storage for multer
const storage = multer.memoryStorage();

// File filter that accepts images, documents, and videos
const joinUsFileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    // Images
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
    // Documents
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    // Videos
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
        "Invalid file type. Only images (PNG, JPG, WebP), documents (PDF, DOC, DOCX), and videos (MP4, MOV, AVI, WebM) are allowed."
      ),
      false
    );
  }
};

// Configure multer for join-us applications (larger file size limit for videos)
export const joinUsUpload = multer({
  storage: storage,
  fileFilter: joinUsFileFilter,
  limits: {
    fileSize: 1024 * 1024 * 1024, // 1GB limit
  },
});

// Middleware for handling multiple files with different field names
export const uploadJoinUsFiles = joinUsUpload.fields([
  { name: "resume", maxCount: 1 },
  { name: "videoIntro", maxCount: 1 },
  { name: "profileImage", maxCount: 1 },
]);

// Handle upload errors
export const handleJoinUsUploadError = (err, req, res, next) => {
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
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        error: {
          code: "UNEXPECTED_FILE_FIELD",
          message: "Unexpected file field. Allowed fields: resume, videoIntro, profileImage",
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

