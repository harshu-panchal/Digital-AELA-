import mongoose from "mongoose";
import RecruiterBlog from "../models/RecruiterBlog.js";
import Notification from "../models/Notification.js";

/**
 * Get pending blogs
 */
export const getPendingBlogs = async (req, res, next) => {
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

    const { page = 1, pageSize = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    const limit = parseInt(pageSize);

    const [blogs, total] = await Promise.all([
      RecruiterBlog.find({ status: "pending" })
        .populate("author", "fullName email role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      RecruiterBlog.countDocuments({ status: "pending" }),
    ]);

    return res.json({
      blogs,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total,
        totalPages: Math.ceil(total / parseInt(pageSize)),
      },
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get blog preview (full content for super admin)
 */
export const getBlogPreview = async (req, res, next) => {
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

    const { blogId } = req.params;

    if (!mongoose.isValidObjectId(blogId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid blog ID",
        },
      });
    }

    const blog = await RecruiterBlog.findById(blogId)
      .populate("author", "fullName email role")
      .lean();

    if (!blog) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Blog not found",
        },
      });
    }

    return res.json({
      blog,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Approve/Reject Blog
 */
export const approveBlog = async (req, res, next) => {
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

    const { blogId } = req.params;
    const { action, rejectionReason } = req.body; // "approve" or "reject"

    if (!mongoose.isValidObjectId(blogId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid blog ID",
        },
      });
    }

    if (!["approve", "reject"].includes(action)) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Action must be 'approve' or 'reject'",
        },
      });
    }

    const blog = await RecruiterBlog.findById(blogId).populate("author", "fullName email");
    if (!blog) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Blog not found",
        },
      });
    }

    if (action === "approve") {
      blog.status = "published";
      blog.publishedAt = new Date();
      // Clear rejection fields if any
      blog.rejectedAt = null;
      blog.rejectionReason = null;
    } else {
      // Reject blog
      blog.status = "rejected";
      blog.rejectedAt = new Date();
      if (rejectionReason) {
        blog.rejectionReason = rejectionReason.trim();
      }
    }

    await blog.save();

    // Create notification for the blog author
    if (blog.author && blog.author._id) {
      const notificationTitle = action === "approve" 
        ? "Blog Approved" 
        : "Blog Rejected";
      
      const notificationDescription = action === "approve"
        ? `Your blog "${blog.title}" has been approved and is now live.`
        : `Your blog "${blog.title}" has been rejected.${blog.rejectionReason ? ` Reason: ${blog.rejectionReason}` : ""}`;

      await Notification.create({
        user: blog.author._id,
        title: notificationTitle,
        description: notificationDescription,
        type: "system",
        actionUrl: `/blogs/${blog._id}`,
        metadata: {
          blogId: blog._id.toString(),
          action: action,
          rejectionReason: blog.rejectionReason || null,
        },
      });
    }

    return res.json({
      blog,
      message: `Blog ${action === "approve" ? "approved" : "rejected"} successfully`,
    });
  } catch (error) {
    return next(error);
  }
};

