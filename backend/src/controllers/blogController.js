import mongoose from "mongoose";
import RecruiterBlog from "../models/RecruiterBlog.js";
import RecruiterProfile from "../models/RecruiterProfile.js";
import User from "../models/User.js";

export const listBlogs = async (req, res, next) => {
  try {
    const { userId } = req.auth;
    const { status, page = 1, pageSize = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);

    const criteria = { author: userId };
    if (status) {
      criteria.status = status;
    }

    const [items, total] = await Promise.all([
      RecruiterBlog.find(criteria)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(Number(pageSize)),
      RecruiterBlog.countDocuments(criteria),
    ]);

    return res.json({
      data: items,
      meta: {
        page: Number(page),
        pageSize: Number(pageSize),
        total,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const createBlog = async (req, res, next) => {
  try {
    const { userId } = req.auth;
    const { status, ...blogData } = req.body;
    
    // Set publishedAt when status is "published"
    const blogPayload = {
      ...blogData,
      author: userId,
      status: status || "draft",
    };
    
    if (status === "published") {
      blogPayload.publishedAt = new Date();
    }
    
    const blog = await RecruiterBlog.create(blogPayload);
    
    // Populate author for response
    const populatedBlog = await RecruiterBlog.findById(blog._id)
      .populate("author", "fullName email role metadata")
      .lean();
    
    // Format response to match frontend expectations
    const authorId = populatedBlog.author?._id ? populatedBlog.author._id.toString() : populatedBlog.author?.id;
    const userAvatarUrl = populatedBlog.author?.metadata?.avatarUrl || null;
    
    const response = {
      _id: populatedBlog._id.toString(),
      id: populatedBlog._id.toString(),
      title: populatedBlog.title,
      excerpt: populatedBlog.excerpt || "",
      content: populatedBlog.content,
      coverImage: populatedBlog.coverImage || null,
      tags: populatedBlog.tags || [],
      status: populatedBlog.status,
      publishedAt: populatedBlog.publishedAt || null,
      updatedAt: populatedBlog.updatedAt,
      createdAt: populatedBlog.createdAt,
      author: populatedBlog.author
        ? {
            id: authorId,
            _id: authorId,
            fullName: populatedBlog.author.fullName,
            role: populatedBlog.author.role,
            email: populatedBlog.author.email,
            avatarUrl: userAvatarUrl,
          }
        : null,
    };

    return res.status(201).json(response);
  } catch (error) {
    return next(error);
  }
};

export const updateBlog = async (req, res, next) => {
  try {
    const { userId } = req.auth;
    const { blogId } = req.params;

    const blog = await RecruiterBlog.findOneAndUpdate(
      { _id: blogId, author: userId },
      { ...req.body },
      { new: true }
    );

    if (!blog) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Blog not found",
        },
      });
    }

    return res.json(blog);
  } catch (error) {
    return next(error);
  }
};

export const publishBlog = async (req, res, next) => {
  try {
    const { userId } = req.auth;
    const { blogId } = req.params;

    const blog = await RecruiterBlog.findOneAndUpdate(
      { _id: blogId, author: userId },
      {
        status: "published",
        publishedAt: new Date(),
      },
      { new: true }
    );

    if (!blog) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Blog not found",
        },
      });
    }

    return res.json(blog);
  } catch (error) {
    return next(error);
  }
};

export const listPublishedBlogs = async (req, res, next) => {
  try {
    const { page = 1, pageSize = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);

    const [items, total] = await Promise.all([
      RecruiterBlog.find({ status: "published" })
        .sort({ 
          publishedAt: -1, 
          createdAt: -1 
        })
        .skip(skip)
        .limit(Number(pageSize))
        .populate("author", ["fullName", "role", "email", "metadata"])
        .lean(),
      RecruiterBlog.countDocuments({ status: "published" }),
    ]);

    const authorIds = items
      .map((blog) => blog.author?._id?.toString())
      .filter(Boolean);

    const profiles = authorIds.length
      ? await RecruiterProfile.find({ user: { $in: authorIds } })
          .select(["company", "headline", "avatarUrl", "stats", "socials"])
          .lean()
      : [];

    const profileMap = profiles.reduce((acc, profile) => {
      if (profile.user) {
        acc[profile.user.toString()] = profile;
      }
      return acc;
    }, {});

    // Populate comment authors
    const commentAuthorIds = new Set();
    items.forEach((blog) => {
      if (blog.comments && Array.isArray(blog.comments)) {
        blog.comments.forEach((comment) => {
          if (comment.author) {
            commentAuthorIds.add(comment.author.toString());
          }
        });
      }
    });

    const commentAuthors = commentAuthorIds.size
      ? await User.find({ _id: { $in: Array.from(commentAuthorIds) } })
          .select(["fullName", "email", "metadata"])
          .lean()
      : [];

    const commentAuthorMap = commentAuthors.reduce((acc, user) => {
      acc[user._id.toString()] = user;
      return acc;
    }, {});

    const data = items.map((blog) => {
      const authorId = blog.author?._id ? blog.author._id.toString() : blog.author?.id;
      const recruiterProfile = authorId && profileMap[authorId] ? profileMap[authorId] : null;
      // Get avatarUrl from user metadata if available (for all user types)
      const userAvatarUrl = blog.author?.metadata?.avatarUrl || null;
      
      // Format comments with author info
      const formattedComments = (blog.comments || []).map((comment) => {
        const commentAuthorId = comment.author?.toString();
        const commentAuthor = commentAuthorId ? commentAuthorMap[commentAuthorId] : null;
        return {
          id: comment._id ? comment._id.toString() : crypto.randomUUID(),
          message: comment.message,
          createdAt: comment.createdAt || new Date().toISOString(),
          author: commentAuthor
            ? {
                id: commentAuthorId,
                name: commentAuthor.fullName || "User",
                avatar: commentAuthor.metadata?.avatarUrl || "https://i.pravatar.cc/150?img=11",
              }
            : {
                id: commentAuthorId || "unknown",
                name: "User",
                avatar: "https://i.pravatar.cc/150?img=11",
              },
        };
      });

      return {
        id: blog._id ? blog._id.toString() : blog.id,
        title: blog.title,
        excerpt: blog.excerpt,
        content: blog.content,
        coverImage: blog.coverImage ?? blog.thumbnail ?? null,
        tags: blog.tags ?? [],
        status: blog.status,
        publishedAt: blog.publishedAt,
        updatedAt: blog.updatedAt,
        likes: blog.likes ? blog.likes.map((id) => id.toString()) : [],
        likeCount: blog.likes ? blog.likes.length : 0,
        comments: formattedComments,
        commentCount: formattedComments.length,
        author: blog.author
          ? {
              id: authorId,
              fullName: blog.author.fullName,
              role: blog.author.role,
              email: blog.author.email,
              avatarUrl: userAvatarUrl, // Include avatarUrl from user metadata
            }
          : null,
        recruiterProfile: recruiterProfile
          ? {
              company: recruiterProfile.company,
              headline: recruiterProfile.headline,
              avatarUrl: recruiterProfile.avatarUrl || userAvatarUrl, // Prefer recruiter profile, fallback to user metadata
              socials: recruiterProfile.socials,
              stats: recruiterProfile.stats,
            }
          : null,
      };
    });

    return res.json({
      data,
      meta: {
        page: Number(page),
        pageSize: Number(pageSize),
        total,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const toggleLike = async (req, res, next) => {
  try {
    const { userId } = req.auth;
    const { blogId } = req.params;

    // Validate ObjectId format
    if (!blogId || !mongoose.Types.ObjectId.isValid(blogId)) {
      return res.status(400).json({
        error: {
          code: "INVALID_ID",
          message: "Invalid blog ID format",
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

    // Only allow liking published blogs
    if (blog.status !== "published") {
      return res.status(403).json({
        error: {
          code: "BLOG_NOT_PUBLISHED",
          message: "Cannot like unpublished blog",
        },
      });
    }

    // Check if user already has a like reaction
    const BlogReaction = (await import("../models/BlogReaction.js")).default;
    const existingReaction = await BlogReaction.findOne({
      user: userId,
      blog: blogId,
      reactionType: "like",
    });

    if (existingReaction) {
      // Remove like
      await BlogReaction.deleteOne({ _id: existingReaction._id });
      blog.likes = Math.max(0, (blog.likes || 0) - 1);
    } else {
      // Add like
      await BlogReaction.findOneAndUpdate(
        { user: userId, blog: blogId },
        { user: userId, blog: blogId, reactionType: "like" },
        { upsert: true, new: true }
      );
      blog.likes = (blog.likes || 0) + 1;
    }

    await blog.save();

    return res.json({
      liked: !existingReaction,
      likesCount: blog.likes,
    });
  } catch (error) {
    return next(error);
  }
};

export const addComment = async (req, res, next) => {
  try {
    const { userId } = req.auth;
    const { blogId } = req.params;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Comment message is required",
        },
      });
    }

    // Validate ObjectId format
    if (!blogId || !mongoose.Types.ObjectId.isValid(blogId)) {
      return res.status(400).json({
        error: {
          code: "INVALID_ID",
          message: "Invalid blog ID format",
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

    // Only allow commenting on published blogs
    if (blog.status !== "published") {
      return res.status(403).json({
        error: {
          code: "BLOG_NOT_PUBLISHED",
          message: "Cannot comment on unpublished blog",
        },
      });
    }

    // Add comment
    blog.comments.push({
      author: userId,
      message: message.trim(),
      createdAt: new Date(),
    });

    await blog.save();

    // Populate comment author for response
    const savedComment = blog.comments[blog.comments.length - 1];
    await blog.populate({
      path: "comments.author",
      select: "fullName email metadata",
    });

    const commentAuthor = savedComment.author;
    const authorId = commentAuthor?._id ? commentAuthor._id.toString() : commentAuthor?.id;

    const formattedComment = {
      id: savedComment._id.toString(),
      message: savedComment.message,
      createdAt: savedComment.createdAt,
      author: {
        id: authorId,
        name: commentAuthor?.fullName || "User",
        avatar: commentAuthor?.metadata?.avatarUrl || "https://i.pravatar.cc/150?img=11",
      },
    };

    return res.status(201).json({
      comment: formattedComment,
      commentCount: blog.comments.length,
    });
  } catch (error) {
    return next(error);
  }
};

