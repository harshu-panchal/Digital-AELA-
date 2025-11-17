import multer from "multer";
import cloudinary from "../config/cloudinary.js";
import { Readable } from "stream";

// Memory storage for multer (we'll upload to Cloudinary manually)
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

// Configure multer with memory storage
export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Helper function to upload file to Cloudinary
export const uploadToCloudinary = (buffer, folder = "digital-aela") => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        allowed_formats: ["jpg", "jpeg", "png", "gif", "webp", "svg"],
        resource_type: "auto",
        public_id: `${Date.now()}-${Math.round(Math.random() * 1e9)}`,
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve({
          public_id: result.public_id,
          url: result.secure_url,
          format: result.format,
          width: result.width,
          height: result.height,
          bytes: result.bytes,
        });
      }
    );

    // Convert buffer to stream and upload
    const readableStream = Readable.from(buffer);
    readableStream.pipe(uploadStream);
  });
};

// Configure multer for PDF uploads
export const pdfUpload = multer({
  storage: storage,
  fileFilter: pdfFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for PDFs
  },
});

// Helper function to upload PDF to Cloudinary
export const uploadPdfToCloudinary = (buffer, folder = "digital-aela/course-brochures") => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: "raw",
        allowed_formats: ["pdf"],
        public_id: `brochure-${Date.now()}-${Math.round(Math.random() * 1e9)}`,
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve({
          public_id: result.public_id,
          url: result.secure_url,
          format: result.format,
          bytes: result.bytes,
        });
      }
    );

    // Convert buffer to stream and upload
    const readableStream = Readable.from(buffer);
    readableStream.pipe(uploadStream);
  });
};

// Single PDF upload middleware
export const uploadSinglePdf = (fieldName = "brochure") => {
  return pdfUpload.single(fieldName);
};

// Single file upload middleware
export const uploadSingle = (fieldName = "image") => {
  return upload.single(fieldName);
};

// Multiple files upload middleware
export const uploadMultiple = (fieldName = "images", maxCount = 5) => {
  return upload.array(fieldName, maxCount);
};

// Handle upload errors
export const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      const isPdf = req.file?.mimetype === "application/pdf";
      return res.status(400).json({
        error: {
          code: "FILE_TOO_LARGE",
          message: isPdf 
            ? "File size exceeds the limit of 10MB" 
            : "File size exceeds the limit of 5MB",
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

  return next(err);
};
