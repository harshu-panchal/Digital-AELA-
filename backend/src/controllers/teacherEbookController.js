import EbookResource from "../models/EbookResource.js";
import mongoose from "mongoose";

/**
 * Teacher: Create Ebook (with isPublic: false - requires admin approval)
 */
export const createTeacherEbook = async (req, res, next) => {
  try {
    const { userId, userRole } = req.auth || {};

    if (!userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    if (userRole !== "teacher") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only teachers can create ebooks",
        },
      });
    }

    const {
      title,
      subtitle,
      description,
      price,
      category,
      coverImage,
      previewUrl,
      tags,
      downloadUrl,
      pages,
    } = req.body;

    if (!title) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Title is required",
        },
      });
    }

    if (!description || description.length < 40) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Description is required (minimum 40 characters)",
        },
      });
    }

    if (!downloadUrl) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Download URL is required",
        },
      });
    }

    // Create ebook with isPublic: false (requires admin approval)
    const ebook = await EbookResource.create({
      title,
      description,
      pages: pages ? Number(pages) : undefined,
      downloadUrl,
      categories: category ? [category] : [],
      isPublic: false, // Always false for teacher-created ebooks - requires approval
      publishedAt: null, // Will be set when approved
      metadata: {
        subtitle: subtitle || "",
        price: price ? Number(price) : 0,
        coverImage: coverImage || "",
        previewUrl: previewUrl || "",
        tags: tags
          ? Array.isArray(tags)
            ? tags
            : tags.split(",").map((t) => t.trim())
          : [],
      },
    });

    return res.status(201).json({ ebook });
  } catch (error) {
    return next(error);
  }
};

/**
 * Teacher: Get My Ebooks
 */
export const getTeacherEbooks = async (req, res, next) => {
  try {
    const { userId, userRole } = req.auth || {};

    if (!userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    if (userRole !== "teacher") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only teachers can access this endpoint",
        },
      });
    }

    // Note: We don't filter by instructor since EbookResource doesn't have that field
    // All ebooks with isPublic: false are considered pending teacher uploads
    const ebooks = await EbookResource.find({ isPublic: false })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({ ebooks });
  } catch (error) {
    return next(error);
  }
};

/**
 * Teacher: Get Ebook by ID
 */
export const getTeacherEbookById = async (req, res, next) => {
  try {
    const { userId, userRole } = req.auth || {};

    if (!userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    if (userRole !== "teacher") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only teachers can access this endpoint",
        },
      });
    }

    const { ebookId } = req.params;

    if (!mongoose.isValidObjectId(ebookId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid ebook ID",
        },
      });
    }

    const ebook = await EbookResource.findById(ebookId).lean();

    if (!ebook) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Ebook not found",
        },
      });
    }

    return res.status(200).json({ ebook });
  } catch (error) {
    return next(error);
  }
};

/**
 * Teacher: Update Ebook (only if not yet approved)
 */
export const updateTeacherEbook = async (req, res, next) => {
  try {
    const { userId, userRole } = req.auth || {};

    if (!userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    if (userRole !== "teacher") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only teachers can update ebooks",
        },
      });
    }

    const { ebookId } = req.params;

    if (!mongoose.isValidObjectId(ebookId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid ebook ID",
        },
      });
    }

    const ebook = await EbookResource.findById(ebookId);

    if (!ebook) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Ebook not found",
        },
      });
    }

    // Only allow updating if ebook is not yet public (not approved)
    if (ebook.isPublic) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only pending ebooks can be updated",
        },
      });
    }

    const {
      title,
      subtitle,
      description,
      price,
      category,
      coverImage,
      previewUrl,
      tags,
      downloadUrl,
      pages,
    } = req.body;

    if (title) ebook.title = title;
    if (description) ebook.description = description;
    if (pages !== undefined) ebook.pages = pages ? Number(pages) : undefined;
    if (downloadUrl) ebook.downloadUrl = downloadUrl;
    if (category) ebook.categories = [category];

    // Update metadata
    if (!ebook.metadata) ebook.metadata = {};
    if (subtitle !== undefined) ebook.metadata.subtitle = subtitle;
    if (price !== undefined) ebook.metadata.price = price ? Number(price) : 0;
    if (coverImage !== undefined) ebook.metadata.coverImage = coverImage;
    if (previewUrl !== undefined) ebook.metadata.previewUrl = previewUrl;
    if (tags !== undefined) {
      ebook.metadata.tags = Array.isArray(tags)
        ? tags
        : tags.split(",").map((t) => t.trim());
    }

    await ebook.save();

    return res.status(200).json({ ebook });
  } catch (error) {
    return next(error);
  }
};
