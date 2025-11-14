import { apiRequest } from "./baseClient";

/**
 * Create course (super admin)
 */
export const createCourse = (payload) =>
  apiRequest("/admin/courses", {
    method: "POST",
    body: payload,
  });

/**
 * Create ebook (super admin)
 */
export const createEbook = (payload) =>
  apiRequest("/admin/ebooks", {
    method: "POST",
    body: payload,
  });

/**
 * Create blog (super admin)
 */
export const createBlog = (payload) =>
  apiRequest("/admin/blogs", {
    method: "POST",
    body: payload,
  });

