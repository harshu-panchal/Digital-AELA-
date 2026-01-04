import mongoose from "mongoose";
import RecruiterBlog from "../models/RecruiterBlog.js";
import RecruiterProfile from "../models/RecruiterProfile.js";
import StudentProfile from "../models/StudentProfile.js";
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
        .limit(Number(pageSize))
        .lean(),
      RecruiterBlog.countDocuments(criteria),
    ]);

    // Format items to include rejection info
    const formattedItems = items.map((item) => ({
      ...item,
      rejectedAt: item.rejectedAt || null,
      rejectionReason: item.rejectionReason || null,
    }));

    return res.json({
      data: formattedItems,
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
    const { userId, userRole } = req.auth;
    const { status, ...blogData } = req.body;

    // Super admins can publish directly, regular users go to pending
    let finalStatus = status || "draft";
    if (status === "published") {
      if (userRole === "super-admin") {
        // Super admin can publish directly
        finalStatus = "published";
      } else {
        // Regular users go to pending approval
        finalStatus = "pending";
      }
    }

    const blogPayload = {
      ...blogData,
      author: userId,
      status: finalStatus,
    };

    // Set publishedAt only if actually published (not pending)
    if (finalStatus === "published") {
      blogPayload.publishedAt = new Date();
    }

    const blog = await RecruiterBlog.create(blogPayload);

    // Create notification for super admin when blog needs approval (pending status)
    if (finalStatus === "pending") {
      try {
        const { createBulkNotifications } = await import("../utils/notificationHelper.js");

        // Get all super-admin users
        const superAdmins = await User.find({ role: "super-admin", isActive: true })
          .select("_id")
          .lean();

        if (superAdmins.length > 0) {
          const adminIds = superAdmins.map((admin) => admin._id);
          const author = await User.findById(userId).select("fullName").lean();
          const authorName = author?.fullName || "A recruiter";

          await createBulkNotifications(
            adminIds,
            "New Blog Pending Approval",
            `A new blog "${blog.title}" has been created by ${authorName} and requires approval.`,
            "approval",
            {
              blogId: blog._id.toString(),
              blogTitle: blog.title,
              authorId: userId,
              authorName: authorName,
              contentType: "blog",
            },
            `/super-admin/content-management?type=blog&id=${blog._id}`
          );
        }
      } catch (notifError) {
        // eslint-disable-next-line no-console
        console.error("[BlogCreation] Error creating approval notification:", notifError);
        // Don't fail blog creation if notification fails
      }
    }

    // Populate author for response
    const populatedBlog = await RecruiterBlog.findById(blog._id)
      .populate("author", "fullName email role metadata")
      .lean();

    // Format response to match frontend expectations
    const authorId = populatedBlog.author?._id
      ? populatedBlog.author._id.toString()
      : populatedBlog.author?.id;

    // Fetch profile for author to get avatarUrl (prioritize profile over metadata)
    let authorProfile = null;
    if (authorId) {
      // Try StudentProfile first, then RecruiterProfile
      authorProfile = await StudentProfile.findOne({ user: authorId })
        .select("avatarUrl")
        .lean();
      if (!authorProfile) {
        authorProfile = await RecruiterProfile.findOne({ user: authorId })
          .select("avatarUrl")
          .lean();
      }
    }

    const userAvatarUrl = populatedBlog.author?.metadata?.avatarUrl || null;
    const profileAvatarUrl = authorProfile?.avatarUrl || null;
    const finalAvatarUrl = profileAvatarUrl || userAvatarUrl;

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
      rejectedAt: populatedBlog.rejectedAt || null,
      rejectionReason: populatedBlog.rejectionReason || null,
      updatedAt: populatedBlog.updatedAt,
      createdAt: populatedBlog.createdAt,
      author: populatedBlog.author
        ? {
          id: authorId,
          _id: authorId,
          fullName: populatedBlog.author.fullName,
          role: populatedBlog.author.role,
          email: populatedBlog.author.email,
          avatarUrl: finalAvatarUrl,
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
    const { userId, userRole } = req.auth;
    const { blogId } = req.params;

    const blog = await RecruiterBlog.findOne({ _id: blogId, author: userId });

    if (!blog) {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Blog not found",
        },
      });
    }

    // Super admins can publish directly, regular users go to pending
    let newStatus = "pending";
    let updateData = { status: newStatus };

    if (userRole === "super-admin") {
      newStatus = "published";
      updateData = {
        status: newStatus,
        publishedAt: new Date(),
      };
    }

    const updatedBlog = await RecruiterBlog.findByIdAndUpdate(
      blogId,
      updateData,
      { new: true }
    );

    return res.json(updatedBlog);
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
          createdAt: -1,
        })
        .skip(skip)
        .limit(Number(pageSize))
        .populate("author", "fullName role email metadata")
        .lean(),
      RecruiterBlog.countDocuments({ status: "published" }),
    ]);

    const authorIds = items
      .map((blog) => blog.author?._id?.toString())
      .filter(Boolean);

    // Fetch both RecruiterProfile and StudentProfile for blog authors
    const [recruiterProfiles, studentProfiles] = await Promise.all([
      authorIds.length
        ? RecruiterProfile.find({ user: { $in: authorIds } })
          .select(["company", "headline", "avatarUrl", "stats", "socials", "user"])
          .lean()
        : [],
      authorIds.length
        ? StudentProfile.find({ user: { $in: authorIds } })
          .select(["headline", "avatarUrl", "user"])
          .lean()
        : [],
    ]);

    // Combine profiles into a single map, prioritizing profile avatarUrl
    const profileMap = {};
    [...recruiterProfiles, ...studentProfiles].forEach((profile) => {
      if (profile.user) {
        const userId = profile.user.toString();
        if (!profileMap[userId] || profile.avatarUrl) {
          profileMap[userId] = profile;
        }
      }
    });

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

    // Fetch comment authors with their profiles (similar to blog authors)
    const [commentAuthors, commentRecruiterProfiles, commentStudentProfiles] = await Promise.all([
      commentAuthorIds.size
        ? User.find({ _id: { $in: Array.from(commentAuthorIds) } })
          .select(["fullName", "email", "metadata"])
          .lean()
        : [],
      commentAuthorIds.size
        ? RecruiterProfile.find({ user: { $in: Array.from(commentAuthorIds) } })
          .select(["avatarUrl", "user"])
          .lean()
        : [],
      commentAuthorIds.size
        ? StudentProfile.find({ user: { $in: Array.from(commentAuthorIds) } })
          .select(["avatarUrl", "user"])
          .lean()
        : [],
    ]);

    const commentAuthorMap = commentAuthors.reduce((acc, user) => {
      acc[user._id.toString()] = user;
      return acc;
    }, {});

    // Create profile map for comment authors (prioritize profile avatarUrl)
    const commentAuthorProfileMap = {};
    [...commentRecruiterProfiles, ...commentStudentProfiles].forEach((profile) => {
      if (profile.user) {
        const userId = profile.user.toString();
        if (!commentAuthorProfileMap[userId] || profile.avatarUrl) {
          commentAuthorProfileMap[userId] = profile;
        }
      }
    });

    const data = items.map((blog) => {
      const authorId = blog.author?._id
        ? blog.author._id.toString()
        : blog.author?.id;
      const authorProfile =
        authorId && profileMap[authorId] ? profileMap[authorId] : null;
      // Get avatarUrl from user metadata if available (for all user types)
      const userAvatarUrl = blog.author?.metadata?.avatarUrl || null;
      // Prioritize profile avatarUrl over user metadata avatarUrl
      const profileAvatarUrl = authorProfile?.avatarUrl || null;
      const finalAvatarUrl = profileAvatarUrl || userAvatarUrl || "https://i.pravatar.cc/150?img=11";

      // Format comments with author info
      const formattedComments = (blog.comments || []).map((comment) => {
        const commentAuthorId = comment.author?.toString();
        const commentAuthor = commentAuthorId
          ? commentAuthorMap[commentAuthorId]
          : null;
        const commentAuthorProfile = commentAuthorId
          ? commentAuthorProfileMap[commentAuthorId]
          : null;

        // Get avatarUrl with priority: profile avatarUrl > user metadata avatarUrl > default
        const commentUserAvatarUrl = commentAuthor?.metadata?.avatarUrl || null;
        const commentProfileAvatarUrl = commentAuthorProfile?.avatarUrl || null;
        const commentFinalAvatarUrl = commentProfileAvatarUrl || commentUserAvatarUrl || "https://i.pravatar.cc/150?img=11";

        return {
          id: comment._id ? comment._id.toString() : crypto.randomUUID(),
          message: comment.message,
          createdAt: comment.createdAt || new Date().toISOString(),
          author: commentAuthor
            ? {
              id: commentAuthorId,
              name: commentAuthor.fullName || "User",
              avatar: commentFinalAvatarUrl,
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
            avatarUrl: finalAvatarUrl, // Prioritize profile avatarUrl, then user metadata avatarUrl
          }
          : null,
        recruiterProfile: authorProfile && authorProfile.company
          ? {
            company: authorProfile.company,
            headline: authorProfile.headline,
            avatarUrl: finalAvatarUrl,
            socials: authorProfile.socials,
            stats: authorProfile.stats,
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
    const authorId = commentAuthor?._id
      ? commentAuthor._id.toString()
      : commentAuthor?.id;

    // Fetch profile for comment author to get avatarUrl
    let commentAuthorProfile = null;
    if (authorId) {
      // Try StudentProfile first, then RecruiterProfile
      commentAuthorProfile = await StudentProfile.findOne({ user: authorId })
        .select("avatarUrl")
        .lean();
      if (!commentAuthorProfile) {
        commentAuthorProfile = await RecruiterProfile.findOne({ user: authorId })
          .select("avatarUrl")
          .lean();
      }
    }

    // Get avatarUrl with priority: profile avatarUrl > user metadata avatarUrl > default
    const commentUserAvatarUrl = commentAuthor?.metadata?.avatarUrl || null;
    const commentProfileAvatarUrl = commentAuthorProfile?.avatarUrl || null;
    const commentFinalAvatarUrl = commentProfileAvatarUrl || commentUserAvatarUrl || "https://i.pravatar.cc/150?img=11";

    const formattedComment = {
      id: savedComment._id.toString(),
      message: savedComment.message,
      createdAt: savedComment.createdAt,
      author: {
        id: authorId,
        name: commentAuthor?.fullName || "User",
        avatar: commentFinalAvatarUrl,
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
