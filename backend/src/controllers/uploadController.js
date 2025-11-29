import { uploadToCloudinary } from "../middleware/uploadMiddleware.js";
import { deleteFileFromLocal } from "../services/fileStorageService.js";

/**
 * Upload single image
 */
export const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: {
          code: "FILE_REQUIRED",
          message: "No file uploaded",
        },
      });
    }

    // Validate file buffer
    if (!req.file.buffer || req.file.buffer.length === 0) {
      return res.status(400).json({
        error: {
          code: "INVALID_FILE",
          message: "File buffer is empty or invalid",
        },
      });
    }

    // Get folder from body (FormData sends it as string)
    const folder = req.body?.folder || "digital-aela";
    
    // Save to local storage
    const result = await uploadToCloudinary(
      req.file.buffer,
      folder,
      req.file.originalname
    );

    return res.status(200).json({
      success: true,
      data: {
        url: result.url,
        public_id: result.public_id,
        format: result.format,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
      },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Upload error:", error);
    return res.status(500).json({
      error: {
        code: "UPLOAD_FAILED",
        message: error.message || "Failed to upload image",
      },
    });
  }
};

/**
 * Upload multiple images
 */
export const uploadImages = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        error: {
          code: "FILES_REQUIRED",
          message: "No files uploaded",
        },
      });
    }

    const folder = req.body.folder || "digital-aela";
    const uploadPromises = req.files.map((file) =>
      uploadToCloudinary(file.buffer, folder, file.originalname)
    );

    const results = await Promise.all(uploadPromises);

    return res.status(200).json({
      success: true,
      data: results.map((result) => ({
        url: result.url,
        public_id: result.public_id,
        format: result.format,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
      })),
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Delete image from local storage
 */
export const deleteImage = async (req, res, next) => {
  try {
    const { public_id } = req.params;

    if (!public_id) {
      return res.status(400).json({
        error: {
          code: "FILE_PATH_REQUIRED",
          message: "File path or public ID is required",
        },
      });
    }

    // public_id can be either a file path or URL
    const result = await deleteFileFromLocal(public_id);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};

