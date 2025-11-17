import mongoose from "mongoose";
import RecruiterBlog from "../models/RecruiterBlog.js";
import BlogReaction from "../models/BlogReaction.js";
import User from "../models/User.js";

/**
 * Advanced blog search
 * GET /api/v1/blogs/search
 */
export const searchBlogs = async (req, res, next) => {
  try {
    const { q, category, tags, author, page = 1, pageSize = 20, sortBy = "recent" } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);

    const query = { status: "published" };

    // Text search
    if (q) {
      query.$or = [
        { title: { $regex: q, $options: "i" } },
        { content: { $regex: q, $options: "i" } },
        { excerpt: { $regex: q, $options: "i" } },
        { tags: { $in: [new RegExp(q, "i")] } },
      ];
    }

    // Category filter
    if (category) {
      query.category = category;
    }

    // Tags filter
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : tags.split(",");
      query.tags = { $in: tagArray };
    }

    // Author filter
    if (author && mongoose.isValidObjectId(author)) {
      query.author = new mongoose.Types.ObjectId(author);
    }

    // Sort options
    let sort = {};
    switch (sortBy) {
      case "recent":
        sort = { publishedAt: -1, createdAt: -1 };
        break;
      case "popular":
        sort = { likes: -1, publishedAt: -1 };
        break;
      case "trending":
        // Sort by likes and recent activity
        sort = { likes: -1, "comments.0.createdAt": -1, publishedAt: -1 };
        break;
      default:
        sort = { publishedAt: -1 };
    }

    const [blogs, total] = await Promise.all([
      RecruiterBlog.find(query)
        .populate("author", "fullName email role metadata")
        .sort(sort)
        .skip(skip)
        .limit(Number(pageSize))
        .lean(),
      RecruiterBlog.countDocuments(query),
    ]);

    // Format response
    const formattedBlogs = blogs.map((blog) => {
      const authorId = blog.author?._id ? blog.author._id.toString() : blog.author?.id;
      const userAvatarUrl = blog.author?.metadata?.avatarUrl || null;

      return {
        _id: blog._id.toString(),
        id: blog._id.toString(),
        title: blog.title,
        excerpt: blog.excerpt || "",
        content: blog.content,
        coverImage: blog.coverImage || null,
        tags: blog.tags || [],
        category: blog.category || "",
        status: blog.status,
        likes: blog.likes || 0,
        commentsCount: blog.comments?.length || 0,
        publishedAt: blog.publishedAt || null,
        updatedAt: blog.updatedAt,
        createdAt: blog.createdAt,
        author: blog.author
          ? {
              id: authorId,
              _id: authorId,
              fullName: blog.author.fullName,
              role: blog.author.role,
              email: blog.author.email,
              avatarUrl: userAvatarUrl,
            }
          : null,
      };
    });

    return res.json({
      blogs: formattedBlogs,
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
 * Get blog categories and tags
 * GET /api/v1/blogs/categories
 */
export const getBlogCategories = async (req, res, next) => {
  try {
    const [categories, tags] = await Promise.all([
      RecruiterBlog.distinct("category", { status: "published" }),
      RecruiterBlog.distinct("tags", { status: "published" }),
    ]);

    // Count blogs per category
    const categoryCounts = await RecruiterBlog.aggregate([
      { $match: { status: "published", category: { $exists: true, $ne: null } } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Count blogs per tag
    const tagCounts = await RecruiterBlog.aggregate([
      { $match: { status: "published", tags: { $exists: true, $ne: [] } } },
      { $unwind: "$tags" },
      { $group: { _id: "$tags", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 50 }, // Top 50 tags
    ]);

    return res.json({
      categories: categoryCounts.map((c) => ({
        name: c._id,
        count: c.count,
      })),
      tags: tagCounts.map((t) => ({
        name: t._id,
        count: t.count,
      })),
      allCategories: categories.filter(Boolean),
      allTags: tags.filter(Boolean),
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Add reaction to blog
 * POST /api/v1/blogs/:blogId/reactions
 */
export const addBlogReaction = async (req, res, next) => {
  try {
    const { userId } = req.auth;
    const { blogId } = req.params;
    const { reactionType = "like" } = req.body;

    if (!userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    if (!["like", "love", "insightful", "helpful"].includes(reactionType)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid reaction type",
        },
      });
    }

    if (!mongoose.isValidObjectId(blogId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid blog ID",
        },
      });
    }

    const blog = await RecruiterBlog.findById(blogId);
    if (!blog) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Blog not found",
        },
      });
    }

    // Check if user already reacted
    const existingReaction = await BlogReaction.findOne({ user: userId, blog: blogId });

    if (existingReaction) {
      // Update existing reaction
      existingReaction.reactionType = reactionType;
      await existingReaction.save();
    } else {
      // Create new reaction
      await BlogReaction.create({
        user: userId,
        blog: blogId,
        reactionType,
      });

      // Update blog likes count if it's a like
      if (reactionType === "like") {
        blog.likes = (blog.likes || 0) + 1;
        await blog.save();
      }
    }

    // Get reaction counts
    const reactionCounts = await BlogReaction.aggregate([
      { $match: { blog: new mongoose.Types.ObjectId(blogId) } },
      { $group: { _id: "$reactionType", count: { $sum: 1 } } },
    ]);

    const counts = reactionCounts.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    return res.json({
      message: "Reaction added successfully",
      reaction: {
        type: reactionType,
        userReacted: true,
      },
      counts: {
        like: counts.like || 0,
        love: counts.love || 0,
        insightful: counts.insightful || 0,
        helpful: counts.helpful || 0,
      },
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Remove reaction from blog
 * DELETE /api/v1/blogs/:blogId/reactions
 */
export const removeBlogReaction = async (req, res, next) => {
  try {
    const { userId } = req.auth;
    const { blogId } = req.params;

    if (!userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    const reaction = await BlogReaction.findOneAndDelete({ user: userId, blog: blogId });

    if (reaction && reaction.reactionType === "like") {
      // Decrement likes count
      const blog = await RecruiterBlog.findById(blogId);
      if (blog) {
        blog.likes = Math.max(0, (blog.likes || 0) - 1);
        await blog.save();
      }
    }

    return res.json({
      message: "Reaction removed successfully",
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get blog analytics
 * GET /api/v1/blogs/:blogId/analytics
 */
export const getBlogAnalytics = async (req, res, next) => {
  try {
    const { userId, userRole } = req.auth;
    const { blogId } = req.params;

    if (!userId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    if (!mongoose.isValidObjectId(blogId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid blog ID",
        },
      });
    }

    const blog = await RecruiterBlog.findById(blogId).lean();

    if (!blog) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Blog not found",
        },
      });
    }

    // Check if user is the author or admin
    const isAuthor = blog.author.toString() === userId;
    if (!isAuthor && userRole !== "admin" && userRole !== "super-admin") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "You don't have permission to view analytics for this blog",
        },
      });
    }

    // Get reaction counts
    const reactionCounts = await BlogReaction.aggregate([
      { $match: { blog: new mongoose.Types.ObjectId(blogId) } },
      { $group: { _id: "$reactionType", count: { $sum: 1 } } },
    ]);

    const counts = reactionCounts.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    // Get comment statistics
    const comments = blog.comments || [];
    const uniqueCommenters = new Set(comments.map((c) => c.user?.toString()).filter(Boolean)).size;

    return res.json({
      blog: {
        id: blog._id.toString(),
        title: blog.title,
      },
      analytics: {
        views: blog.views || 0,
        likes: blog.likes || 0,
        reactions: {
          like: counts.like || 0,
          love: counts.love || 0,
          insightful: counts.insightful || 0,
          helpful: counts.helpful || 0,
        },
        comments: {
          total: comments.length,
          uniqueCommenters,
        },
        publishedAt: blog.publishedAt,
        engagementRate: blog.views > 0 ? Math.round(((blog.likes || 0 + comments.length) / blog.views) * 100 * 100) / 100 : 0,
      },
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Share blog
 * POST /api/v1/blogs/:blogId/share
 */
export const shareBlog = async (req, res, next) => {
  try {
    const { blogId } = req.params;
    const { platform } = req.body; // 'facebook', 'twitter', 'linkedin', 'copy'

    if (!mongoose.isValidObjectId(blogId)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid blog ID",
        },
      });
    }

    const blog = await RecruiterBlog.findById(blogId);

    if (!blog) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Blog not found",
        },
      });
    }

    // Increment share count if tracking
    if (blog.metadata) {
      blog.metadata.shares = (blog.metadata.shares || 0) + 1;
    } else {
      blog.metadata = { shares: 1 };
    }
    await blog.save();

    // Generate share URL
    const shareUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/blogs/${blogId}`;

    // Generate platform-specific share URLs
    const shareLinks = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(blog.title)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
      copy: shareUrl,
    };

    return res.json({
      message: "Share link generated",
      shareUrl,
      platformLinks: shareLinks,
    });
  } catch (error) {
    return next(error);
  }
};

