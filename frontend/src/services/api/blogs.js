import { apiRequest } from "./baseClient";

export const fetchPublishedBlogs = (params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", params.page);
  if (params.pageSize) searchParams.set("pageSize", params.pageSize);
  const query = searchParams.toString();
  return apiRequest(`/blogs${query ? `?${query}` : ""}`, {
    skipAuth: true,
  });
};

export const createBlog = (payload) =>
  apiRequest("/recruiter/blogs", {
    method: "POST",
    body: payload,
  });

export const toggleBlogLike = (blogId) =>
  apiRequest(`/blogs/${blogId}/like`, {
    method: "POST",
  });

export const addBlogComment = (blogId, message) =>
  apiRequest(`/blogs/${blogId}/comments`, {
    method: "POST",
    body: { message },
  });

/**
 * Advanced blog search
 * GET /api/v1/blogs/search
 */
export const searchBlogs = (params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.q) searchParams.set("q", params.q);
  if (params.category) searchParams.set("category", params.category);
  if (params.tags)
    searchParams.set(
      "tags",
      Array.isArray(params.tags) ? params.tags.join(",") : params.tags
    );
  if (params.author) searchParams.set("author", params.author);
  if (params.page) searchParams.set("page", params.page);
  if (params.pageSize) searchParams.set("pageSize", params.pageSize);
  if (params.sortBy) searchParams.set("sortBy", params.sortBy);
  const query = searchParams.toString();
  return apiRequest(`/blogs/search${query ? `?${query}` : ""}`, {
    skipAuth: true,
  });
};

/**
 * Get blog categories and tags
 * GET /api/v1/blogs/categories
 */
export const fetchBlogCategories = () => apiRequest("/blogs/categories");

/**
 * Add reaction to blog
 * POST /api/v1/blogs/:blogId/reactions
 */
export const addBlogReaction = (blogId, reactionType) =>
  apiRequest(`/blogs/${blogId}/reactions`, {
    method: "POST",
    body: { reactionType },
  });

/**
 * Remove reaction from blog
 * DELETE /api/v1/blogs/:blogId/reactions
 */
export const removeBlogReaction = (blogId) =>
  apiRequest(`/blogs/${blogId}/reactions`, {
    method: "DELETE",
  });

/**
 * Get blog analytics
 * GET /api/v1/blogs/:blogId/analytics
 */
export const fetchBlogAnalytics = (blogId) =>
  apiRequest(`/blogs/${blogId}/analytics`, {
    method: "GET",
  });

/**
 * Share blog
 * POST /api/v1/blogs/:blogId/share
 */
export const shareBlog = (blogId, platform) =>
  apiRequest(`/blogs/${blogId}/share`, {
    method: "POST",
    body: { platform },
    skipAuth: true,
  });

/**
 * Get user's pending blogs
 * GET /api/v1/recruiter/blogs?status=pending
 */
export const fetchUserPendingBlogs = (params = {}) => {
  const searchParams = new URLSearchParams();
  searchParams.set("status", "pending");
  if (params.page) searchParams.set("page", params.page);
  if (params.pageSize) searchParams.set("pageSize", params.pageSize);
  const query = searchParams.toString();
  return apiRequest(`/recruiter/blogs?${query}`);
};
