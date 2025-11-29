import mongoose from "mongoose";
import Testimonial from "../models/Testimonial.js";
import { uploadToCloudinary } from "../middleware/uploadMiddleware.js";

/**
 * Public: Get all published testimonials
 */
export const getAllTestimonials = async (req, res, next) => {
  try {
    const { section } = req.query;

    const query = { status: "published" };
    
    // Filter by section if provided
    if (section) {
      query.$or = [
        { section: section },
        { section: "both" }
      ];
    }

    const testimonials = await Testimonial.find(query)
      .select("-metadata")
      .sort({ displayOrder: 1, createdAt: -1 })
      .lean();

    return res.json({ testimonials });
  } catch (error) {
    return next(error);
  }
};

/**
 * Public: Get testimonials by section
 */
export const getTestimonialsBySection = async (req, res, next) => {
  try {
    const { section } = req.params;

    if (!["home", "success-stories"].includes(section)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid section. Must be 'home' or 'success-stories'",
        },
      });
    }

    const query = {
      status: "published",
      $or: [
        { section: section },
        { section: "both" }
      ]
    };

    const testimonials = await Testimonial.find(query)
      .select("-metadata")
      .sort({ displayOrder: 1, createdAt: -1 })
      .lean();

    return res.json({ testimonials });
  } catch (error) {
    return next(error);
  }
};

/**
 * Admin: Get all testimonials (with pagination)
 */
export const getAdminTestimonials = async (req, res, next) => {
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

    const { page = 1, pageSize = 20, status, section, search } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);

    const query = {};
    
    if (status) {
      query.status = status;
    }
    
    if (section) {
      query.section = section;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { role: { $regex: search, $options: "i" } },
        { text: { $regex: search, $options: "i" } },
      ];
    }

    const [testimonials, total] = await Promise.all([
      Testimonial.find(query)
        .populate("createdBy", "fullName email")
        .sort({ displayOrder: 1, createdAt: -1 })
        .skip(skip)
        .limit(Number(pageSize))
        .lean(),
      Testimonial.countDocuments(query),
    ]);

    return res.json({
      testimonials,
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
 * Admin: Create testimonial
 */
export const createTestimonial = async (req, res, next) => {
  try {
    const { userRole, userId } = req.auth || {};

    if (!req.auth || userRole !== "super-admin") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only super admins can access this endpoint",
        },
      });
    }

    const { name, role, text, rating, section, status, displayOrder } = req.body;

    // Validation
    if (!name || !role || !text) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Name, role, and text are required",
        },
      });
    }

    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Rating must be between 1 and 5",
        },
      });
    }

    let avatarUrl = null;

    // Handle avatar upload if provided
    if (req.file) {
      try {
        const uploadResult = await uploadToCloudinary(
          req.file.buffer,
          "digital-aela/testimonials",
          req.file.originalname
        );
        avatarUrl = uploadResult.url;
      } catch (uploadError) {
        return res.status(500).json({
          error: {
            code: "UPLOAD_ERROR",
            message: "Failed to upload avatar image",
          },
        });
      }
    }

    const testimonial = new Testimonial({
      name: name.trim(),
      role: role.trim(),
      text: text.trim(),
      avatar: avatarUrl,
      rating: rating ? Number(rating) : 5,
      section: section || "home",
      status: status || "published",
      displayOrder: displayOrder ? Number(displayOrder) : 0,
      createdBy: userId,
    });

    await testimonial.save();

    const populatedTestimonial = await Testimonial.findById(testimonial._id)
      .populate("createdBy", "fullName email")
      .lean();

    return res.status(201).json({
      testimonial: populatedTestimonial,
      message: "Testimonial created successfully",
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Admin: Update testimonial
 */
export const updateTestimonial = async (req, res, next) => {
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

    const { id } = req.params;
    const { name, role, text, rating, section, status, displayOrder, avatar } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid testimonial ID",
        },
      });
    }

    const testimonial = await Testimonial.findById(id);

    if (!testimonial) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Testimonial not found",
        },
      });
    }

    // Update fields
    if (name) testimonial.name = name.trim();
    if (role) testimonial.role = role.trim();
    if (text) testimonial.text = text.trim();
    if (rating !== undefined) {
      if (rating < 1 || rating > 5) {
        return res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Rating must be between 1 and 5",
          },
        });
      }
      testimonial.rating = Number(rating);
    }
    if (section) testimonial.section = section;
    if (status) testimonial.status = status;
    if (displayOrder !== undefined) testimonial.displayOrder = Number(displayOrder);

    // Handle avatar upload if new file provided
    if (req.file) {
      try {
        const uploadResult = await uploadToCloudinary(
          req.file.buffer,
          "digital-aela/testimonials",
          req.file.originalname
        );
        testimonial.avatar = uploadResult.url;
      } catch (uploadError) {
        return res.status(500).json({
          error: {
            code: "UPLOAD_ERROR",
            message: "Failed to upload avatar image",
          },
        });
      }
    } else if (avatar !== undefined) {
      // Allow setting avatar URL directly (for cases where no new file is uploaded)
      testimonial.avatar = avatar || null;
    }

    await testimonial.save();

    const updatedTestimonial = await Testimonial.findById(testimonial._id)
      .populate("createdBy", "fullName email")
      .lean();

    return res.json({
      testimonial: updatedTestimonial,
      message: "Testimonial updated successfully",
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Admin: Delete testimonial
 */
export const deleteTestimonial = async (req, res, next) => {
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

    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid testimonial ID",
        },
      });
    }

    const testimonial = await Testimonial.findByIdAndDelete(id);

    if (!testimonial) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Testimonial not found",
        },
      });
    }

    return res.json({
      message: "Testimonial deleted successfully",
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Admin: Toggle testimonial status
 */
export const toggleTestimonialStatus = async (req, res, next) => {
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

    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid testimonial ID",
        },
      });
    }

    if (!["draft", "published"].includes(status)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Status must be 'draft' or 'published'",
        },
      });
    }

    const testimonial = await Testimonial.findById(id);

    if (!testimonial) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Testimonial not found",
        },
      });
    }

    testimonial.status = status;
    await testimonial.save();

    const updatedTestimonial = await Testimonial.findById(testimonial._id)
      .populate("createdBy", "fullName email")
      .lean();

    return res.json({
      testimonial: updatedTestimonial,
      message: `Testimonial ${status === "published" ? "published" : "drafted"} successfully`,
    });
  } catch (error) {
    return next(error);
  }
};

