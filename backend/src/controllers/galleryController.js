import Gallery from "../models/Gallery.js";
import { uploadToCloudinary } from "../middleware/uploadMiddleware.js";
import { deleteFileFromLocal } from "../services/fileStorageService.js";

/**
 * Get all active gallery images (public endpoint)
 */
export const getAllGalleryImages = async (req, res, next) => {
  try {
    const images = await Gallery.find({ isActive: true })
      .sort({ order: 1, createdAt: -1 })
      .select("imageUrl createdAt")
      .lean();

    return res.status(200).json({
      success: true,
      data: images.map((img) => ({
        id: img._id.toString(),
        image: img.imageUrl,
        createdAt: img.createdAt,
      })),
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get all gallery images with pagination (admin)
 */
export const getGalleryImages = async (req, res, next) => {
  try {
    const { userRole } = req.auth || {};

    if (!req.auth || userRole !== "super-admin") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only super admins can access this endpoint",
        },
      });
    }

    const { page = 1, pageSize = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);

    const [images, total] = await Promise.all([
      Gallery.find()
        .populate("uploadedBy", "fullName email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(pageSize))
        .lean(),
      Gallery.countDocuments(),
    ]);

    return res.status(200).json({
      success: true,
      data: images.map((img) => ({
        id: img._id.toString(),
        imageUrl: img.imageUrl,
        publicId: img.publicId,
        uploadedBy: img.uploadedBy
          ? {
              id: img.uploadedBy._id.toString(),
              name: img.uploadedBy.fullName,
              email: img.uploadedBy.email,
            }
          : null,
        order: img.order,
        isActive: img.isActive,
        createdAt: img.createdAt,
        updatedAt: img.updatedAt,
      })),
      pagination: {
        page: Number(page),
        pageSize: Number(pageSize),
        total,
        totalPages: Math.ceil(total / Number(pageSize)),
      },
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Upload gallery image (super-admin only)
 */
export const uploadGalleryImage = async (req, res, next) => {
  try {
    const { userRole, userId } = req.auth || {};

    if (!req.auth || userRole !== "super-admin") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only super admins can upload gallery images",
        },
      });
    }

    if (!req.file) {
      return res.status(400).json({
        error: {
          code: "FILE_REQUIRED",
          message: "No file uploaded",
        },
      });
    }

    // Save to local storage
    const result = await uploadToCloudinary(
      req.file.buffer,
      "digital-aela/gallery",
      req.file.originalname
    );

    // Get the highest order value to add new image at the end
    const lastImage = await Gallery.findOne()
      .sort({ order: -1 })
      .select("order")
      .lean();
    const nextOrder = lastImage ? lastImage.order + 1 : 0;

    // Save to database
    const galleryImage = new Gallery({
      imageUrl: result.url,
      publicId: result.public_id,
      uploadedBy: userId,
      order: nextOrder,
      isActive: true,
    });

    await galleryImage.save();

    // Populate uploadedBy for response
    await galleryImage.populate("uploadedBy", "fullName email");

    return res.status(201).json({
      success: true,
      data: {
        id: galleryImage._id.toString(),
        imageUrl: galleryImage.imageUrl,
        publicId: galleryImage.publicId,
        uploadedBy: {
          id: galleryImage.uploadedBy._id.toString(),
          name: galleryImage.uploadedBy.fullName,
          email: galleryImage.uploadedBy.email,
        },
        order: galleryImage.order,
        isActive: galleryImage.isActive,
        createdAt: galleryImage.createdAt,
      },
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Delete gallery image (super-admin only)
 */
export const deleteGalleryImage = async (req, res, next) => {
  try {
    const { userRole } = req.auth || {};

    if (!req.auth || userRole !== "super-admin") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only super admins can delete gallery images",
        },
      });
    }

    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        error: {
          code: "ID_REQUIRED",
          message: "Image ID is required",
        },
      });
    }

    // Find the image
    const galleryImage = await Gallery.findById(id);

    if (!galleryImage) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Gallery image not found",
        },
      });
    }

    // Delete from local storage
    try {
      // Use imageUrl or publicId to delete file
      const filePath = galleryImage.imageUrl || galleryImage.publicId;
      if (filePath) {
        await deleteFileFromLocal(filePath);
      }
    } catch (deleteError) {
      // Log but continue with database deletion even if file deletion fails
      console.error(
        "[Gallery] Failed to delete file from local storage:",
        deleteError.message
      );
    }

    // Delete from database
    await Gallery.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Gallery image deleted successfully",
    });
  } catch (error) {
    return next(error);
  }
};

