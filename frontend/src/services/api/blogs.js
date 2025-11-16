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

