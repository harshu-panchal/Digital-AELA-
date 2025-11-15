import RecruiterBlog from "../models/RecruiterBlog.js";
import RecruiterProfile from "../models/RecruiterProfile.js";

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
    const blog = await RecruiterBlog.create({
      ...req.body,
      author: userId,
    });

    return res.status(201).json(blog);
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
        .sort({ publishedAt: -1, updatedAt: -1 })
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

    const data = items.map((blog) => {
      const authorId = blog.author?._id ? blog.author._id.toString() : blog.author?.id;
      const recruiterProfile = authorId && profileMap[authorId] ? profileMap[authorId] : null;
      // Get avatarUrl from user metadata if available (for all user types)
      const userAvatarUrl = blog.author?.metadata?.avatarUrl || null;
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

