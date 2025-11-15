import { uploadToCloudinary } from "../middleware/uploadMiddleware.js";
import cloudinary from "../config/cloudinary.js";

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

    // Upload to Cloudinary
    const result = await uploadToCloudinary(req.file.buffer, req.body.folder || "digital-aela");

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
    return next(error);
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
      uploadToCloudinary(file.buffer, folder)
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
 * Delete image from Cloudinary
 */
export const deleteImage = async (req, res, next) => {
  try {
    const { public_id } = req.params;

    if (!public_id) {
      return res.status(400).json({
        error: {
          code: "PUBLIC_ID_REQUIRED",
          message: "Public ID is required",
        },
      });
    }

    const result = await cloudinary.uploader.destroy(public_id, {
      resource_type: "image",
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};

