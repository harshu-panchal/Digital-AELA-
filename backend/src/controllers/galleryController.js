import Gallery from "../models/Gallery.js";
import {
  uploadToCloudinary,
  uploadVideoToCloudinary,
} from "../middleware/uploadMiddleware.js";
import { deleteFileFromLocal } from "../services/fileStorageService.js";

const normalizeMediaType = (mediaType = "") =>
  mediaType === "video" ? "video" : "image";

const inferMediaTypeFromUrl = (url = "") => {
  const lowerUrl = url.toLowerCase();
  if (
    /\.(mp4|mov|avi|webm|mpeg|mpg)(\?|#|$)/.test(lowerUrl) ||
    lowerUrl.includes("youtube.com") ||
    lowerUrl.includes("youtu.be") ||
    lowerUrl.includes("vimeo.com")
  ) {
    return "video";
  }
  return "image";
};

const isValidHttpUrl = (url = "") => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

const parseMediaUrls = (mediaUrl = "", mediaUrls = "") => {
  const rawValues = [];

  if (Array.isArray(mediaUrls)) {
    rawValues.push(...mediaUrls);
  } else if (typeof mediaUrls === "string" && mediaUrls.trim()) {
    const trimmed = mediaUrls.trim();
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        rawValues.push(...parsed);
      } else {
        rawValues.push(trimmed);
      }
    } catch {
      rawValues.push(...trimmed.split(/[\n,]+/));
    }
  }

  if (mediaUrl) {
    rawValues.push(mediaUrl);
  }

  return rawValues
    .map((url) => String(url || "").trim())
    .filter(Boolean);
};

const normalizeMediaItems = (img) => {
  const mediaItems =
    Array.isArray(img.mediaItems) && img.mediaItems.length > 0
      ? img.mediaItems
      : [
          {
            url: img.imageUrl,
            mediaType: img.mediaType || "image",
            sourceType: img.sourceType || "upload",
            publicId: img.publicId || "",
          },
        ];

  return mediaItems
    .filter((item) => item?.url)
    .map((item) => ({
      url: item.url,
      mediaUrl: item.url,
      image: item.url,
      mediaType: item.mediaType || "image",
      sourceType: item.sourceType || "upload",
      publicId: item.publicId || "",
    }));
};

/**
 * Get all active gallery images (public endpoint)
 */
export const getAllGalleryImages = async (req, res, next) => {
  try {
    const images = await Gallery.find({ isActive: true })
      .sort({ order: 1, createdAt: -1 })
      .select(
        "imageUrl title description mediaType sourceType publicId mediaItems createdAt"
      )
      .lean();

    return res.status(200).json({
      success: true,
      data: images.map((img) => {
        const mediaItems = normalizeMediaItems(img);
        const firstMedia = mediaItems[0] || {};

        return {
          id: img._id.toString(),
          image: firstMedia.url || img.imageUrl,
          mediaUrl: firstMedia.url || img.imageUrl,
          title: img.title || "",
          description: img.description || "",
          mediaType: firstMedia.mediaType || img.mediaType || "image",
          sourceType: firstMedia.sourceType || img.sourceType || "upload",
          mediaItems,
          createdAt: img.createdAt,
        };
      }),
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
      data: images.map((img) => {
        const mediaItems = normalizeMediaItems(img);
        const firstMedia = mediaItems[0] || {};

        return {
          id: img._id.toString(),
          imageUrl: firstMedia.url || img.imageUrl,
          title: img.title || "",
          description: img.description || "",
          mediaType: firstMedia.mediaType || img.mediaType || "image",
          sourceType: firstMedia.sourceType || img.sourceType || "upload",
          publicId: firstMedia.publicId || img.publicId,
          mediaItems,
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
        };
      }),
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
 * Upload gallery media (super-admin only)
 */
export const uploadGalleryImage = async (req, res, next) => {
  try {
    const { userRole, userId } = req.auth || {};

    if (!req.auth || userRole !== "super-admin") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only super admins can upload gallery media",
        },
      });
    }

    const {
      title = "",
      description = "",
      mediaType = "",
      mediaUrl = "",
      mediaUrls = "",
      sourceType = "",
    } = req.body || {};
    const linkUrls = parseMediaUrls(mediaUrl, mediaUrls);
    const files = Array.isArray(req.files)
      ? req.files
      : req.file
        ? [req.file]
        : [];
    const isLinkUpload = sourceType === "link" || linkUrls.length > 0;

    if (files.length === 0 && linkUrls.length === 0) {
      return res.status(400).json({
        error: {
          code: "MEDIA_REQUIRED",
          message: "Upload files or provide image/video links",
        },
      });
    }

    const mediaItems = [];

    for (const file of files) {
      const itemMediaType = file.mimetype.startsWith("video/")
        ? "video"
        : "image";
      const result =
        itemMediaType === "video"
          ? await uploadVideoToCloudinary(
              file.buffer,
              "digital-aela/gallery-videos",
              file.originalname
            )
          : await uploadToCloudinary(
              file.buffer,
              "digital-aela/gallery",
              file.originalname
            );

      mediaItems.push({
        url: result.url,
        mediaType: itemMediaType,
        sourceType: "upload",
        publicId: result?.public_id || "",
      });
    }

    for (const linkUrl of linkUrls) {
      if (!isValidHttpUrl(linkUrl)) {
        return res.status(400).json({
          error: {
            code: "INVALID_MEDIA_URL",
            message: "Please provide valid image/video URLs",
          },
        });
      }
      mediaItems.push({
        url: linkUrl,
        mediaType: mediaType && linkUrls.length === 1
          ? normalizeMediaType(mediaType)
          : inferMediaTypeFromUrl(linkUrl),
        sourceType: isLinkUpload ? "link" : "upload",
        publicId: "",
      });
    }

    const firstMedia = mediaItems[0];

    // Get the highest order value to add new image at the end
    const lastImage = await Gallery.findOne()
      .sort({ order: -1 })
      .select("order")
      .lean();
    const nextOrder = lastImage ? lastImage.order + 1 : 0;

    // Save to database
    const galleryImage = new Gallery({
      imageUrl: firstMedia.url,
      title: String(title || "").trim(),
      description: String(description || "").trim(),
      mediaType: firstMedia.mediaType,
      sourceType: firstMedia.sourceType,
      publicId: firstMedia.publicId,
      mediaItems,
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
        title: galleryImage.title,
        description: galleryImage.description,
        mediaType: galleryImage.mediaType,
        sourceType: galleryImage.sourceType,
        publicId: galleryImage.publicId,
        mediaItems: galleryImage.mediaItems,
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
 * Delete gallery media (super-admin only)
 */
export const deleteGalleryImage = async (req, res, next) => {
  try {
    const { userRole } = req.auth || {};

    if (!req.auth || userRole !== "super-admin") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only super admins can delete gallery media",
        },
      });
    }

    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        error: {
          code: "ID_REQUIRED",
          message: "Gallery item ID is required",
        },
      });
    }

    // Find the image
    const galleryImage = await Gallery.findById(id);

    if (!galleryImage) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Gallery item not found",
        },
      });
    }

    const mediaItems = normalizeMediaItems(galleryImage);
    for (const mediaItem of mediaItems) {
      if (mediaItem.sourceType === "link") {
        continue;
      }
      try {
        const filePath = mediaItem.url || mediaItem.publicId;
        if (filePath) {
          await deleteFileFromLocal(filePath);
        }
      } catch (deleteError) {
        console.error(
          "[Gallery] Failed to delete file from local storage:",
          deleteError.message
        );
      }
    }

    // Delete from database
    await Gallery.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Gallery item deleted successfully",
    });
  } catch (error) {
    return next(error);
  }
};

