import EbookResource from "../models/EbookResource.js";
import User from "../models/User.js";
import mongoose from "mongoose";
import { uploadPdfToCloudinary } from "../middleware/uploadMiddleware.js";

/**
 * Teacher: Create Ebook (with isPublic: false - requires admin approval)
 */
export const createTeacherEbook = async (req, res, next) => {
  try {
    const { userId, userRole, userFullName } = req.auth || {};

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
      bookType,
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

    if (!pages || pages <= 0) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Number of pages is required and must be greater than 0",
        },
      });
    }

    // Determine book type (default to "ebook" for backward compatibility)
    const isPhysicalBook = bookType === "physical";

    // Handle PDF file upload if provided (only for e-books)
    let finalDownloadUrl = downloadUrl;
    if (req.file) {
      if (isPhysicalBook) {
        return res.status(422).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "PDF file upload is not allowed for physical books",
          },
        });
      }
      console.log("📄 PDF file received:", {
        filename: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        userId: userId,
      });
      // Upload PDF to Cloudinary
      try {
        const uploadResult = await uploadPdfToCloudinary(
          req.file.buffer,
          `digital-aela/ebooks/${userId}`
        );
        finalDownloadUrl = uploadResult.url;
        console.log("✅ PDF uploaded to Cloudinary successfully:", {
          url: uploadResult.url,
          public_id: uploadResult.public_id,
          size: uploadResult.bytes,
        });
      } catch (uploadError) {
        console.error("❌ Failed to upload PDF to Cloudinary:", uploadError);
        return res.status(500).json({
          error: {
            code: "UPLOAD_ERROR",
            message: "Failed to upload PDF to Cloudinary. Please try again.",
          },
        });
      }
    } else {
      console.log("⚠️ No PDF file received in request");
    }

    // Only require PDF/downloadUrl for e-books, not physical books
    if (!isPhysicalBook && !finalDownloadUrl) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "PDF file or download URL is required for e-books",
        },
      });
    }

    // For physical books, use a placeholder or empty string for downloadUrl
    // (since the model requires it, we'll use a placeholder that indicates it's a physical book)
    if (isPhysicalBook && !finalDownloadUrl) {
      finalDownloadUrl = "physical-book"; // Placeholder to satisfy model requirement
    }

    const priceValue = price ? Number(price) : 0;
    const isFree = priceValue === 0;

    // Create ebook with isPublic: false (requires admin approval)
    const ebook = await EbookResource.create({
      title,
      description,
      pages: Number(pages),
      downloadUrl: finalDownloadUrl,
      categories: category ? [category] : [],
      isPublic: false, // Always false for teacher-created ebooks - requires approval
      publishedAt: null, // Will be set when approved
      metadata: {
        subtitle: subtitle || "",
        price: priceValue,
        isFree: isFree, // Mark as free if price is 0
        coverImage: coverImage || "",
        previewUrl: previewUrl || "",
        author: userFullName || "Digital AELA", // Store teacher's name as author
        uploadedBy: userId, // Store teacher's ID for dashboard queries
        bookType: bookType || "ebook", // Store book type (ebook or physical)
        tags: tags
          ? Array.isArray(tags)
            ? tags
            : (() => {
                // Try parsing as JSON first (if stringified from FormData)
                try {
                  const parsed = JSON.parse(tags);
                  return Array.isArray(parsed) ? parsed : tags.split(",").map((t) => t.trim());
                } catch {
                  // Not JSON, treat as comma-separated string
                  return tags.split(",").map((t) => t.trim()).filter(Boolean);
                }
              })()
          : [],
      },
    });

    const populatedEbook = await EbookResource.findById(ebook._id)
      .populate("metadata.uploadedBy", "fullName email")
      .lean();

    // Create notification for super admin when ebook needs approval
    if (!ebook.isPublic) {
      try {
        const { createBulkNotifications } = await import("../utils/notificationHelper.js");
        
        // Get all super-admin users
        const superAdmins = await User.find({ role: "super-admin", isActive: true })
          .select("_id")
          .lean();
        
        if (superAdmins.length > 0) {
          const adminIds = superAdmins.map((admin) => admin._id);
          const authorName = userFullName || "A teacher";
          
          await createBulkNotifications(
            adminIds,
            "New Ebook Pending Approval",
            `A new ebook "${ebook.title}" has been created by ${authorName} and requires approval.`,
            "approval",
            {
              ebookId: ebook._id.toString(),
              ebookTitle: ebook.title,
              authorId: userId,
              authorName: authorName,
              contentType: "ebook",
            },
            `/super-admin/content-management?type=ebook&id=${ebook._id}`
          );
        }
      } catch (notifError) {
        // eslint-disable-next-line no-console
        console.error("[EbookCreation] Error creating approval notification:", notifError);
        // Don't fail ebook creation if notification fails
      }
    }

    return res.status(201).json({ ebook: populatedEbook || ebook });
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

    // Get teacher's ebooks by checking metadata.uploadedBy or metadata.author
    const teacher = await User.findById(userId).select("fullName").lean();
    const teacherName = teacher?.fullName || "";
    const teacherObjectId = mongoose.isValidObjectId(userId) ? new mongoose.Types.ObjectId(userId) : null;
    
    const ebooks = await EbookResource.find({
      $or: [
        { "metadata.uploadedBy": userId },
        { "metadata.uploadedBy": teacherObjectId?.toString() },
        ...(teacherObjectId ? [{ "metadata.uploadedBy": teacherObjectId }] : []),
        ...(teacherName ? [{ "metadata.author": teacherName }] : []),
      ],
    })
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
