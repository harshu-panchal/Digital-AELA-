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

